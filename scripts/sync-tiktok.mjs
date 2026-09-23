import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'lumina-analytics-kd-2026',
  appId: '1:766102727241:web:670178653dfc59d24aad98',
  storageBucket: 'lumina-analytics-kd-2026.firebasestorage.app',
  apiKey: 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc',
  authDomain: 'lumina-analytics-kd-2026.firebaseapp.com',
  messagingSenderId: '766102727241'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1540098204714930319/w71fW-1Am_A4LVtIFg-2-b8s9J5Vryi32q_0LwTB76kX_j-yRQMhFMVRYt8wpiPqwPa9';

async function sendDiscordLiveNotification(platform, title, liveUrl) {
  try {
    const isYouTube = platform === 'YouTube';
    const payload = {
      username: 'Karam Live',
      avatar_url: 'https://p16-common-sign.tiktokcdn-eu.com/tos-no1a-avt-0068c001-no/0ace94e1ff2808e8032a8a8af1799c75~tplv-tiktokx-cropcenter:1080:1080.jpeg',
      content: '@everyone 🔴 **Karamokho est actuellement EN DIRECT sur ' + platform + ' !**',
      embeds: [{
        title: '🔴 [DIRECT] REJOINDRE LE LIVE STREAM SUR ' + platform.toUpperCase(),
        url: liveUrl,
        description: '🚀 **Karamokho DRAMÉ (@' + (isYouTube ? 'karamdrm' : 'karam.drame') + ')** a démarré une session live !\n\nVenez participer, poser vos questions et suivre la session en direct.\n\n👉 **[🔴 CLIQUEZ ICI POUR REJOINDRE LE DIRECT (1 CLIC) ↗](' + liveUrl + ')**',
        color: isYouTube ? 16711680 : 2487534,
        thumbnail: {
          url: isYouTube ? 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' : 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png'
        },
        fields: [
          { name: '📺 Plateforme', value: platform + ' Live', inline: true },
          { name: '⚡ Statut', value: '🔴 EN DIRECT', inline: true },
          { name: '👤 Créateur', value: '@' + (isYouTube ? 'karamdrm' : 'karam.drame'), inline: true },
          { name: '🔗 Lien d\'accès direct', value: '[**' + liveUrl.replace('https://', '') + '**](' + liveUrl + ')', inline: false }
        ],
        footer: {
          text: 'Lumina Analytics • Alerte Automatique ' + platform + ' Live'
        },
        timestamp: new Date().toISOString()
      }]
    };

    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Discord Webhook (' + platform + ') envoyé avec statut:', res.status);
  } catch (e) {
    console.error('Erreur webhook Discord:', e.message);
  }
}

async function fetchLiveVideoStats(videoId) {
  try {
    const url = 'https://www.tiktok.com/@karam.drame/video/' + videoId;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!res.ok) return null;
    const html = await res.text();
    const idStr = '__UNIVERSAL_DATA_FOR_REHYDRATION__';
    const idx = html.indexOf(idStr);
    if (idx === -1) return null;

    const tagClose = html.indexOf('>', idx);
    const endTag = html.indexOf('</script>', tagClose);
    const content = html.substring(tagClose + 1, endTag);
    const json = JSON.parse(content);
    const itemInfo = json.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
    
    if (itemInfo && itemInfo.stats) {
      return {
        views: Number(itemInfo.stats.playCount) || 0,
        likes: Number(itemInfo.stats.diggCount) || 0,
        comments: Number(itemInfo.stats.commentCount) || 0,
        shares: Number(itemInfo.stats.shareCount) || 0,
        collects: Number(itemInfo.stats.collectCount) || 0,
        coverUrl: itemInfo.video?.cover || itemInfo.video?.dynamicCover || '',
        title: itemInfo.desc || ''
      };
    }
  } catch (err) {
    // ignore
  }
  return null;
}

async function syncAllVideos() {
  console.log('Demarrage de la synchronisation complete (Videos + Profil + Verification Lives)...');
  
  const userDocRef = doc(db, 'users', 'karamokho');
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    console.error('Document users/karamokho introuvable.');
    process.exit(1);
  }

  const userData = snap.data();
  console.log('Analyse du catalogue de videos...');

  let liveFollowers = userData.tiktokAPI?.followers || 6163;
  let liveTotalLikes = userData.tiktokAPI?.totalLikes || 16000;
  let liveAvatar = userData.tiktokAPI?.avatar_url || '';
  
  let allVideos = userData.tiktokAPI?.recentVideos || [];

  // ==========================================
  // SYNC OFFICIELLE API TIKTOK (OAUTH V2)
  // ==========================================
  let apiSuccess = false;
  try {
    const authData = userData.tiktokAuth;
    if (authData && authData.refreshToken) {
      console.log('Jeton d\'authentification trouve. Tentative de rafraichissement du token via l\'API officielle...');

      const clientKey = process.env.TIKTOK_CLIENT_KEY || 'awvtvw7x4d0t2f69';
      const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

      if (clientKey && clientSecret) {
        // Refresh token
        const params = new URLSearchParams();
        params.append('client_key', clientKey);
        params.append('client_secret', clientSecret);
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', authData.refreshToken);

        const refreshRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });

        const refreshData = await refreshRes.json();
        if (refreshData.access_token) {
           console.log("Jeton d'acces rafraichi avec succes !");
           const accessToken = refreshData.access_token;

           // Fetch toutes les vidéos (Pagination)
           let newVideos = [];
           let hasMore = true;
           let cursor = 0;
           let attempts = 0;

           while (hasMore && attempts < 15) {
             attempts++;
             const payload = { max_count: 20 };
             if (cursor !== 0) payload.cursor = cursor;

             const vRes = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,create_time,cover_image_url,share_url,video_description,duration,title,like_count,comment_count,share_count,view_count', {
               method: 'POST',
               headers: {
                 'Authorization': `Bearer ${accessToken}`,
                 'Content-Type': 'application/json'
               },
               body: JSON.stringify(payload)
             });

             const vJson = await vRes.json();
             if (vJson.data && vJson.data.videos) {
               const batch = vJson.data.videos.map(v => ({
                 id: v.id,
                 title: v.title || v.video_description || "Video TikTok",
                 date: new Date(v.create_time * 1000).toISOString(),
                 durationMins: Math.round(v.duration / 60) || (v.duration > 0 ? 1 : 0),
                 views: v.view_count || 0,
                 likes: v.like_count || 0,
                 comments: v.comment_count || 0,
                 shares: v.share_count || 0,
                 coverUrl: v.cover_image_url || "",
                 shareUrl: v.share_url || `https://www.tiktok.com/@karam.drame/video/${v.id}`
               }));
               newVideos = newVideos.concat(batch);
               hasMore = vJson.data.has_more === true;
               cursor = vJson.data.cursor;
             } else {
               hasMore = false;
             }
           }

           if (newVideos.length > 0) {
              allVideos = newVideos.sort((a, b) => new Date(b.date) - new Date(a.date));
              apiSuccess = true;
              console.log(`✅ API Officielle : ${allVideos.length} videos recuperees.`);

              // Mettre a jour les tokens
              await updateDoc(userDocRef, {
                 'tiktokAuth.accessToken': accessToken,
                 'tiktokAuth.refreshToken': refreshData.refresh_token || authData.refreshToken,
                 'tiktokAuth.updatedAt': new Date().toISOString()
              });
           }
        } else {
           console.warn("Echec du rafraichissement du token:", refreshData);
        }
      } else {
         console.log("Client Key/Secret manquants. Utilisation de la recuperation en mode public (Fallback).");
      }
    }
  } catch (err) {
    console.warn("Erreur API officielle:", err.message);
  }

  if (!apiSuccess) {
     console.log("L'API officielle n'a pas pu aboutir. Utilisation des dernieres videos connues (Mode Degradé).");
  }

  // LIVE TIKTOK VARIABLES
  let isTikTokLive = false;
  let liveRoomId = null;
  let liveTitle = 'Session Live TikTok';
  let liveCurrentViewers = 0;
  let livePeakViewers = Number(userData.tiktokLiveAPI?.peakViewers || 0);
  let liveStartedAt = userData.tiktokLiveAPI?.started_at || new Date().toISOString();
  let liveLikes = Number(userData.tiktokLiveAPI?.likes || 0);

  try {
    const profileRes = await fetch('https://www.tiktok.com/@karam.drame', {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9', 'Cache-Control': 'no-cache' }
    });
    if (profileRes.ok) {
      const html = await profileRes.text();
      const idx = html.indexOf('__UNIVERSAL_DATA_FOR_REHYDRATION__');
      if (idx !== -1) {
        const tagClose = html.indexOf('>', idx);
        const endTag = html.indexOf('</script>', tagClose);
        const json = JSON.parse(html.substring(tagClose + 1, endTag));
        const userDetail = json.__DEFAULT_SCOPE__?.['webapp.user-detail'];
        const userInfo = userDetail?.userInfo?.user;
        if (userDetail?.userInfo?.stats) {
          liveFollowers = userDetail.userInfo.stats.followerCount || liveFollowers;
          liveTotalLikes = userDetail.userInfo.stats.heart || userDetail.userInfo.stats.heartCount || liveTotalLikes;
        }
        if (userInfo?.avatarLarger) {
          liveAvatar = userInfo.avatarLarger;
        }

        // Detection Live via Webcast API (Verification stricte d'identite et de statut actif)
        if (userInfo?.roomId) {
          const detectedRoomId = String(userInfo.roomId);
          console.log('Room ID detecte sur profil:', detectedRoomId);
          try {
            const webcastRes = await fetch('https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=' + detectedRoomId, {
              headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json', 'Referer': 'https://www.tiktok.com/@karam.drame' }
            });
            if (webcastRes.ok) {
              const roomJson = await webcastRes.json();
              const room = roomJson.data;
              const ownerHandle = String(room?.owner?.display_id || room?.owner?.unique_id || '').toLowerCase();
              const ownerId = String(room?.owner?.id_str || room?.owner?.id || '');
              const targetUserId = String(userInfo?.id || '7030929632657638405');
              const isOwnerValid = (ownerHandle === 'karam.drame') || (ownerId && ownerId === targetUserId);

              if (room && room.status === 2 && isOwnerValid) {
                isTikTokLive = true;
                liveRoomId = detectedRoomId;
                liveTitle = room.title || liveTitle;
                liveCurrentViewers = Number(room.user_count || 0);
                livePeakViewers = Math.max(livePeakViewers, liveCurrentViewers);
                liveLikes = Math.max(liveLikes, Number(room.like_count || 0));
                if (room.create_time) {
                  liveStartedAt = new Date(room.create_time * 1000).toISOString();
                }
                console.log('🔴 LIVE TIKTOK CONFIRME POUR KARAM :', liveTitle, 'Viewers:', liveCurrentViewers);
              } else {
                if (room && !isOwnerValid) {
                  console.log(`⚪ Live tiers ignore (Room ${detectedRoomId} appartient a @${ownerHandle}, pas a @karam.drame).`);
                } else if (room && room.status !== 2) {
                  console.log(`⚪ Live termine ou inactif (status: ${room?.status}).`);
                }
                isTikTokLive = false;
                liveRoomId = '';
                liveCurrentViewers = 0;
              }
            }
          } catch(webcastErr) {
            console.warn('Erreur webcast room info:', webcastErr.message);
            isTikTokLive = false;
            liveRoomId = '';
            liveCurrentViewers = 0;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Erreur profil global:', e.message);
  }

  let isYouTubeLive = false;
  try {
    const ytRes = await fetch('https://www.youtube.com/@karamdrm/live', {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'fr-FR,fr;q=0.9', 'Cache-Control': 'no-cache' }
    });
    if (ytRes.ok) {
      const ytHtml = await ytRes.text();
      if (ytHtml.includes(' isLive:true') || ytHtml.includes('style:LIVE')) {
        isYouTubeLive = true;
      }
    }
  } catch(e) {
    console.warn('Erreur verif YouTube Live:', e.message);
  }

  // SECURITE STRICTE : Desactive par defaut, envoi uniquement si Karam a active manuellement le switch
  const autoBroadcastEnabled = (userData.autoBroadcastEnabled === true || userData.tiktokLiveAPI?.autoBroadcastEnabled === true);
  const prevTikTokLive = userData.tiktokLiveAPI?.isLive || false;
  const prevYouTubeLive = userData.youtubeLiveAPI?.isLive || false;

  if (isTikTokLive && !prevTikTokLive && autoBroadcastEnabled) {
    console.log('Notification Discord autorisee pour TikTok Live.');
    await sendDiscordLiveNotification('TikTok', 'Karamokho est en direct sur TikTok !', 'https://www.tiktok.com/@karam.drame/live');
  }

  if (isYouTubeLive && !prevYouTubeLive && autoBroadcastEnabled) {
    console.log('Notification Discord autorisee pour YouTube Live.');
    await sendDiscordLiveNotification('YouTube', 'Karamokho est en direct sur YouTube !', 'https://www.youtube.com/@karamdrm/live');
  }

  const updatedVideos = [...allVideos];
  
  // Mettre à jour les statistiques individuelles si l'API officielle n'a pas pu être utilisée
  if (!apiSuccess) {
    const BATCH_SIZE = 5;
    for (let i = 0; i < updatedVideos.length; i += BATCH_SIZE) {
      const batch = updatedVideos.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (v, index) => {
        const realIndex = i + index;
        const liveStats = await fetchLiveVideoStats(v.id);
        if (liveStats) {
          updatedVideos[realIndex] = {
            ...v,
            views: liveStats.views,
            likes: liveStats.likes,
            comments: liveStats.comments,
            shares: liveStats.shares,
            coverUrl: liveStats.coverUrl || v.coverUrl,
            title: liveStats.title || v.title
          };
        }
      });

      await Promise.all(promises);
      await new Promise(r => setTimeout(r, 150));
    }
  }

  const totalViews = updatedVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0);
  const totalLikes = (apiSuccess && updatedVideos.length > 0)
      ? updatedVideos.reduce((acc, v) => acc + (Number(v.likes) || 0), 0)
      : (liveTotalLikes || updatedVideos.reduce((acc, v) => acc + (Number(v.likes) || 0), 0));
  const totalComments = updatedVideos.reduce((acc, v) => acc + (Number(v.comments) || 0), 0);
  const totalShares = updatedVideos.reduce((acc, v) => acc + (Number(v.shares) || 0), 0);
  const engagementRate = totalViews > 0 ? (((totalLikes + totalComments + totalShares) / totalViews) * 100).toFixed(1) + '%' : '6.1%';

  const videoAnalytics = {
    avgViews: updatedVideos.length > 0 ? Math.round(totalViews / updatedVideos.length) : 0,
    avgLikes: updatedVideos.length > 0 ? Math.round(totalLikes / updatedVideos.length) : 0,
    avgComments: updatedVideos.length > 0 ? Math.round(totalComments / updatedVideos.length) : 0,
    totalVideosAnalyzed: updatedVideos.length,
    engagementRate
  };

  const payload = {
    'tiktokAPI.followers': liveFollowers,
    'tiktokAPI.likes': liveTotalLikes,
    'tiktokAPI.totalLikes': liveTotalLikes,
    'tiktokAPI.views': totalViews,
    'tiktokAPI.shares': totalShares,
    'tiktokAPI.totalComments': totalComments,
    'tiktokAPI.engagementRate': engagementRate,
    'tiktokAPI.avatar_url': liveAvatar,
    'tiktokAPI.recentVideos': updatedVideos,
    'tiktokAPI.videoAnalytics': videoAnalytics,
    'tiktokAPI.lastSync': new Date().toISOString(),
    'tiktokLiveAPI.isLive': isTikTokLive,
    'tiktokLiveAPI.roomId': liveRoomId || userData.tiktokLiveAPI?.roomId || '',
    'tiktokLiveAPI.title': liveTitle,
    'tiktokLiveAPI.currentViewers': liveCurrentViewers,
    'tiktokLiveAPI.peakViewers': livePeakViewers,
    'tiktokLiveAPI.likes': liveLikes,
    'tiktokLiveAPI.started_at': liveStartedAt,
    'tiktokLiveAPI.lastDetected': new Date().toISOString(),
    'tiktokAPI.isLive': isTikTokLive,
    'youtubeLiveAPI.isLive': isYouTubeLive
  };

  console.log('TOTAUX ACTUALISES : ' + totalViews + ' vues cumulees, ' + totalLikes + ' likes, ' + liveFollowers + ' followers.');
  if (isTikTokLive) {
    console.log('🔴 LIVE TIKTOK ENREGISTRE DANS FIRESTORE AVEC SUCCES : ' + liveTitle + ' (' + liveCurrentViewers + ' spectateurs)');
  }

  await updateDoc(userDocRef, payload);
  console.log('Firestore mis a jour avec succes !');

  try {
    const dataJsonPath = './public/api/data.json';
    if (fs.existsSync(dataJsonPath)) {
      const currentJson = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
      currentJson.tiktok = {
        ...(currentJson.tiktok || {}),
        followers: liveFollowers,
        likes: liveTotalLikes,
        totalLikes: liveTotalLikes,
        views: totalViews,
        shares: totalShares,
        comments: totalComments,
        avatar_url: liveAvatar,
        recentVideos: updatedVideos,
        videoAnalytics,
        isLive: isTikTokLive,
        lastSync: new Date().toISOString()
      };
      currentJson.tiktokLiveAPI = {
        ...(currentJson.tiktokLiveAPI || {}),
        isLive: isTikTokLive,
        roomId: liveRoomId,
        title: liveTitle,
        currentViewers: liveCurrentViewers,
        peakViewers: livePeakViewers,
        likes: liveLikes,
        started_at: liveStartedAt
      };
      fs.writeFileSync(dataJsonPath, JSON.stringify(currentJson, null, 2), 'utf8');
      console.log('public/api/data.json synchronise !');
    }
  } catch(e) {
    console.error('Erreur MAJ data.json:', e.message);
  }

  process.exit(0);
}

syncAllVideos();
