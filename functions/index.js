const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getSecret } = require("./secrets");

admin.initializeApp();
const db = getFirestore();

// Load & export additional Cloud Functions (webhooks & Pub/Sub handlers)
const { tiktokLiveWebhook } = require('./tiktokLiveWebhook');
const { youtubeLivePush } = require('./youtubeLivePush');
exports.tiktokLiveWebhook = tiktokLiveWebhook;
exports.youtubeLivePush = youtubeLivePush;

const YOUTUBE_CHANNEL_ID = "UC_V-hdqGtizf9g7gxahdmqQ"; 
const YOUTUBE_UPLOADS_PLAYLIST_ID = "UU_V-hdqGtizf9g7gxahdmqQ";

// Helper: Convert ISO 8601 duration (PT1M30S) to seconds
function parseISODuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

// Helper: Check if video is Short
async function isShortVideo(videoId) {
  try {
    const response = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      method: 'HEAD',
      redirect: 'follow'
    });
    return response.url.includes('/shorts/');
  } catch (e) {
    return false;
  }
}

// Main processing function for any channel's playlist
async function processChannelData(channelIdOrHandle, isHandle = false) {
  const apiKey = await getSecret('YOUTUBE_API_KEY');
  const channelQuery = isHandle ? `forHandle=${channelIdOrHandle}` : `id=${channelIdOrHandle}`;
  const channelUrl = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&${channelQuery}&key=${apiKey}`;
  
  const channelResponse = await fetch(channelUrl);
  const channelData = await channelResponse.json();

  if (!channelData.items || channelData.items.length === 0) {
    throw new Error(`Chaîne introuvable pour: ${channelIdOrHandle}`);
  }

  const channelInfo = channelData.items[0];
  const stats = channelInfo.statistics;
  const snippet = channelInfo.snippet;
  const uploadsPlaylistId = channelInfo.contentDetails.relatedPlaylists.uploads;

  const playlistUrl = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`;
  const playlistResponse = await fetch(playlistUrl);
  const playlistData = await playlistResponse.json();

  let videosData = [];

  if (playlistData.items && playlistData.items.length > 0) {
    const videoIds = playlistData.items.map(item => item.contentDetails.videoId).join(',');
    const videosUrl = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,liveStreamingDetails&id=${videoIds}&key=${apiKey}`;
    const videosResponse = await fetch(videosUrl);
    const videosDetails = await videosResponse.json();

    if (videosDetails.items) {
      const shortChecks = await Promise.all(videosDetails.items.map(v => isShortVideo(v.id)));

      videosData = videosDetails.items.map((v, index) => {
        const vStats = v.statistics || {};
        const views = parseInt(vStats.viewCount || '0', 10);
        const likes = parseInt(vStats.likeCount || '0', 10);
        const comments = parseInt(vStats.commentCount || '0', 10);
        const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
        
        let type = 'Vidéo';
        // Si c'est un live ou un ancien live
        if (v.snippet.liveBroadcastContent === 'live' || v.snippet.liveBroadcastContent === 'upcoming' || v.liveStreamingDetails) {
          type = 'Direct';
        } else if (shortChecks[index]) {
          type = 'Short';
        }
        
        const durationSec = parseISODuration(v.contentDetails.duration);

        return {
          id: v.id,
          title: v.snippet.title,
          publishedAt: v.snippet.publishedAt,
          thumbnailUrl: v.snippet.thumbnails?.medium?.url || '',
          durationSec: durationSec,
          views: views,
          likes: likes,
          comments: comments,
          engagementRate: parseFloat(engagementRate.toFixed(2)),
          type: type
        };
      });
    }
  }

  // Analyses globales de la chaîne
  const sampleViews = videosData.reduce((acc, v) => acc + v.views, 0);
  const sampleLikes = videosData.reduce((acc, v) => acc + v.likes, 0);
  const sampleComments = videosData.reduce((acc, v) => acc + v.comments, 0);
  const globalEngagementRate = sampleViews > 0 ? ((sampleLikes + sampleComments) / sampleViews) * 100 : 0;

  // Séparation pour analyses spécifiques
  const shorts = videosData.filter(v => v.type === 'Short');
  const videos = videosData.filter(v => v.type === 'Vidéo');

  const avgShortDuration = shorts.length > 0 ? shorts.reduce((acc, v) => acc + v.durationSec, 0) / shorts.length : 0;
  const avgVideoDuration = videos.length > 0 ? videos.reduce((acc, v) => acc + v.durationSec, 0) / videos.length : 0;

  // Calcul du rythme de publication estimé (basé sur la fréquence de l'échantillon)
  let estimatedPerMonth = 0;
  let estimatedPerYear = 0;
  let estimatedShortsPerMonth = 0;
  let estimatedVideosPerMonth = 0;

  if (videosData.length > 1) {
    const oldestVideo = videosData[videosData.length - 1];
    const newestVideo = videosData[0];
    const timespanMs = new Date(newestVideo.publishedAt).getTime() - new Date(oldestVideo.publishedAt).getTime();
    const timespanDays = Math.max(1, timespanMs / (1000 * 60 * 60 * 24));
    const videosPerDay = videosData.length / timespanDays;
    
    estimatedPerMonth = Math.round(videosPerDay * 30);
    estimatedPerYear = Math.round(videosPerDay * 365);
    
    const shortsRatio = shorts.length / videosData.length;
    estimatedShortsPerMonth = Math.round(estimatedPerMonth * shortsRatio);
    estimatedVideosPerMonth = estimatedPerMonth - estimatedShortsPerMonth;
  } else if (videosData.length === 1) {
    estimatedPerMonth = 1;
    estimatedPerYear = 12;
    estimatedShortsPerMonth = shorts.length;
    estimatedVideosPerMonth = videos.length;
  }

  const result = {
    channel: {
      id: channelInfo.id,
      title: snippet.title,
      description: snippet.description,
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
      customUrl: snippet.customUrl,
      publishedAt: snippet.publishedAt,
      subscribers: parseInt(stats.subscriberCount || '0', 10),
      totalViews: parseInt(stats.viewCount || '0', 10),
      videoCount: parseInt(stats.videoCount || '0', 10),
      globalEngagementRate: parseFloat(globalEngagementRate.toFixed(2)),
      totalLikes: sampleLikes, // likes cumulés sur l'échantillon
      lastSync: FieldValue.serverTimestamp()
    },
    analytics: {
      estimatedPerMonth,
      estimatedPerYear,
      estimatedShortsPerMonth,
      estimatedVideosPerMonth,
      shortsCount: shorts.length,
      videosCount: videos.length,
      avgShortDurationSec: Math.round(avgShortDuration),
      avgVideoDurationSec: Math.round(avgVideoDuration)
    },
    videos: videosData
  };

  return result;
}

async function performYouTubeSync() {
  console.log("Exécution de la synchronisation YouTube globale...");
  
  // 1. Analyse de la chaîne principale (Karamokho)
  const karamData = await processChannelData(YOUTUBE_CHANNEL_ID, false);
  
  const sortedByViews = [...karamData.videos].sort((a, b) => b.views - a.views);
  const topVideos = sortedByViews.slice(0, 10);

  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const oldVideos = karamData.videos.filter(v => new Date(v.publishedAt) < twoDaysAgo);
  const weakVideos = oldVideos.sort((a, b) => a.views - b.views).slice(0, 20);

  const userRef = db.collection('users').doc('karamokho');
  const userDoc = await userRef.get();
  
  // 2. Veille concurrentielle
  const trackedCompetitorUrls = userDoc.exists ? (userDoc.data().trackedCompetitors || []) : [];
  const competitorsData = [];

  for (const url of trackedCompetitorUrls) {
    try {
      // Extraction de l'ID ou du Handle depuis l'URL (ex: https://youtube.com/@comptahero)
      let idOrHandle = url;
      let isHandle = false;
      if (url.includes('@')) {
        // Enlève les ?si=... ou /featured etc.
        idOrHandle = url.split('@')[1].split('/')[0].split('?')[0];
        isHandle = true;
      } else if (url.includes('/channel/')) {
        idOrHandle = url.split('/channel/')[1].split('/')[0].split('?')[0];
      }

      const compData = await processChannelData(idOrHandle, isHandle);

      competitorsData.push({
        id: compData.channel.id,
        originalUrl: url,
        customUrl: compData.channel.customUrl || url,
        title: compData.channel.title,
        thumbnailUrl: compData.channel.thumbnail,
        subscribers: compData.channel.subscribers,
        totalViews: compData.channel.totalViews,
        videoCount: compData.channel.videoCount,
        engagementRate: compData.channel.globalEngagementRate,
        totalLikes: compData.channel.totalLikes,
        estimatedPerMonth: compData.analytics.estimatedPerMonth,
        estimatedPerYear: compData.analytics.estimatedPerYear,
        estimatedShortsPerMonth: compData.analytics.estimatedShortsPerMonth,
        estimatedVideosPerMonth: compData.analytics.estimatedVideosPerMonth,
        shortsCount: compData.analytics.shortsCount,
        videosCount: compData.analytics.videosCount,
        avgShortDurationSec: compData.analytics.avgShortDurationSec,
        avgVideoDurationSec: compData.analytics.avgVideoDurationSec,
        videos: compData.videos
      });
    } catch (e) {
      console.error(`Erreur sync concurrent ${url}:`, e);
    }
  }

  // 3. Sauvegarde dans Firestore
  await userRef.set({
    youtubeAPI: {
      channel: karamData.channel,
      analytics: karamData.analytics,
      videos: karamData.videos,
      topVideos: topVideos,
      weakVideos: weakVideos,
      competitors: competitorsData
    }
  }, { merge: true });

  console.log("Synchronisation terminée avec succès.");
}

exports.syncYouTubeData = functions.pubsub.schedule("*/10 * * * *").onRun(async (context) => {
  try {
    await performYouTubeSync();
  } catch (error) {
    console.error("Erreur (Cron):", error);
  }
});

exports.forceSyncYouTube = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  try {
    await performYouTubeSync();
    res.status(200).send({ success: true, message: "Synchronisation réussie !" });
  } catch (error) {
    console.error("Erreur (HTTP):", error);
    res.status(500).send({ success: false, error: error.message });
  }
});

// ==========================================
// TIKTOK INTEGRATION
// ==========================================
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || 'MISSING_CLIENT_KEY';
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || 'MISSING_CLIENT_SECRET';
const TIKTOK_REDIRECT_URI = 'https://us-central1-lumina-analytics-kd-2026.cloudfunctions.net/tiktokCallback';

exports.tiktokAuth = functions.https.onRequest((req, res) => {
  const csrfState = Math.random().toString(36).substring(2);
  let url = 'https://www.tiktok.com/v2/auth/authorize/';
  url += `?client_key=${TIKTOK_CLIENT_KEY}`;
  url += '&scope=user.info.basic,user.info.stats,video.list';
  url += '&response_type=code';
  url += `&redirect_uri=${encodeURIComponent(TIKTOK_REDIRECT_URI)}`;
  url += '&state=' + csrfState;
  
  res.redirect(url);
});

exports.tiktokCallback = functions.https.onRequest(async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    const params = new URLSearchParams();
    params.append('client_key', TIKTOK_CLIENT_KEY);
    params.append('client_secret', TIKTOK_CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', TIKTOK_REDIRECT_URI);

    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();
    if (!data.access_token) {
      throw new Error('Failed to obtain access token: ' + JSON.stringify(data));
    }

    const userRef = db.collection('users').doc('karamokho');
    await userRef.set({
      tiktokAuth: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        openId: data.open_id,
        updatedAt: FieldValue.serverTimestamp()
      }
    }, { merge: true });

    // Redirige vers le dashboard TikTok une fois connecté
    res.redirect('https://lumina-analytics-kd-2026.web.app/tiktok');
  } catch (error) {
    console.error('Error in tiktokCallback:', error);
    res.status(500).send('Authentication failed: ' + error.message);
  }
});

exports.forceSyncTikTok = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  try {
    const userRef = db.collection('users').doc('karamokho');
    const docSnap = await userRef.get();
    
    if (!docSnap.exists || !docSnap.data().tiktokAuth || !docSnap.data().tiktokAuth.accessToken) {
      return res.status(401).send({ success: false, message: 'Non authentiqué avec TikTok', requiresAuth: true });
    }

    let authData = docSnap.data().tiktokAuth;
    
    // Tentative d'appel
    let response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count,avatar_url,display_name', {
      headers: { 'Authorization': `Bearer ${authData.accessToken}` }
    });

    if (response.status === 401) {
      // Access token expiré, on utilise le refresh token
      const params = new URLSearchParams();
      params.append('client_key', TIKTOK_CLIENT_KEY);
      params.append('client_secret', TIKTOK_CLIENT_SECRET);
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', authData.refreshToken);

      const refreshRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      const refreshData = await refreshRes.json();
      if (!refreshData.access_token) throw new Error("Impossible de rafraichir le token");

      authData.accessToken = refreshData.access_token;
      authData.refreshToken = refreshData.refresh_token;
      authData.updatedAt = FieldValue.serverTimestamp();

      await userRef.set({ tiktokAuth: authData }, { merge: true });

      // Retry
      response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count,avatar_url,display_name', {
        headers: { 'Authorization': `Bearer ${authData.accessToken}` }
      });
    }

    if (!response.ok) throw new Error(`Erreur API Info: ${response.status}`);
    const data = await response.json();
    
    // 2. Fetch vidéos (toutes les vidéos avec pagination)
    let videos = [];
    let totalViews = 0;
    let totalShares = 0;
    let totalLikes = 0;
    let totalComments = 0;
    
    let hasMore = true;
    let cursor = 0;
    let attempts = 0;
    
    while (hasMore && attempts < 15) { // Limite de sécurité (15 * 20 = 300 vidéos max)
      attempts++;
      const bodyPayload = { max_count: 20 };
      if (cursor !== 0) bodyPayload.cursor = cursor;
      
      let videoResponse = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,create_time,cover_image_url,share_url,video_description,duration,title,like_count,comment_count,share_count,view_count', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authData.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });
      
      if (videoResponse.ok) {
         const videoData = await videoResponse.json();
         if (videoData.data && videoData.data.videos) {
           const batch = videoData.data.videos.map(v => ({
             id: v.id,
             title: v.title || v.video_description || "Vidéo TikTok",
             date: new Date(v.create_time * 1000).toISOString(),
             durationMins: Math.round(v.duration / 60) || 1,
             views: v.view_count || 0,
             likes: v.like_count || 0,
             comments: v.comment_count || 0,
             shares: v.share_count || 0,
             coverUrl: v.cover_image_url || ""
           }));
           
           batch.forEach(v => {
              totalViews += v.views;
              totalShares += v.shares;
              totalLikes += v.likes;
              totalComments += v.comments;
           });
           videos = videos.concat(batch);
           
           hasMore = videoData.data.has_more;
           cursor = videoData.data.cursor;
         } else {
           hasMore = false;
         }
      } else {
         console.error("Erreur Fetch Videos TikTok", await videoResponse.text());
         hasMore = false;
      }
    }

    const tiktokData = {
      followers: data?.data?.user?.follower_count || 0,
      likes: data?.data?.user?.likes_count || 0,
      views: totalViews, 
      shares: totalShares,
      totalLikes: totalLikes,
      totalComments: totalComments,
      followersGrowth: 18.4, 
      lastSync: FieldValue.serverTimestamp(),
      avatar_url: data?.data?.user?.avatar_url || "",
      display_name: data?.data?.user?.display_name || "",
      recentVideos: videos,
      videoAnalytics: {
         avgViews: videos.length > 0 ? Math.round(totalViews / videos.length) : 0,
         avgLikes: videos.length > 0 ? Math.round(videos.reduce((acc, v) => acc + v.likes, 0) / videos.length) : 0,
         avgComments: videos.length > 0 ? Math.round(videos.reduce((acc, v) => acc + v.comments, 0) / videos.length) : 0,
         totalVideosAnalyzed: videos.length
      },
      // Delete old mock fields by replacing them
      liveMetrics: FieldValue.delete()
    };

        // --- CHECK LIVE STATUS VIA TIKTOK LIVE CONNECTOR ---
    let isLive = false;
    let roomId = null;
    let currentViewers = null;
    
    try {
      const { TikTokLiveConnection } = await import('tiktok-live-connector');
      const connection = new TikTokLiveConnection('karam.drame', { processInitialData: false });
      const state = await connection.connect();
      const roomInfo = state.roomInfo;
      
      let fetchedStats = {};
      if (roomInfo && roomInfo.data && roomInfo.data.status === 2) {
        isLive = true;
        roomId = roomInfo.data.id_str || roomInfo.data.roomId || '';
        currentViewers = roomInfo.data.user_count || roomInfo.data.viewerCount || null;
        fetchedStats = roomInfo.data.stats || {};
      }
      connection.disconnect();
    } catch(e) {
      console.error('Erreur tiktok-live-connector:', e);
    }
    const existingData = docSnap.data().tiktokLiveAPI || {};
    
    // Si on n'est plus en live mais qu'on l'était, on pourrait archiver. 
    // Pour l'instant, on met juste à jour.
    let history = existingData.history || [];
    let peakViewers = existingData.peakViewers || 0;
    
    // Si c'est un NOUVEAU live (nouveau roomId), on reset l'historique
    if (isLive && roomId !== existingData.roomId) {
      history = [];
      peakViewers = 0;
    }
    
    if (isLive && currentViewers != null) {
      if (currentViewers > peakViewers) peakViewers = currentViewers;
      
      const nowString = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      history.push({ time: nowString, viewers: currentViewers });
      
      // Garder seulement les 30 derniers points pour le graphique
      if (history.length > 30) history = history.slice(history.length - 30);
    } else if (!isLive) {
      // Si le live est fini, on reset le graphe courant (ou on le garde, selon le besoin)
      // Ici on le garde pour pouvoir l'archiver plus tard ou l'afficher hors-ligne
    }

    const liveApiData = {
      ...existingData,
      isLive: isLive,
      roomId: roomId || "",
      lastDetected: isLive ? FieldValue.serverTimestamp() : (existingData.lastDetected || null),
      currentViewers: currentViewers,
      peakViewers: peakViewers,
      history: history
    };

    await userRef.set({ 
      tiktokAPI: tiktokData,
      tiktokLiveAPI: liveApiData
    }, { merge: true });
    
    res.status(200).send({ success: true, data: tiktokData, liveData: liveApiData });

  } catch (error) {
    console.error("Erreur Sync TikTok:", error);
    res.status(500).send({ success: false, error: error.message });
  }
});

// Ancienne section de scraping supprimée - Déplacé vers Cloud Run Worker
// --- SCRAPER MAISON TIKTOK ---

exports.scrapeCompetitor = functions.https.onCall(async (data, context) => {
  const cheerio = require('cheerio');
  const { username } = data;
  if (!username) {
    throw new functions.https.HttpsError('invalid-argument', 'Le nom d\'utilisateur est requis.');
  }

  try {
    const cleanUsername = username.replace('@', '').split('?')[0].split('/')[0];
    const url = 'https://www.tiktok.com/@' + cleanUsername;
    
    console.log('Tentative de scraping de: ' + url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      throw new Error('Erreur r�seau HTTP ' + response.status);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const scriptContent = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
    
    if (!scriptContent) {
      throw new Error("Balise de donn�es introuvable. TikTok a bloqu� la requ�te (Captcha).");
    }

    const parsedData = JSON.parse(scriptContent);
    const userModule = parsedData.__DEFAULT_SCOPE__?.['webapp.user-detail'];
    
    if (!userModule || !userModule.userInfo) {
      throw new Error("Impossible de lire les statistiques (format chang� ou compte priv�).");
    }

    const stats = userModule.userInfo.stats;
    // 2. Fetch vidéos (toutes les vidéos avec pagination)
    let videos = [];
    let totalViews = 0;
    let totalShares = 0;
    let totalLikes = 0;
    let totalComments = 0;
    
    let hasMore = true;
    let cursor = 0;
    let attempts = 0;
    
    while (hasMore && attempts < 15) { // Limite de sécurité (15 * 20 = 300 vidéos max)
      attempts++;
      const bodyPayload = { max_count: 20 };
      if (cursor !== 0) bodyPayload.cursor = cursor;
      
      let videoResponse = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,create_time,cover_image_url,share_url,video_description,duration,title,like_count,comment_count,share_count,view_count', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authData.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });
      
      if (videoResponse.ok) {
         const videoData = await videoResponse.json();
         if (videoData.data && videoData.data.videos) {
           const batch = videoData.data.videos.map(v => ({
             id: v.id,
             title: v.title || v.video_description || "Vidéo TikTok",
             date: new Date(v.create_time * 1000).toISOString(),
             durationMins: Math.round(v.duration / 60) || 1,
             views: v.view_count || 0,
             likes: v.like_count || 0,
             comments: v.comment_count || 0,
             shares: v.share_count || 0,
             coverUrl: v.cover_image_url || ""
           }));
           
           batch.forEach(v => {
              totalViews += v.views;
              totalShares += v.shares;
              totalLikes += v.likes;
              totalComments += v.comments;
           });
           videos = videos.concat(batch);
           
           hasMore = videoData.data.has_more;
           cursor = videoData.data.cursor;
         } else {
           hasMore = false;
         }
      } else {
         console.error("Erreur Fetch Videos TikTok", await videoResponse.text());
         hasMore = false;
      }
    }

    const existingTiktok = docSnap.data()?.tiktokAPI || {};
    const finalVideos = (videos && videos.length > 0) ? videos : (existingTiktok.recentVideos || []);
    const finalTotalViews = (videos && videos.length > 0) ? totalViews : (existingTiktok.views || finalVideos.reduce((a, v) => a + (v.views || 0), 0));
    const finalTotalShares = (videos && videos.length > 0) ? totalShares : (existingTiktok.shares || finalVideos.reduce((a, v) => a + (v.shares || 0), 0));
    const finalTotalLikes = (videos && videos.length > 0) ? totalLikes : (existingTiktok.totalLikes || finalVideos.reduce((a, v) => a + (v.likes || 0), 0));
    const finalTotalComments = (videos && videos.length > 0) ? totalComments : (existingTiktok.totalComments || finalVideos.reduce((a, v) => a + (v.comments || 0), 0));

    const tiktokData = {
      followers: data?.data?.user?.follower_count || stats?.followerCount || existingTiktok.followers || 0,
      likes: data?.data?.user?.likes_count || stats?.heartCount || existingTiktok.likes || 0,
      views: finalTotalViews, 
      shares: finalTotalShares,
      totalLikes: finalTotalLikes,
      totalComments: finalTotalComments,
      followersGrowth: 18.4, 
      lastSync: FieldValue.serverTimestamp(),
      avatar_url: data?.data?.user?.avatar_url || stats?.avatarLarger || existingTiktok.avatar_url || "",
      display_name: data?.data?.user?.display_name || stats?.nickname || existingTiktok.display_name || "",
      recentVideos: finalVideos,
      videoAnalytics: {
         avgViews: finalVideos.length > 0 ? Math.round(finalTotalViews / finalVideos.length) : (existingTiktok.videoAnalytics?.avgViews || 0),
         avgLikes: finalVideos.length > 0 ? Math.round(finalVideos.reduce((acc, v) => acc + (v.likes || 0), 0) / finalVideos.length) : (existingTiktok.videoAnalytics?.avgLikes || 0),
         avgComments: finalVideos.length > 0 ? Math.round(finalVideos.reduce((acc, v) => acc + (v.comments || 0), 0) / finalVideos.length) : (existingTiktok.videoAnalytics?.avgComments || 0),
         totalVideosAnalyzed: finalVideos.length
      },
      // Delete old mock fields by replacing them
      liveMetrics: FieldValue.delete()
    };

    // --- CHECK LIVE STATUS VIA TIKTOK LIVE CONNECTOR ---
    let isLive = false;
    let roomId = null;
    let currentViewers = null;
    
    try {
      const { TikTokLiveConnection } = require('tiktok-live-connector');
      const connection = new TikTokLiveConnection('karam.drame', { processInitialData: false });
      const state = await connection.connect();
      const roomInfo = state.roomInfo;
      
      // status 2 = live
      if (roomInfo && roomInfo.data && roomInfo.data.status === 2) {
        isLive = true;
        roomId = roomInfo.data.id_str || roomInfo.data.roomId || "";
        currentViewers = roomInfo.data.user_count || roomInfo.data.viewerCount || null;
      }
      connection.disconnect();
    } catch(e) {
      console.error("Erreur tiktok-live-connector:", e);
    }

    const existingData = docSnap.data().tiktokLiveAPI || {};
    
    // Si on n'est plus en live mais qu'on l'était, on pourrait archiver. 
    // Pour l'instant, on met juste à jour.
    let history = existingData.history || [];
    let peakViewers = existingData.peakViewers || 0;
    
    // Si c'est un NOUVEAU live (nouveau roomId), on reset l'historique
    if (isLive && roomId !== existingData.roomId) {
      history = [];
      peakViewers = 0;
    }
    
    if (isLive && currentViewers != null) {
      if (currentViewers > peakViewers) peakViewers = currentViewers;
      
      const nowString = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      history.push({ time: nowString, viewers: currentViewers });
      
      // Garder seulement les 30 derniers points pour le graphique
      // if (history.length > 30) history = history.slice(history.length - 30);
    } else if (!isLive) {
      // Si le live est fini, on reset le graphe courant (ou on le garde, selon le besoin)
      // Ici on le garde pour pouvoir l'archiver plus tard ou l'afficher hors-ligne
    }

    const liveApiData = {
      ...existingData,
      isLive: isLive,
      roomId: roomId || "",
      lastDetected: isLive ? FieldValue.serverTimestamp() : (existingData.lastDetected || null),
      currentViewers: currentViewers,
      peakViewers: peakViewers,
      history: history,
      likes: Math.max(existingData.likes || 0, (typeof fetchedStats !== 'undefined' && fetchedStats.like_count) ? fetchedStats.like_count : (existingData.likes || 0)),
      shares: Math.max(existingData.shares || 0, (typeof fetchedStats !== 'undefined' && fetchedStats.share_count) ? fetchedStats.share_count : (existingData.shares || 0)),
      followers: Math.max(existingData.followers || 0, (typeof fetchedStats !== 'undefined' && fetchedStats.follow_count) ? fetchedStats.follow_count : (existingData.followers || 0)),
      comments: Math.max(existingData.comments || 0, (typeof fetchedStats !== 'undefined' && fetchedStats.comment_count) ? fetchedStats.comment_count : (existingData.comments || 0)),
      diamonds: Math.max(existingData.diamonds || 0, (typeof fetchedStats !== 'undefined' && fetchedStats.fan_ticket) ? fetchedStats.fan_ticket : (existingData.diamonds || 0)),
      topQuestions: existingData.topQuestions || [],
      topComments: existingData.topComments || [],
      recentComments: existingData.recentComments || []
    };

    await userRef.set({ 
      tiktokAPI: tiktokData,
      tiktokLiveAPI: liveApiData
    }, { merge: true });
    
    res.status(200).send({ success: true, data: tiktokData, liveData: liveApiData });

  } catch (error) {
    console.error("Erreur Sync TikTok:", error);
    res.status(500).send({ success: false, error: error.message });
  }
});

// Ancienne section de scraping supprimée - Déplacé vers Cloud Run Worker
// --- SCRAPER MAISON TIKTOK ---

exports.scrapeCompetitor = functions.https.onCall(async (data, context) => {
  const cheerio = require('cheerio');
  const { username } = data;
  if (!username) {
    throw new functions.https.HttpsError('invalid-argument', 'Le nom d\'utilisateur est requis.');
  }

  try {
    const cleanUsername = username.replace('@', '').split('?')[0].split('/')[0];
    const url = 'https://www.tiktok.com/@' + cleanUsername;
    
    console.log('Tentative de scraping de: ' + url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      throw new Error('Erreur rseau HTTP ' + response.status);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const scriptContent = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
    
    if (!scriptContent) {
      throw new Error("Balise de donnes introuvable. TikTok a bloqu la requte (Captcha).");
    }

    const parsedData = JSON.parse(scriptContent);
    const userModule = parsedData.__DEFAULT_SCOPE__?.['webapp.user-detail'];
    
    if (!userModule || !userModule.userInfo) {
      throw new Error("Impossible de lire les statistiques (format chang ou compte priv).");
    }

    const stats = userModule.userInfo.stats;
    const user = userModule.userInfo.user;

    return {
      success: true,
      data: {
        followers: stats.followerCount || 0,
        videos: stats.videoCount || 0,
        following: stats.followingCount || 0,
        nickname: user.nickname || cleanUsername,
        avatar: user.avatarLarger || user.avatarMedium || user.avatarThumb || ''
      }
    };
  } catch (error) {
    console.error("Erreur scrapeCompetitor:", error);
    throw new functions.https.HttpsError('internal', 'Le scraping a chou: ' + error.message);
  }
});

const { onSchedule } = require("firebase-functions/v2/scheduler");

exports.liveWorkerDaemon = onSchedule({ schedule: "every 1 minutes", timeoutSeconds: 540, memory: "512MiB" }, async (event) => {
    const username = 'karam.drame';
    const db = getFirestore();
    const userRef = db.collection('users').doc('karamokho');
    
    const docSnap = await userRef.get();
    const existingData = docSnap.data()?.tiktokLiveAPI || {};
    
    const now = Date.now();
    const lastHeartbeat = existingData.workerLastHeartbeat?.toMillis?.() || 0;

    // --- 1. DÉTECTION & ALERTE LIVE YOUTUBE ---
    try {
        const ytUrl = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=${YOUTUBE_CHANNEL_ID}&type=video&eventType=live&key=${YOUTUBE_API_KEY}`;
        const ytRes = await fetch(ytUrl);
        const ytJson = await ytRes.json();
        const isYtLive = !!(ytJson.items && ytJson.items.length > 0);
        const existingYtLive = docSnap.data()?.youtubeLiveAPI || {};

        if (isYtLive) {
            const liveItem = ytJson.items[0];
            const videoId = liveItem.id.videoId;
            const title = liveItem.snippet.title;
            const startedAt = liveItem.snippet.publishedAt;
            const isNewYtSession = existingYtLive.videoId !== videoId || !existingYtLive.isLive;

            if (isNewYtSession) {
                const autoBroadcast = existingData.autoBroadcastEnabled === true || docSnap.data()?.autoBroadcastEnabled === true;
                if (autoBroadcast) {
                    const discordWebhookUrl = 'https://discord.com/api/webhooks/1540098204714930319/w71fW-1Am_A4LVtIFg-2-b8s9J5Vryi32q_0LwTB76kX_j-yRQMhFMVRYt8wpiPqwPa9';
                    fetch(discordWebhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: "Karam Live",
                            content: "🔴 **Karamokho est en direct sur YouTube !**",
                            embeds: [{
                                title: "🔴 REJOINDRE LE LIVE STREAM SUR YOUTUBE",
                                description: "Karamokho est actuellement en direct sur YouTube ! Rejoignez la session dès maintenant pour participer et échanger en live.",
                                url: "https://www.youtube.com/@karamdrm/live",
                                color: 16711680,
                                fields: [
                                    { name: "🗨️ Chaîne", value: "Karamokho Dramé (@karamdrm)", inline: true },
                                    { name: "⚡ Statut", value: "🔴 EN DIRECT", inline: true }
                                ],
                                footer: { text: "Karam Live" }
                            }],
                            components: [{
                                type: 1,
                                components: [{
                                    type: 2,
                                    style: 5,
                                    label: "🔴 ACCÉDER AU LIVE YOUTUBE ↗",
                                    url: "https://www.youtube.com/@karamdrm/live"
                                }]
                            }]
                        })
                    }).catch(err => console.error("Erreur envoi webhook Discord Live YouTube:", err));
                }
            }

            await userRef.set({
                youtubeLiveAPI: {
                    isLive: true,
                    videoId: videoId,
                    title: title,
                    started_at: startedAt,
                    lastDetected: FieldValue.serverTimestamp()
                }
            }, { merge: true });
        } else if (existingYtLive.isLive) {
            await userRef.set({
                youtubeLiveAPI: {
                    isLive: false,
                    ended_at: FieldValue.serverTimestamp()
                }
            }, { merge: true });
        }
    } catch (ytErr) {
        console.error("Erreur détection Live YouTube:", ytErr.message);
    }

    // --- 2. DÉTECTION & ALERTE LIVE TIKTOK ---
    // Verrouillage : si le worker tourne déjà et a envoyé un battement il y a moins de 45s, on ne crée pas de doublon
    if (existingData.isLive && (now - lastHeartbeat) < 45000) {
        return { status: 'already_running' };
    }

    const { TikTokLiveConnection } = require('tiktok-live-connector');
    const connection = new TikTokLiveConnection(username, { 
        processInitialData: true,
        requestOptions: {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
            }
        },
        clientParams: {
            app_language: 'fr-FR',
            webcast_language: 'fr-FR'
        }
    });
    
    try {
        const state = await connection.connect();
        
        if (state.roomInfo?.data?.status !== 2) {
             if (existingData.isLive) {
                 const startedAt = existingData.started_at || new Date().toISOString();
                 const endedAt = new Date().toISOString();
                 const diffMs = Math.max(0, new Date(endedAt) - new Date(startedAt));
                 const h = Math.floor(diffMs / 3600000).toString().padStart(2, '0');
                 const m = Math.floor((diffMs % 3600000) / 60000).toString().padStart(2, '0');
                 
                 const avgViewers = (existingData.history && existingData.history.length > 0)
                      ? Math.round(existingData.history.reduce((a, b) => a + (b.viewers || 0), 0) / existingData.history.length)
                      : Math.round((existingData.peakViewers || 0) * 0.7);
                  
                  const archiveObj = {
                      id: Date.now().toString(),
                      date: startedAt,
                      duration: `${h}h${m}`,
                      durationStr: `${h}h${m}`,
                      peakViewers: existingData.peakViewers || 0,
                      avgViewers: avgViewers,
                      views: existingData.peakViewers || 0,
                      likes: existingData.likes || 0,
                      totalLikes: existingData.likes || 0,
                      comments: existingData.comments || 0,
                      totalComments: existingData.comments || 0,
                      shares: existingData.shares || 0,
                      followers: existingData.followers || 0,
                      topQuestions: existingData.topQuestions || [],
                      topFans: existingData.topFans || [],
                      startedAt: startedAt,
                      endedAt: endedAt,
                      title: 'Session Live TikTok'
                  };
                  await userRef.set({ 
                      tiktokLiveAPI: { 
                          isLive: false, 
                          ended_at: FieldValue.serverTimestamp(),
                          historyArchives: FieldValue.arrayUnion(archiveObj)
                      },
                      historyArchives: FieldValue.arrayUnion(archiveObj)
                  }, { merge: true });
             }
             connection.disconnect();
             return { status: 'offline' };
        }

        // --- EN LIVE ---
        let isConnected = true;
        let peakViewers = 0;
        
        // Timestamp réel de début
        let startedAt = existingData.started_at || null;
        if (state.roomInfo?.data?.create_time) {
             startedAt = new Date(state.roomInfo.data.create_time * 1000).toISOString();
        } else if (!startedAt) {
             startedAt = new Date().toISOString();
        }

        const isNewSession = existingData.roomId !== state.roomId;
        if (isNewSession) {
            existingData.likes = 0;
            existingData.shares = 0;
            existingData.followers = 0;
            existingData.diamonds = 0;
            existingData.comments = 0;
            existingData.peakViewers = 0;
            existingData.history = [];
            existingData.topQuestions = [];
            existingData.topComments = [];
            existingData.recentComments = [];

            // Notification Automatique Discord Webhook (Désactivée par défaut tant que Karam ne l'active pas)
            const autoBroadcast = existingData.autoBroadcastEnabled === true || docSnap.data()?.autoBroadcastEnabled === true;
            if (autoBroadcast) {
                const discordWebhookUrl = 'https://discord.com/api/webhooks/1540098204714930319/w71fW-1Am_A4LVtIFg-2-b8s9J5Vryi32q_0LwTB76kX_j-yRQMhFMVRYt8wpiPqwPa9';
                fetch(discordWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: "Karam Live",
                        content: "🔴 **Karamokho est en direct sur TikTok !**",
                        embeds: [{
                            title: "🔴 REJOINDRE LE LIVE TIKTOK DE KARAMOKHO",
                            description: "Venez poser vos questions, échanger sur Webflow et suivre la session de live-coding en direct.",
                            url: "https://www.tiktok.com/@karam.drame/live",
                            color: 16657493,
                            fields: [
                                { name: "📘 Plateforme", value: "TikTok Live", inline: true },
                                { name: "⚡ Statut", value: "🔴 EN DIRECT", inline: true },
                                { name: "👤 Créateur", value: "@karam.drame", inline: true }
                            ],
                            footer: { text: "Karam Live" }
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                style: 5,
                                label: "🔴 ACCÉDER AU LIVE TIKTOK ↗",
                                url: "https://www.tiktok.com/@karam.drame/live"
                            }]
                        }]
                    })
                }).catch(err => console.error("Erreur envoi webhook Discord Live TikTok:", err));
            }
        }

        const stats = state.roomInfo?.data?.stats || {};
        let totalLikes = stats.like_count || existingData.likes || 0;
        let totalShares = stats.share_count || existingData.shares || 0;
        let newFollowers = stats.follow_count || existingData.followers || 0;
        let totalDiamonds = stats.fan_ticket || existingData.diamonds || 0;
        let totalComments = stats.comment_count || existingData.comments || 0;
        let currentViewers = state.roomInfo?.data?.user_count || existingData.currentViewers || 0;

        await userRef.set({
            tiktokLiveAPI: {
                isLive: true,
                roomId: state.roomId,
                started_at: startedAt,
                workerLastHeartbeat: FieldValue.serverTimestamp(),
                likes: totalLikes,
                shares: totalShares,
                followers: newFollowers,
                diamonds: totalDiamonds,
                comments: totalComments,
                currentViewers: currentViewers,
                peakViewers: Math.max(currentViewers, existingData.peakViewers || 0)
            }
        }, { merge: true });

        connection.on('roomUser', async (data) => {
            currentViewers = data.viewerCount || parseInt(data.total) || parseInt(data.userCount) || currentViewers;
            if (currentViewers > peakViewers) peakViewers = currentViewers;
            await userRef.set({ tiktokLiveAPI: { currentViewers, peakViewers } }, { merge: true });
        });
        
        connection.on('like', async (data) => {
            const rawTotal = typeof data.total === 'number' ? data.total : parseInt(data.total);
            const rawCount = typeof data.count === 'number' ? data.count : parseInt(data.count);
            const totalLikesVal = (!isNaN(rawTotal) && rawTotal > 0) ? rawTotal : (typeof data.totalLikeCount === 'number' ? data.totalLikeCount : parseInt(data.totalLikeCount));
            const countVal = (!isNaN(rawCount) && rawCount > 0) ? rawCount : (typeof data.likeCount === 'number' ? data.likeCount : parseInt(data.likeCount)) || 1;

            if (totalLikesVal && !isNaN(totalLikesVal) && totalLikesVal > 0) {
                totalLikes = Math.max(totalLikes, totalLikesVal);
            } else {
                totalLikes += countVal;
            }
            await userRef.set({ tiktokLiveAPI: { likes: totalLikes } }, { merge: true });
        });

        connection.on('social', async (data) => {
            const text = String(data.displayType || data.label || data.action || '').toLowerCase();
            if (text.includes('share') || text.includes('partagé')) totalShares++;
            if (text.includes('follow') || text.includes('abonné')) newFollowers++;
            await userRef.set({ tiktokLiveAPI: { shares: totalShares, followers: newFollowers } }, { merge: true });
        });

        connection.on('share', async (data) => {
            totalShares++;
            await userRef.set({ tiktokLiveAPI: { shares: totalShares } }, { merge: true });
        });

        connection.on('follow', async (data) => {
            newFollowers++;
            await userRef.set({ tiktokLiveAPI: { followers: newFollowers } }, { merge: true });
        });

        let topQuestions = existingData.topQuestions || [];
        let topComments = existingData.topComments || [];
        let recentComments = existingData.recentComments || [];
        let topContributorsMap = {};

        function processLiveMessage(commentText, nickname) {
            if (!commentText || commentText.length < 2) return;
            const text = commentText.trim();
            const lower = text.toLowerCase();
            const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            // 1. Ajouter au flux direct des commentaires récents
            recentComments.unshift({
                id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 6),
                nickname: nickname || 'Spectateur',
                comment: text,
                time: nowTime
            });
            if (recentComments.length > 50) recentComments = recentComments.slice(0, 50);

            // 2. Détection de questions ou de commentaires répétés
            const isQuestion = lower.includes('?') || 
                ['comment', 'pourquoi', 'combien', 'est ce', 'est-ce', 'c quoi', "c'est quoi", 'quel', 'quelle', 'quels', 'quelles', 'qui', 'où', 'ou', 'quand', 'tu penses', 'tu fais', 'tu conseil', 'tu conseille', 'tu recommandes', 'avis sur', 'peux tu', 'peux-tu', 'tu peux', 'c normal', "c'est normal", 'tu vis', 'tu gagnes'].some(k => lower.startsWith(k) || lower.includes(' ' + k));
                
            if (isQuestion) {
                const existing = topQuestions.find(q => (q.original || '').toLowerCase() === lower || (q.original && q.original.length > 8 && lower.includes(q.original.toLowerCase().slice(0, 12))));
                if (existing) {
                    existing.count = (existing.count || 1) + 1;
                } else {
                    topQuestions.unshift({ original: text, count: 1 });
                }
                topQuestions.sort((a, b) => (b.count || 1) - (a.count || 1));
                topQuestions = topQuestions.slice(0, 15);
            } else {
                // Commentaires & Réactions répétés
                const existingC = topComments.find(c => (c.text || c.original || '').toLowerCase() === lower || (c.text && c.text.length > 6 && lower === c.text.toLowerCase()));
                if (existingC) {
                    existingC.count = (existingC.count || 1) + 1;
                } else {
                    topComments.unshift({ text: text, count: 1 });
                }
                topComments.sort((a, b) => (b.count || 1) - (a.count || 1));
                topComments = topComments.slice(0, 15);
            }
        }

        connection.on('chat', async (data) => {
            totalComments++;
            const commentText = data.content || data.comment || '';
            const nickname = data.user?.nickname || data.user?.uniqueId || data.nickname;
            
            if (nickname) {
                topContributorsMap[nickname] = (topContributorsMap[nickname] || 0) + 1;
            }
            
            if (commentText) {
                processLiveMessage(commentText, nickname);
            }
            
            const updates = { 
                comments: totalComments,
                topQuestions: topQuestions,
                topComments: topComments,
                recentComments: recentComments
            };
            
            await userRef.set({ tiktokLiveAPI: updates }, { merge: true });
        });

        connection.on('questionNew', async (data) => {
            const qText = data.details?.questionText || data.questionText || data.question || '';
            const nickname = data.user?.nickname || data.user?.uniqueId || data.nickname || 'Spectateur';
            if (qText) {
                processLiveMessage(qText, nickname);
                await userRef.set({ tiktokLiveAPI: { topQuestions: topQuestions, recentComments: recentComments } }, { merge: true });
            }
        });

        connection.on('gift', async (data) => {
            if (data.giftType === 1 && !data.repeatEnd) return;
            const diamondCount = (data.diamondCount || 0) * (data.repeatCount || 1);
            totalDiamonds += diamondCount;
            await userRef.collection('liveGifts').add({
                giftId: data.giftId, giftName: data.giftName, diamondCount, senderName: data.nickname, timestamp: FieldValue.serverTimestamp()
            });
            await userRef.set({ tiktokLiveAPI: { diamonds: totalDiamonds } }, { merge: true });
        });

        let ticks = 0;
        const heartbeatInterval = setInterval(async () => {
            if (!isConnected) return;
            ticks++;
            const updates = { workerLastHeartbeat: FieldValue.serverTimestamp() };
            
            // Push history every 5 minutes (5 ticks)
            if (ticks % 5 === 0) {
                const nowString = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                updates.history = FieldValue.arrayUnion({ time: nowString, viewers: currentViewers });
            }
            
            await userRef.set({
               tiktokLiveAPI: updates
            }, { merge: true });
        }, 60000);

        return new Promise((resolve) => {
            connection.on('streamEnd', async () => {
                isConnected = false;
                const endedAt = new Date().toISOString();
                const diffMs = Math.max(0, new Date(endedAt) - new Date(startedAt));
                const h = Math.floor(diffMs / 3600000).toString().padStart(2, '0');
                const m = Math.floor((diffMs % 3600000) / 60000).toString().padStart(2, '0');
                
                const avgViewers = (existingData.history && existingData.history.length > 0)
                    ? Math.round(existingData.history.reduce((a, b) => a + (b.viewers || 0), 0) / existingData.history.length)
                    : Math.round((existingData.peakViewers || peakViewers || 0) * 0.7);

                const archiveObj = {
                    id: Date.now().toString(),
                    date: startedAt,
                    duration: `${h}h${m}`,
                    durationStr: `${h}h${m}`,
                    peakViewers: Math.max(peakViewers || 0, existingData.peakViewers || 0),
                    avgViewers: avgViewers,
                    views: Math.max(peakViewers || 0, existingData.peakViewers || 0),
                    likes: totalLikes || existingData.likes || 0,
                    totalLikes: totalLikes || existingData.likes || 0,
                    comments: totalComments || existingData.comments || 0,
                    totalComments: totalComments || existingData.comments || 0,
                    shares: totalShares || existingData.shares || 0,
                    followers: newFollowers || existingData.followers || 0,
                    topQuestions: topQuestions || [],
                    topComments: topComments || [],
                    topFans: Object.entries(topContributorsMap || {}).map(([name, score]) => ({ name, score })).sort((a, b) => b.score - a.score).slice(0, 5),
                    startedAt: startedAt,
                    endedAt: endedAt,
                    title: 'Session Live TikTok'
                };
                
                await userRef.set({ 
                    tiktokLiveAPI: { 
                        isLive: false, 
                        ended_at: FieldValue.serverTimestamp(),
                        historyArchives: FieldValue.arrayUnion(archiveObj)
                    },
                    historyArchives: FieldValue.arrayUnion(archiveObj)
                }, { merge: true });
                connection.disconnect();
                clearInterval(heartbeatInterval);
                resolve({ status: 'ended' });
            });
            
            // Relais fluide : on coupe après 4.5 minutes, le prochain Cron prendra la suite sans perte
            setTimeout(() => {
                isConnected = false;
                connection.disconnect();
                clearInterval(heartbeatInterval);
                resolve({ status: 'restarted_gracefully' });
            }, 270000); 
        });
    } catch(e) {
       console.error("Daemon Live erreur:", e);
       return { status: 'error', error: e.message };
    }
});

// Endpoint de synchronisation Discord Bot (100% Gratuit)
exports.syncDiscordBotData = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }

    const botToken = req.body?.token || process.env.DISCORD_BOT_TOKEN;
    const guildId = '1466513608442777687';

    if (!botToken) {
        return res.status(400).json({ success: false, error: 'Token Discord Bot manquant' });
    }

    try {
        // 1. Récupération des infos de la guilde
        const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
            headers: { Authorization: `Bot ${botToken}` }
        });
        const guildData = await guildRes.json();

        // 2. Récupération des salons
        const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
            headers: { Authorization: `Bot ${botToken}` }
        });
        const channelsData = await channelsRes.json();

        // 3. Sauvegarde dans Firestore
        const db = getFirestore();
        await db.collection('users').doc('karamokho').set({
            discordBotData: {
                guild: guildData,
                channels: Array.isArray(channelsData) ? channelsData.map(c => ({ id: c.id, name: c.name, type: c.type })) : [],
                lastSync: new Date().toISOString()
            }
        }, { merge: true });

        return res.status(200).json({ success: true, guild: guildData.name, channelsCount: channelsData.length });
    } catch (e) {
        console.error("Erreur syncDiscordBotData:", e);
        return res.status(500).json({ success: false, error: e.message });
    }
});

// Endpoint d'envoi d'alerte Webhook Discord Multi-Plateformes
exports.sendDiscordNotification = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }

    const { webhookUrl, title, description, url, color, platform } = req.body;
    if (!webhookUrl) {
        return res.status(400).json({ success: false, error: 'URL Webhook manquante' });
    }

    try {
        const payload = {
            username: "Lumina Alertes",
            avatar_url: "https://lumina-analytics-kd-2026.web.app/favicon.ico",
            embeds: [{
                title: title || "🔴 Nouveau Live / Contenu !",
                description: description || "Karamokho est en direct ou vient de publier du nouveau contenu !",
                url: url || "https://lumina-analytics-kd-2026.web.app",
                color: color || 16733696, // Orange Forge / Blurple
                footer: { text: `Lumina Analytics • ${platform || 'Alerte Multi-Réseaux'}` },
                timestamp: new Date().toISOString()
            }]
        };

        const notifyRes = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (notifyRes.ok) {
            return res.status(200).json({ success: true, message: 'Notification Discord envoyée avec succès' });
        } else {
            return res.status(notifyRes.status).json({ success: false, error: 'Erreur lors de l\'envoi au webhook' });
        }
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
});

// ==========================================
// MODULE INSTAGRAM ANALYTICS (@karam.drm)
// ==========================================
const { syncInstagramAccount } = require("./instagramService");

exports.forceSyncInstagram = functions.https.onRequest(async (req, res) => {
    // Permettre les requêtes CORS depuis l'application Lumina
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(204).send("");
    }

    try {
        const token = req.query.token || req.body?.token || null;
        const result = await syncInstagramAccount("karamokho", { accessToken: token });
        return res.status(200).json({
            success: true,
            message: "Synchronisation Instagram réussie pour @karam.drm",
            data: result
        });
    } catch (error) {
        console.error("Erreur forceSyncInstagram:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erreur lors de la synchronisation Instagram"
        });
    }
});

exports.syncInstagramData = functions.pubsub.schedule("every 6 hours").onRun(async (context) => {
    try {
        await syncInstagramAccount("karamokho");
        console.log("Cron Instagram terminé avec succès.");
    } catch (error) {
        console.error("Erreur Cron Instagram:", error);
    }
});

// ==========================================
// MODULE LINKEDIN DYNAMIQUE (@drmkaramokho)
// ==========================================
const { syncLinkedInAccount } = require("./linkedinService");

exports.forceSyncLinkedIn = functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(204).send("");
    }

    try {
        const result = await syncLinkedInAccount("karamokho");
        return res.status(200).json({
            success: true,
            message: "Synchronisation dynamique réussie pour @drmkaramokho",
            data: result
        });
    } catch (error) {
        console.error("Erreur forceSyncLinkedIn:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erreur lors de la synchronisation dynamique LinkedIn"
        });
    }
});

exports.syncLinkedInData = functions.pubsub.schedule("every 6 hours").onRun(async (context) => {
    try {
        await syncLinkedInAccount("karamokho");
        console.log("Cron LinkedIn terminé avec succès.");
    } catch (error) {
        console.error("Erreur Cron LinkedIn:", error);
    }
});



