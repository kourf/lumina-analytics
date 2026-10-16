const functions = require("firebase-functions/v1");
const { onSchedule } = require("firebase-functions/v2/scheduler");
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
  const uploadsPlaylistId = channelInfo.contentDetails?.relatedPlaylists?.uploads || `UU${channelInfo.id.substring(2)}`;

  // Récupérer toutes les vidéos de la chaîne avec pagination (jusqu'à 500 max)
  let playlistItems = [];
  let pageToken = '';
  do {
    const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
    const playlistUrl = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50${pageParam}&key=${apiKey}`;
    const playlistResponse = await fetch(playlistUrl);
    const playlistData = await playlistResponse.json();

    if (playlistData.items && playlistData.items.length > 0) {
      playlistItems.push(...playlistData.items);
    }
    pageToken = playlistData.nextPageToken;
  } while (pageToken && playlistItems.length < 500);

  let videosData = [];

  if (playlistItems.length > 0) {
    const allVideoIds = playlistItems.map(item => item.contentDetails.videoId);
    let allVideoDetails = [];

    // L'API YouTube accepte jusqu'à 50 IDs par requête
    for (let i = 0; i < allVideoIds.length; i += 50) {
      const batchIds = allVideoIds.slice(i, i + 50).join(',');
      const videosUrl = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,liveStreamingDetails&id=${batchIds}&key=${apiKey}`;
      const videosResponse = await fetch(videosUrl);
      const videosDetails = await videosResponse.json();
      if (videosDetails.items) {
        allVideoDetails.push(...videosDetails.items);
      }
    }

    videosData = allVideoDetails.map((v) => {
      const vStats = v.statistics || {};
      const views = parseInt(vStats.viewCount || '0', 10);
      const likes = parseInt(vStats.likeCount || '0', 10);
      const comments = parseInt(vStats.commentCount || '0', 10);
      const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
      const durationSec = parseISODuration(v.contentDetails?.duration || '');

      const isLive = v.snippet?.liveBroadcastContent === 'live' || 
                     v.snippet?.liveBroadcastContent === 'upcoming' || 
                     !!v.liveStreamingDetails || 
                     /\b(live|direct)\b/i.test(v.snippet?.title || '');
      
      let type = 'Vidéo';
      let format = 'video';
      if (isLive) {
        type = 'Direct';
        format = 'live';
      } else if (durationSec > 0 && (durationSec <= 180 || /#(shorts|short|pourtoi|pourtoii|fyp|reels|tiktok)\b/i.test(v.snippet?.title || ''))) {
        type = 'Short';
        format = 'short';
      } else {
        type = 'Vidéo';
        format = 'video';
      }

      return {
        id: v.id,
        title: v.snippet?.title || 'Sans titre',
        publishedAt: v.snippet?.publishedAt || new Date().toISOString(),
        thumbnailUrl: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
        durationSec: durationSec,
        views: views,
        likes: likes,
        comments: comments,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        type: type,
        format: format,
        isLiveNow: v.snippet?.liveBroadcastContent === 'live',
        actualStartTime: v.liveStreamingDetails?.actualStartTime || null,
        actualEndTime: v.liveStreamingDetails?.actualEndTime || null
      };
    });
  }

  // Analyses globales de la chaîne
  const sampleViews = videosData.reduce((acc, v) => acc + v.views, 0);
  const sampleLikes = videosData.reduce((acc, v) => acc + v.likes, 0);
  const sampleComments = videosData.reduce((acc, v) => acc + v.comments, 0);
  const globalEngagementRate = sampleViews > 0 ? ((sampleLikes + sampleComments) / sampleViews) * 100 : 0;

  // Séparation pour analyses spécifiques
  const shorts = videosData.filter(v => v.type === 'Short');
  const lives = videosData.filter(v => v.type === 'Direct' || v.type === 'Live' || v.format === 'live');
  const videos = videosData.filter(v => (v.type === 'Vidéo' || v.type === 'Video') && v.format !== 'live');

  const avgShortDuration = shorts.length > 0 ? shorts.reduce((acc, v) => acc + v.durationSec, 0) / shorts.length : 0;
  const avgVideoDuration = videos.length > 0 ? videos.reduce((acc, v) => acc + v.durationSec, 0) / videos.length : 0;
  const avgLiveDuration = lives.length > 0 ? lives.reduce((acc, v) => acc + v.durationSec, 0) / lives.length : 0;

  // Calcul du rythme de publication estimé (basé sur la fréquence de l'échantillon)
  let estimatedPerMonth = 0;
  let estimatedPerYear = 0;
  let estimatedShortsPerMonth = 0;
  let estimatedVideosPerMonth = 0;
  let estimatedLivesPerMonth = 0;

  if (videosData.length > 1) {
    const sortedChronological = [...videosData].sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
    const oldestVideo = sortedChronological[0];
    const newestVideo = sortedChronological[sortedChronological.length - 1];
    const timespanMs = new Date(newestVideo.publishedAt).getTime() - new Date(oldestVideo.publishedAt).getTime();
    const timespanDays = Math.max(1, timespanMs / (1000 * 60 * 60 * 24));
    const videosPerDay = videosData.length / timespanDays;
    
    estimatedPerMonth = Math.round(videosPerDay * 30);
    estimatedPerYear = Math.round(videosPerDay * 365);
    
    const shortsRatio = shorts.length / videosData.length;
    const livesRatio = lives.length / videosData.length;
    estimatedShortsPerMonth = Math.round(estimatedPerMonth * shortsRatio);
    estimatedLivesPerMonth = Math.round(estimatedPerMonth * livesRatio);
    estimatedVideosPerMonth = Math.max(0, estimatedPerMonth - estimatedShortsPerMonth - estimatedLivesPerMonth);
  } else if (videosData.length === 1) {
    estimatedPerMonth = 1;
    estimatedPerYear = 12;
    estimatedShortsPerMonth = shorts.length;
    estimatedLivesPerMonth = lives.length;
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
      totalViews: sampleViews,
      publicChannelViews: parseInt(stats.viewCount || '0', 10),
      videoCount: videosData.length,
      globalEngagementRate: parseFloat(globalEngagementRate.toFixed(2)),
      totalLikes: sampleLikes,
      lastSync: FieldValue.serverTimestamp()
    },
    analytics: {
      estimatedPerMonth,
      estimatedPerYear,
      estimatedShortsPerMonth,
      estimatedVideosPerMonth,
      estimatedLivesPerMonth,
      shortsCount: shorts.length,
      videosCount: videos.length,
      livesCount: lives.length,
      avgShortDurationSec: Math.round(avgShortDuration),
      avgVideoDurationSec: Math.round(avgVideoDuration),
      avgLiveDurationSec: Math.round(avgLiveDuration)
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
  const oldClassic = oldVideos.filter(v => (v.type === 'Vidéo' || v.type === 'Video') && v.format !== 'live').sort((a, b) => a.views - b.views);
  const oldShorts = oldVideos.filter(v => v.type === 'Short').sort((a, b) => a.views - b.views);
  const oldLives = oldVideos.filter(v => v.type === 'Direct' || v.type === 'Live' || v.format === 'live').sort((a, b) => a.views - b.views);
  const weakVideos = [
    ...oldClassic.slice(0, 5),
    ...oldShorts.slice(0, 5),
    ...oldLives.slice(0, 5)
  ];

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
// TIKTOK INTEGRATION (100% Dynamique & Auto-Refresh)
// ==========================================
const TIKTOK_REDIRECT_URI = 'https://us-central1-lumina-analytics-kd-2026.cloudfunctions.net/tiktokCallback';

exports.tiktokAuth = functions.https.onRequest(async (req, res) => {
  try {
    const clientKey = (await getSecret('TIKTOK_CLIENT_KEY')) || process.env.TIKTOK_CLIENT_KEY;
    const csrfState = Math.random().toString(36).substring(2);
    let url = 'https://www.tiktok.com/v2/auth/authorize/';
    url += `?client_key=${clientKey}`;
    url += '&scope=user.info.basic,user.info.stats,video.list';
    url += '&response_type=code';
    url += `&redirect_uri=${encodeURIComponent(TIKTOK_REDIRECT_URI)}`;
    url += '&state=' + csrfState;
    
    res.redirect(url);
  } catch (error) {
    console.error('Error in tiktokAuth:', error);
    res.status(500).send('Failed to initiate auth: ' + error.message);
  }
});

exports.tiktokCallback = functions.https.onRequest(async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    const clientKey = (await getSecret('TIKTOK_CLIENT_KEY')) || process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = (await getSecret('TIKTOK_CLIENT_SECRET')) || process.env.TIKTOK_CLIENT_SECRET;

    const params = new URLSearchParams();
    params.append('client_key', clientKey);
    params.append('client_secret', clientSecret);
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
    const clientKey = (await getSecret('TIKTOK_CLIENT_KEY')) || process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = (await getSecret('TIKTOK_CLIENT_SECRET')) || process.env.TIKTOK_CLIENT_SECRET;
    
    // Tentative d'appel
    let response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count,avatar_url,display_name', {
      headers: { 'Authorization': `Bearer ${authData.accessToken}` }
    });

    if (response.status === 401 || !response.ok) {
      // Access token expiré ou erreur d'auth, on utilise le refresh token
      if (authData.refreshToken && clientKey && clientSecret) {
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
          authData.accessToken = refreshData.access_token;
          authData.refreshToken = refreshData.refresh_token || authData.refreshToken;
          authData.updatedAt = FieldValue.serverTimestamp();

          await userRef.set({ tiktokAuth: authData }, { merge: true });

          // Retry après renouvellement
          response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count,avatar_url,display_name', {
            headers: { 'Authorization': `Bearer ${authData.accessToken}` }
          });
        }
      }
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

    // --- NOTE : CHECK LIVE STATUS EST MAINTENANT GÉRÉ EXCLUSIVEMENT PAR LE WORKER RENDER (Node.js) ---
    // Pour éviter les conflits de données (écrasement de started_at, reset des likes, etc),
    // Firebase Functions ne met plus à jour tiktokLiveAPI.

    await userRef.set({ 
      tiktokAPI: tiktokData
      // tiktokLiveAPI est mis à jour en temps réel par worker/index.js sur Render
    }, { merge: true });
    
    res.status(200).send({ success: true, data: tiktokData, liveData: liveApiData });

  } catch (error) {
    console.error("Erreur Sync TikTok:", error);
    res.status(500).send({ success: false, error: error.message });
  }
});

/**
 * Synchronisation Périodique Automatique du Catalogue TikTok (Toutes les 2 heures)
 * 100% Autonome, sans action manuelle requise, 0,00 € de coût.
 */
exports.syncTikTokCatalogScheduled = onSchedule({ schedule: "every 30 minutes", timeoutSeconds: 300, memory: "256MiB" }, async (event) => {
  try {
    console.log("[Scheduler] 🔄 Synchronisation automatique du catalogue TikTok lancée (cadence 30 min)...");
    const db = getFirestore();
    const userRef = db.collection('users').doc('karamokho');
    const docSnap = await userRef.get();
    if (!docSnap.exists) return;

    const authData = docSnap.data()?.tiktokAuth;
    if (!authData || !authData.refreshToken) {
      console.warn("[Scheduler] Aucun refreshToken disponible pour TikTok.");
      return;
    }

    const clientKey = (await getSecret('TIKTOK_CLIENT_KEY')) || process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = (await getSecret('TIKTOK_CLIENT_SECRET')) || process.env.TIKTOK_CLIENT_SECRET;
    if (!clientKey || !clientSecret) {
      console.warn("[Scheduler] Clés client TikTok manquantes.");
      return;
    }

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
    if (!refreshData.access_token) {
      console.warn("[Scheduler] Échec rafraîchissement token:", refreshData);
      return;
    }

    const accessToken = refreshData.access_token;
    const newRefreshToken = refreshData.refresh_token || authData.refreshToken;

    let allVideos = [];
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
          title: v.title || v.video_description || "Vidéo TikTok",
          video_description: v.video_description || v.title || "",
          date: new Date(v.create_time * 1000).toISOString(),
          durationMins: Math.round(v.duration / 60) || (v.duration > 0 ? 1 : 0),
          durationSec: v.duration || 0,
          views: v.view_count || 0,
          likes: v.like_count || 0,
          comments: v.comment_count || 0,
          shares: v.share_count || 0,
          coverUrl: v.cover_image_url || "",
          shareUrl: v.share_url || `https://www.tiktok.com/@karam.drame/video/${v.id}`
        }));
        allVideos = allVideos.concat(batch);
        hasMore = vJson.data.has_more === true;
        cursor = vJson.data.cursor;
      } else {
        hasMore = false;
      }
    }

    if (allVideos.length > 0) {
      allVideos.sort((a, b) => new Date(b.date) - new Date(a.date));
      const totalViews = allVideos.reduce((acc, v) => acc + (v.views || 0), 0);
      const totalLikes = allVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
      const totalComments = allVideos.reduce((acc, v) => acc + (v.comments || 0), 0);
      const totalShares = allVideos.reduce((acc, v) => acc + (v.shares || 0), 0);

      const videoAnalytics = {
        avgViews: Math.round(totalViews / allVideos.length),
        avgLikes: Math.round(totalLikes / allVideos.length),
        avgComments: Math.round(totalComments / allVideos.length),
        avgShares: Math.round(totalShares / allVideos.length),
        totalVideosAnalyzed: allVideos.length
      };

      const prevTiktokAPI = docSnap.data().tiktokAPI || {};
      await userRef.set({
        tiktokAPI: {
          ...prevTiktokAPI,
          followers: prevTiktokAPI.followers || 6392,
          likes: prevTiktokAPI.likes || 17100,
          recentVideos: allVideos,
          totalVideos: allVideos.length,
          views: totalViews,
          shares: totalShares,
          totalLikes: totalLikes,
          totalComments: totalComments,
          videoAnalytics: videoAnalytics,
          lastSync: FieldValue.serverTimestamp(),
          lastAutoSync: new Date().toISOString()
        },
        tiktok: {
          ...docSnap.data().tiktok,
          recentVideos: allVideos,
          views: totalViews,
          shares: totalShares,
          totalLikes: totalLikes
        },
        recentVideos: allVideos,
        tiktokAuth: {
          ...authData,
          accessToken: accessToken,
          refreshToken: newRefreshToken,
          updatedAt: FieldValue.serverTimestamp()
        }
      }, { merge: true });

      console.log(`[Scheduler] ✅ Catalogue TikTok synchronisé automatiquement : ${allVideos.length} vidéos.`);
    }
  } catch (e) {
    console.warn("[Scheduler] Erreur syncTikTokCatalogScheduled:", e.message);
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

    // --- NOTE : CHECK LIVE STATUS EST MAINTENANT GÉRÉ EXCLUSIVEMENT PAR LE WORKER RENDER (Node.js) ---
    // Pour éviter les conflits de données (écrasement de started_at, reset des likes, etc),
    // Firebase Functions ne met plus à jour tiktokLiveAPI.

    await userRef.set({ 
      tiktokAPI: tiktokData
      // tiktokLiveAPI est mis à jour en temps réel par worker/index.js sur Render
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


// Helper : Envoi d'UN SEUL message Discord unifié (@here + logos TikTok/YouTube/Twitch + 3 boutons)
async function sendUnifiedDiscordLiveAlert(webhookUrl, { tiktokLive, youtubeLive, twitchLive, title }) {
    if (!webhookUrl) return false;
    const tiktokUrl = 'https://www.tiktok.com/@karam.drame/live';
    const youtubeUrl = youtubeLive?.videoId
        ? `https://www.youtube.com/watch?v=${youtubeLive.videoId}`
        : 'https://www.youtube.com/@karamdrm/live';
    const twitchUrl = 'https://www.twitch.tv/karam_drm';

    const streamTitle = title || tiktokLive?.title || twitchLive?.title || youtubeLive?.title || 'Session Live Multi-Stream avec la communauté !';

    const payload = {
        username: 'Karam • Alerte Live Multi-Stream',
        avatar_url: twitchLive?.avatarUrl || 'https://static-cdn.jtvnw.net/jtv_user_pictures/ab914d68-d93b-4289-948d-aec685dcfafa-profile_image-300x300.png',
        content: '🔴 **@here — KARAM EST EN LIVE SUR TIKTOK • YOUTUBE • TWITCH !** 🚀',
        allowed_mentions: { parse: ['everyone'] }, // Active uniquement @here présent dans content (aucun @everyone)
        embeds: [{
            author: {
                name: 'Karam • Diffusion Multi-Réseaux (TikTok • YouTube • Twitch)'
            },
            title: `🎥 EN DIRECT : ${streamTitle}`,
            color: 16657493,
            fields: [
                { name: '🎵 TikTok', value: '`@karam.drame`\n🟢 En direct', inline: true },
                { name: '▶️ YouTube', value: '`@karamdrm`\n🟢 En direct', inline: true },
                { name: '🟣 Twitch', value: '`karam_drm`\n🟢 En direct', inline: true }
            ],
            thumbnail: { url: twitchLive?.avatarUrl || 'https://static-cdn.jtvnw.net/jtv_user_pictures/ab914d68-d93b-4289-948d-aec685dcfafa-profile_image-300x300.png' }
        }],
        components: [{
            type: 1,
            components: [
                { type: 2, style: 5, label: '🔴 CLIQUER ICI : REJOINDRE LE LIVE TIKTOK ↗', url: tiktokUrl, emoji: { name: '🎵' } },
                { type: 2, style: 5, label: '🔴 CLIQUER ICI : REJOINDRE LE LIVE YOUTUBE ↗', url: youtubeUrl, emoji: { name: '▶️' } },
                { type: 2, style: 5, label: '🟣 CLIQUER ICI : REJOINDRE LE LIVE TWITCH ↗', url: twitchUrl, emoji: { name: '🟣' } }
            ]
        }]
    };

    const sep = webhookUrl.includes('?') ? '&' : '?';
    const firstRes = await fetch(`${webhookUrl}${sep}wait=true&with_components=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (firstRes.ok) {
        let j = null;
        try { j = await firstRes.json(); } catch (_) {}
        return { ok: true, messageId: j?.id || null };
    }

    const { components, ...fallbackPayload } = payload;
    const secondRes = await fetch(`${webhookUrl}${sep}wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackPayload)
    });
    let j2 = null;
    if (secondRes.ok) {
        try { j2 = await secondRes.json(); } catch (_) {}
    }
    return { ok: secondRes.ok, messageId: j2?.id || null };
}

async function editDiscordAlertOnLiveEnded(userRef, rootData) {
    try {
        const messageId = rootData?.lastDiscordAlertMessageId;
        const webhookUrl = rootData?.lastDiscordAlertWebhookUrl || rootData?.discordBotWebhookUrl || rootData?.discordWebhookUrl;
        if (!messageId || !webhookUrl || rootData?.lastDiscordAlertEndedEdited === true) return;

        const baseWebhook = webhookUrl.split('?')[0];
        const streamTitle = rootData?.lastDiscordAlertTitle || 'On crée un site ensemble';
        const youtubeReplayUrl = rootData?.lastDiscordAlertYoutubeUrl || 'https://www.youtube.com/@karamdrm/streams';
        const twitchReplayUrl = rootData?.lastDiscordAlertTwitchVodUrl || 'https://www.twitch.tv/karam_drm/videos';
        const tiktokProfileUrl = 'https://www.tiktok.com/@karam.drame';

        const endedPayload = {
            content: '⚪ **LIVE TERMINÉ — MERCI À TOUS LES PARTICIPANTS !** 🙏',
            embeds: [{
                author: {
                    name: 'Karam • Diffusion Multi-Réseaux (TikTok • YouTube • Twitch)'
                },
                title: `⚪ LIVE TERMINÉ : ${streamTitle}`,
                color: 6582667,
                fields: [
                    { name: '🎵 TikTok', value: '`@karam.drame`\n⚪ Hors ligne', inline: true },
                    { name: '▶️ YouTube', value: '`@karamdrm`\n🎬 Replay', inline: true },
                    { name: '🟣 Twitch', value: '`karam_drm`\n🎬 VOD', inline: true }
                ]
            }],
            components: [{
                type: 1,
                components: [
                    { type: 2, style: 5, label: '▶️ CLIQUER ICI : VOIR LE REPLAY YOUTUBE ↗', url: youtubeReplayUrl, emoji: { name: '▶️' } },
                    { type: 2, style: 5, label: '🟣 CLIQUER ICI : VOIR LE REPLAY TWITCH ↗', url: twitchReplayUrl, emoji: { name: '🟣' } },
                    { type: 2, style: 5, label: '🎵 CLIQUER ICI : PROFIL TIKTOK ↗', url: tiktokProfileUrl, emoji: { name: '🎵' } }
                ]
            }]
        };

        const patchRes = await fetch(`${baseWebhook}/messages/${messageId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(endedPayload)
        });
        if (patchRes.ok) {
            await userRef.set({
                lastDiscordAlertEndedEdited: true,
                lastDiscordAlertEndedAt: new Date().toISOString()
            }, { merge: true });
        }
    } catch (e) {
        console.warn("Erreur editDiscordAlertOnLiveEnded:", e.message);
    }
}

exports.liveWorkerDaemon = onSchedule({ schedule: "every 1 minutes", timeoutSeconds: 540, memory: "512MiB" }, async (event) => {
    const username = 'karam.drame';
    const db = getFirestore();
    const userRef = db.collection('users').doc('karamokho');
    
    const docSnap = await userRef.get();
    const rootData = docSnap.data() || {};
    const existingData = rootData.tiktokLiveAPI || {};
    const existingYtLive = rootData.youtubeLiveAPI || {};
    const existingTwLive = rootData.twitchLiveAPI || {};
    
    const now = Date.now();
    const lastHeartbeat = existingData.workerLastHeartbeat?.toMillis?.() || 0;

    let ytState = { isLive: Boolean(existingYtLive.isLive), videoId: existingYtLive.videoId || null, title: existingYtLive.title || '' };
    let twState = { isLive: Boolean(existingTwLive.isLive), streamId: existingTwLive.streamId || null, title: existingTwLive.title || '', avatarUrl: existingTwLive.avatarUrl || '' };

    // --- 1. DÉTECTION LIVE YOUTUBE (0 QUOTA API via page /live) ---
    try {
        const ytRes = await fetch('https://www.youtube.com/@karamdrm/live', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language': 'fr-FR,fr;q=0.9'
            },
            redirect: 'follow'
        });
        const ytHtml = await ytRes.text();
        const isYtLive = ytHtml.includes('"isLive":true') && ytHtml.includes('"isLiveNow":true') && ytHtml.includes('UC_V-hdqGtizf9g7gxahdmqQ');
        const canonicalMatch = ytHtml.match(/<link rel="canonical" href="([^"]+)"/);
        const videoIdMatch = canonicalMatch?.[1]?.match(/v=([^&]+)/);
        const titleMatch = ytHtml.match(/<meta name="title" content="([^"]+)"/);
        const viewMatch = ytHtml.match(/"originalViewCount":"(\d+)"/) || ytHtml.match(/"viewCount":"(\d+)"/);

        if (isYtLive) {
            ytState = {
                isLive: true,
                status: 'LIVE',
                videoId: videoIdMatch?.[1] || existingYtLive.videoId || null,
                title: titleMatch?.[1] || existingYtLive.title || 'Live YouTube en cours',
                viewers: Number(viewMatch?.[1] || 0),
                liveUrl: canonicalMatch?.[1] || 'https://www.youtube.com/@karamdrm/live'
            };
            await userRef.set({
                youtubeLiveAPI: {
                    ...existingYtLive,
                    ...ytState,
                    lastDetected: FieldValue.serverTimestamp()
                }
            }, { merge: true });
        } else if (existingYtLive.isLive) {
            ytState = { isLive: false, status: 'OFFLINE', videoId: null, title: '' };
            await userRef.set({
                youtubeLiveAPI: {
                    ...existingYtLive,
                    isLive: false,
                    status: 'OFFLINE',
                    ended_at: FieldValue.serverTimestamp()
                }
            }, { merge: true });
        }
    } catch (ytErr) {
        console.error("Erreur détection Live YouTube (0-quota):", ytErr.message);
    }

    // --- 2. DÉTECTION LIVE TWITCH (0 QUOTA API via GraphQL public) ---
    try {
        const twRes = await fetch('https://gql.twitch.tv/gql', {
            method: 'POST',
            headers: {
                'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: '{ user(login: "karam_drm") { id login displayName profileImageURL(width: 300) followers { totalCount } stream { id title type viewersCount createdAt game { name } } } }'
            })
        });
        if (twRes.ok) {
            const twJson = await twRes.json();
            const user = twJson?.data?.user;
            const stream = user?.stream;
            const isTwLive = Boolean(stream && stream.type === 'live');
            twState = {
                isLive: isTwLive,
                status: isTwLive ? 'LIVE' : 'OFFLINE',
                streamId: isTwLive ? String(stream.id) : null,
                title: isTwLive ? (stream.title || 'Live Twitch en cours') : '',
                viewers: isTwLive ? Number(stream.viewersCount || 0) : 0,
                game: isTwLive ? (stream.game?.name || '') : '',
                followers: Number(user?.followers?.totalCount || 0),
                avatarUrl: user?.profileImageURL || '',
                startedAt: isTwLive ? (stream.createdAt || null) : null,
                liveUrl: 'https://www.twitch.tv/karam_drm'
            };
            await userRef.set({
                twitchLiveAPI: {
                    ...existingTwLive,
                    ...twState,
                    lastDetected: FieldValue.serverTimestamp()
                }
            }, { merge: true });
        }
    } catch (twErr) {
        console.error("Erreur détection Live Twitch (0-quota):", twErr.message);
    }

    // --- 3. DÉTECTION & CONNEXION LIVE TIKTOK ---
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
                          status: 'OFFLINE',
                          ended_at: FieldValue.serverTimestamp(),
                          historyArchives: FieldValue.arrayUnion(archiveObj)
                      },
                      historyArchives: FieldValue.arrayUnion(archiveObj)
                  }, { merge: true });
             }
             if (!ytState.isLive && !twState.isLive) {
                 await editDiscordAlertOnLiveEnded(userRef, rootData);
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

        const isNewSession = String(existingData.roomId || '') !== String(state.roomId || '') && String(rootData.lastDiscordAlertRoomId || '') !== String(state.roomId || '');
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

            // Notification Automatique Discord Webhook UNIFIÉE (uniquement si activée par Karam dans le Studio Discord)
            const autoBroadcast = rootData.autoBroadcastEnabled === true || existingData.autoBroadcastEnabled === true;
            if (autoBroadcast) {
                const discordWebhookUrl = rootData.discordBotWebhookUrl || rootData.discordWebhookUrl || 'https://discord.com/api/webhooks/1540098204714930319/w71fW-1Am_A4LVtIFg-2-b8s9J5Vryi32q_0LwTB76kX_j-yRQMhFMVRYt8wpiPqwPa9';
                await userRef.set({
                    lastDiscordAlertRoomId: String(state.roomId),
                    lastDiscordAlertAt: new Date().toISOString(),
                    lastDiscordAlertEndedEdited: false
                }, { merge: true });

                sendUnifiedDiscordLiveAlert(discordWebhookUrl, {
                    tiktokLive: { isLive: true, roomId: state.roomId, title: state.roomInfo?.data?.title || 'Live TikTok en cours' },
                    youtubeLive: ytState,
                    twitchLive: twState,
                    title: state.roomInfo?.data?.title || twState.title || ytState.title
                }).then(async (resAlert) => {
                    if (resAlert?.messageId) {
                        await userRef.set({
                            lastDiscordAlertMessageId: String(resAlert.messageId),
                            lastDiscordAlertWebhookUrl: discordWebhookUrl,
                            lastDiscordAlertTitle: state.roomInfo?.data?.title || twState.title || ytState.title || 'Live Multi-Stream',
                            lastDiscordAlertEndedEdited: false
                        }, { merge: true });
                    }
                }).catch(err => console.error("Erreur envoi webhook Discord unifié:", err));
            }
        }

        const stats = state.roomInfo?.data?.stats || {};
        let totalLikes = Math.max(Number(stats.like_count || 0), Number(existingData.likes || existingData.totalLikes || 0));
        let totalShares = Math.max(Number(stats.share_count || 0), Number(existingData.shares || existingData.totalShares || 0));
        let newFollowers = Math.max(Number(stats.follow_count || 0), Number(existingData.followers || existingData.newFollowers || 0));
        let totalDiamonds = Math.max(Number(stats.fan_ticket || 0), Number(existingData.diamonds || existingData.totalDiamonds || 0));
        let totalComments = Math.max(Number(stats.comment_count || 0), Number(existingData.comments || existingData.totalComments || 0));
        let currentViewers = Number(state.roomInfo?.data?.user_count || existingData.currentViewers || 0);
        let totalUser = Math.max(
            Number(stats.total_user || stats.enter_count || 0),
            Number(existingData.totalUser || existingData.cumulative_audience || 0),
            currentViewers
        );
        peakViewers = Math.max(currentViewers, Number(existingData.peakViewers || 0));

        await userRef.set({
            tiktokLiveAPI: {
                isLive: true,
                status: 'LIVE',
                roomId: String(state.roomId),
                title: state.roomInfo?.data?.title || existingData.title || 'Live TikTok en cours',
                started_at: startedAt,
                startedAt: startedAt,
                workerLastHeartbeat: FieldValue.serverTimestamp(),
                lastDetected: new Date().toISOString(),
                likes: totalLikes,
                totalLikes: totalLikes,
                shares: totalShares,
                totalShares: totalShares,
                followers: newFollowers,
                newFollowers: newFollowers,
                diamonds: totalDiamonds,
                totalDiamonds: totalDiamonds,
                comments: totalComments,
                totalComments: totalComments,
                currentViewers: currentViewers,
                peakViewers: peakViewers,
                totalUser: totalUser,
                total_user: totalUser,
                cumulative_audience: totalUser,
                enter_count: totalUser
            }
        }, { merge: true });

        let syncTimer = null;
        let isSyncing = false;
        let pendingSync = false;

        const flushLiveMetricsToFirestore = async () => {
            if (!isConnected) return;
            if (isSyncing) {
                pendingSync = true;
                return;
            }
            isSyncing = true;
            pendingSync = false;
            try {
                await userRef.set({
                    tiktokLiveAPI: {
                        isLive: true,
                        status: 'LIVE',
                        roomId: String(state.roomId),
                        title: state.roomInfo?.data?.title || existingData.title || 'Live TikTok en cours',
                        started_at: startedAt,
                        startedAt: startedAt,
                        workerLastHeartbeat: FieldValue.serverTimestamp(),
                        lastDetected: new Date().toISOString(),
                        likes: totalLikes,
                        totalLikes: totalLikes,
                        shares: totalShares,
                        totalShares: totalShares,
                        followers: newFollowers,
                        newFollowers: newFollowers,
                        diamonds: totalDiamonds,
                        totalDiamonds: totalDiamonds,
                        comments: totalComments,
                        totalComments: totalComments,
                        currentViewers: currentViewers,
                        peakViewers: peakViewers,
                        totalUser: totalUser,
                        total_user: totalUser,
                        cumulative_audience: totalUser,
                        enter_count: totalUser,
                        topQuestions: topQuestions,
                        topComments: topComments,
                        topCommenters: topCommentersList,
                        recentComments: recentComments
                    }
                }, { merge: true });
            } catch (syncErr) {
                console.warn("[Cloud Function liveWorkerDaemon] Throttled write error:", syncErr.message);
            } finally {
                isSyncing = false;
                if (pendingSync) {
                    scheduleThrottledSync(1000);
                }
            }
        };

        const scheduleThrottledSync = (delayMs = 2000) => {
            if (syncTimer) return;
            syncTimer = setTimeout(() => {
                syncTimer = null;
                flushLiveMetricsToFirestore();
            }, delayMs);
        };

        // Dédoublonnage des événements de partage et d'abonnement
        const handledSocialMsgIds = new Set();
        const markSocialHandled = (id) => {
            if (!id) return false;
            if (handledSocialMsgIds.has(id)) return true;
            handledSocialMsgIds.add(id);
            if (handledSocialMsgIds.size > 2000) {
                const first = handledSocialMsgIds.values().next().value;
                handledSocialMsgIds.delete(first);
            }
            return false;
        };

        const handleShareEvent = (data) => {
            const msgId = data?.common?.msgId || data?.msgId || data?.id || (data?.user?.id ? `${data.user.id}_share_${Math.floor(Date.now() / 2000)}` : null);
            if (msgId && markSocialHandled(msgId)) return;
            const reportedShareCount = Number(data?.shareCount || 0);
            if (reportedShareCount > totalShares) {
                totalShares = reportedShareCount;
            } else {
                totalShares += 1;
            }
            scheduleThrottledSync();
        };

        const handleFollowEvent = (data) => {
            const msgId = data?.common?.msgId || data?.msgId || data?.id || (data?.user?.id ? `${data.user.id}_follow_${Math.floor(Date.now() / 5000)}` : null);
            if (msgId && markSocialHandled(msgId)) return;
            newFollowers++;
            scheduleThrottledSync();
        };

        connection.on('roomUser', (data) => {
            const parsedViewers = parseInt(data?.total) || Number(data?.viewerCount || data?.userCount || 0);
            if (parsedViewers > 0) {
                currentViewers = parsedViewers;
                if (currentViewers > peakViewers) peakViewers = currentViewers;
            }
            const parsedTotalUser = Number(data?.totalUser || data?.total_user || 0);
            if (parsedTotalUser > 0) {
                totalUser = Math.max(totalUser, parsedTotalUser);
            }
            scheduleThrottledSync();
        });
        
        connection.on('like', (data) => {
            const rawTotal = typeof data?.total === 'number' ? data.total : parseInt(data?.total || data?.totalLikeCount || 0);
            const rawCount = typeof data?.count === 'number' ? data.count : parseInt(data?.count || data?.likeCount || 1);

            if (!isNaN(rawTotal) && rawTotal > 0) {
                totalLikes = Math.max(totalLikes, rawTotal);
            } else if (!isNaN(rawCount) && rawCount > 0) {
                totalLikes += rawCount;
            } else {
                totalLikes += 1;
            }
            scheduleThrottledSync();
        });

        connection.on('share', handleShareEvent);
        connection.on('follow', handleFollowEvent);

        connection.on('social', (data) => {
            const actionStr = String(data?.action || '');
            const displayKey = String(data?.common?.displayText?.key || data?.displayType || data?.label || '').toLowerCase();
            const defaultPattern = String(data?.common?.displayText?.defaultPattern || '').toLowerCase();
            if (
                actionStr === '3' ||
                displayKey.includes('share') ||
                defaultPattern.includes('share') ||
                defaultPattern.includes('partag') ||
                Number(data?.shareCount || 0) > 0 ||
                Boolean(data?.shareType || data?.shareTarget)
            ) {
                handleShareEvent(data);
            } else if (
                actionStr === '1' ||
                displayKey.includes('follow') ||
                defaultPattern.includes('follow') ||
                defaultPattern.includes('abonn') ||
                Boolean(data?.followType)
            ) {
                handleFollowEvent(data);
            }
        });

        let topQuestions = Array.isArray(existingData.topQuestions) ? existingData.topQuestions : [];
        let topComments = Array.isArray(existingData.topComments) ? existingData.topComments : [];
        let recentComments = Array.isArray(existingData.recentComments) ? existingData.recentComments : [];
        let topCommentersList = Array.isArray(existingData.topCommenters) ? existingData.topCommenters : [];
        let topContributorsMap = {};
        topCommentersList.forEach(c => {
            if (c?.nickname && c?.count) topContributorsMap[c.nickname] = c.count;
        });

        function processLiveMessage(commentText, nickname) {
            if (!commentText || commentText.length < 2) return;
            const text = commentText.trim();
            const lower = text.toLowerCase();
            const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            recentComments.unshift({
                id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 6),
                nickname: nickname || 'Spectateur',
                comment: text,
                time: nowTime
            });
            if (recentComments.length > 50) recentComments = recentComments.slice(0, 50);

            const isQuestion = lower.includes('?') || 
                ['comment', 'pourquoi', 'combien', 'est ce', 'est-ce', 'c quoi', "c'est quoi", 'quel', 'quelle', 'quels', 'quelles', 'qui', 'où', 'ou', 'quand', 'tu penses', 'tu fais', 'tu conseil', 'tu conseille', 'tu recommandes', 'avis sur', 'peux tu', 'peux-tu', 'tu peux', 'c normal', "c'est normal", 'tu vis', 'tu gagnes'].some(k => lower.startsWith(k) || lower.includes(' ' + k));
                
            if (isQuestion) {
                const existing = topQuestions.find(q => (q.original || '').toLowerCase() === lower || (q.original && q.original.length > 8 && lower.includes(q.original.toLowerCase().slice(0, 12))));
                if (existing) {
                    existing.count = (existing.count || 1) + 1;
                    existing.lastAskedBy = nickname || 'Spectateur';
                } else {
                    topQuestions.unshift({ original: text, count: 1, lastAskedBy: nickname || 'Spectateur' });
                }
                topQuestions.sort((a, b) => (b.count || 1) - (a.count || 1));
                topQuestions = topQuestions.slice(0, 15);
            } else {
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

        connection.on('chat', (data) => {
            totalComments++;
            const commentText = data.content || data.comment || '';
            const nickname = data.user?.nickname || data.user?.uniqueId || data.nickname || 'Spectateur';
            
            if (nickname) {
                topContributorsMap[nickname] = (topContributorsMap[nickname] || 0) + 1;
                topCommentersList = Object.entries(topContributorsMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, count], idx) => ({
                        rank: idx + 1,
                        nickname: name,
                        count,
                        lastComment: commentText || '',
                        badge: idx === 0 ? '👑 MVP' : idx === 1 ? '🥈 VIP' : idx === 2 ? '🥉 Bronze' : '⭐ Actif'
                    }));
            }
            if (commentText) {
                processLiveMessage(commentText, nickname);
            }
            scheduleThrottledSync();
        });

        connection.on('questionNew', (data) => {
            const qText = data.details?.questionText || data.questionText || data.question || '';
            const nickname = data.user?.nickname || data.user?.uniqueId || data.nickname || 'Spectateur';
            if (qText) {
                processLiveMessage(qText, nickname);
                scheduleThrottledSync();
            }
        });

        connection.on('gift', (data) => {
            if (data.giftType === 1 && !data.repeatEnd) return;
            const diamondCount = (data.diamondCount || 0) * (data.repeatCount || 1);
            totalDiamonds += diamondCount;
            userRef.collection('liveGifts').add({
                giftId: data.giftId, giftName: data.giftName, diamondCount, senderName: data.user?.nickname || data.nickname, timestamp: FieldValue.serverTimestamp()
            }).catch(() => {});
            scheduleThrottledSync();
        });

        connection.on('linkMicFanTicketMethod', (data) => {
            const fanTicket = Number(data?.fanTicketRoomNotice?.totalLinkmicFanTicket || 0);
            if (fanTicket > totalDiamonds) {
                totalDiamonds = fanTicket;
                scheduleThrottledSync();
            }
        });

        let ticks = 0;
        const heartbeatInterval = setInterval(async () => {
            if (!isConnected) return;
            ticks++;
            const updates = { 
                workerLastHeartbeat: FieldValue.serverTimestamp(),
                lastDetected: new Date().toISOString(),
                likes: totalLikes,
                totalLikes: totalLikes,
                shares: totalShares,
                totalShares: totalShares,
                followers: newFollowers,
                newFollowers: newFollowers,
                diamonds: totalDiamonds,
                totalDiamonds: totalDiamonds,
                comments: totalComments,
                totalComments: totalComments,
                currentViewers: currentViewers,
                peakViewers: peakViewers,
                totalUser: totalUser,
                total_user: totalUser,
                cumulative_audience: totalUser,
                enter_count: totalUser
            };
            
            // Push history every 2 minutes (2 ticks)
            if (ticks % 2 === 0) {
                const nowString = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                updates.history = FieldValue.arrayUnion({ time: nowString, viewers: currentViewers });
            }
            
            await userRef.set({
               tiktokLiveAPI: updates
            }, { merge: true }).catch(() => {});
        }, 30000);

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
                    views: Math.max(totalUser || 0, peakViewers || 0, existingData.peakViewers || 0),
                    likes: totalLikes || existingData.likes || 0,
                    totalLikes: totalLikes || existingData.likes || 0,
                    comments: totalComments || existingData.comments || 0,
                    totalComments: totalComments || existingData.comments || 0,
                    shares: totalShares || existingData.shares || 0,
                    followers: newFollowers || existingData.followers || 0,
                    topQuestions: topQuestions || [],
                    topComments: topComments || [],
                    topCommenters: topCommentersList || [],
                    topFans: Object.entries(topContributorsMap || {}).map(([name, score]) => ({ name, score })).sort((a, b) => b.score - a.score).slice(0, 5),
                    startedAt: startedAt,
                    endedAt: endedAt,
                    title: state.roomInfo?.data?.title || 'Session Live TikTok'
                };
                
                await userRef.set({ 
                    tiktokLiveAPI: { 
                        isLive: false,
                        status: 'OFFLINE',
                        currentViewers: 0,
                        ended_at: FieldValue.serverTimestamp(),
                        endedAt: endedAt,
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
       console.error("Daemon Live erreur (stream inactif ou erreur API):", e.message);
       try {
         if (existingData.isLive) {
           await userRef.set({
             tiktokLiveAPI: {
               isLive: false,
               status: 'OFFLINE',
               currentViewers: 0,
               ended_at: FieldValue.serverTimestamp()
             }
           }, { merge: true });
         }
       } catch (dbErr) {
         console.warn("Erreur fallback Firestore liveWorkerDaemon:", dbErr.message);
       }
       return { status: 'offline', error: e.message };
    }
});

// ============================================================================
// PASSERELLE TEMPS RÉEL TIKTOK LIVE (0€, 0 QUOTA, REMPLACE LE WORKER EXPIRÉ)
// ============================================================================
let warmLiveSession = {
    roomId: null,
    isConnected: false,
    connection: null,
    startedAt: null,
    title: '',
    currentViewers: 0,
    peakViewers: 0,
    totalUser: 0,
    likes: 0,
    shares: 0,
    comments: 0,
    followers: 0,
    diamonds: 0,
    recentComments: [],
    topQuestions: [],
    topCommenters: [],
    lastEventAt: 0
};

exports.getTikTokLiveStatus = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    const username = String(req.query.username || req.body?.username || 'karam.drame').replace(/^@/, '').trim();
    const db = getFirestore();
    const userRef = db.collection('users').doc('karamokho');

    try {
        // 1. Lecture de l'état Firestore existant
        const docSnap = await userRef.get();
        const rootData = docSnap.data() || {};
        const existingLive = rootData.tiktokLiveAPI || {};

        // 2. Appel ultra-rapide à l'API officielle TikTok /api-live/user/room/ (donne startTime exact + userCount exact + enterCount)
        const apiLiveUrl = `https://www.tiktok.com/api-live/user/room/?aid=1988&uniqueId=${encodeURIComponent(username)}&sourceType=54`;
        const apiRes = await fetch(apiLiveUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8'
            }
        });

        let isLive = false;
        let roomId = null;
        let title = '';
        let startedAt = null;
        let currentViewers = 0;
        let totalUser = 0;
        let profileFollowers = 0;

        if (apiRes.ok) {
            const apiJson = await apiRes.json();
            const liveRoom = apiJson?.data?.liveRoom;
            const userObj = apiJson?.data?.user;
            const statsObj = apiJson?.data?.stats;

            const status = Number(liveRoom?.status ?? userObj?.status ?? 0);
            const detectedRoomId = String(userObj?.roomId || liveRoom?.roomId || '');

            if (status === 2 && detectedRoomId && detectedRoomId !== '0') {
                isLive = true;
                roomId = detectedRoomId;
                title = liveRoom?.title || 'TikTok Live en cours';
                if (liveRoom?.startTime && Number(liveRoom.startTime) > 1e9) {
                    startedAt = new Date(Number(liveRoom.startTime) * 1000).toISOString();
                }
                currentViewers = Number(liveRoom?.liveRoomStats?.userCount || 0);
                totalUser = Number(liveRoom?.liveRoomStats?.enterCount || 0);
                profileFollowers = Number(statsObj?.followerCount || 0);
            }
        }

        // 3. Complément via /webcast/room/info/ si roomId détecté
        if (isLive && roomId) {
            try {
                const roomInfoRes = await fetch(`https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=${roomId}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                });
                if (roomInfoRes.ok) {
                    const roomJson = await roomInfoRes.json();
                    const rd = roomJson?.data;
                    if (rd) {
                        if (!startedAt && rd.create_time && Number(rd.create_time) > 1e9) {
                            startedAt = new Date(Number(rd.create_time) * 1000).toISOString();
                        }
                        if (currentViewers === 0 && Number(rd.user_count) > 0) {
                            currentViewers = Number(rd.user_count);
                        }
                        const roomTotalUser = Number(rd.stats?.total_user || rd.stats?.enter_count || 0);
                        if (roomTotalUser > totalUser) {
                            totalUser = roomTotalUser;
                        }
                    }
                }
            } catch (_) {}
        }

        if (!isLive) {
            if (warmLiveSession.connection) {
                try { warmLiveSession.connection.disconnect(); } catch (_) {}
                warmLiveSession.connection = null;
                warmLiveSession.isConnected = false;
            }
            return res.status(200).json({
                status: 'success',
                data: {
                    isLive: false,
                    status: 'OFFLINE',
                    roomId: null,
                    title: '',
                    currentViewers: 0,
                    viewers: 0,
                    checkedAt: new Date().toISOString(),
                    source: 'firebase-live-gateway'
                }
            });
        }

        // 4. Consolidation avec la session Firestore existante (si même roomId)
        const isSameRoom = String(existingLive.roomId || '') === String(roomId);
        let likes = isSameRoom ? Number(existingLive.likes ?? existingLive.totalLikes ?? 0) : 0;
        let shares = isSameRoom ? Number(existingLive.shares ?? existingLive.totalShares ?? 0) : 0;
        let comments = isSameRoom ? Number(existingLive.comments ?? existingLive.totalComments ?? 0) : 0;
        let followers = isSameRoom ? Number(existingLive.followers ?? existingLive.newFollowers ?? 0) : 0;
        let diamonds = isSameRoom ? Number(existingLive.diamonds ?? existingLive.totalDiamonds ?? 0) : 0;
        let peakViewers = isSameRoom ? Math.max(Number(existingLive.peakViewers || 0), currentViewers) : currentViewers;
        totalUser = isSameRoom ? Math.max(totalUser, Number(existingLive.totalUser || existingLive.cumulative_audience || 0), peakViewers) : Math.max(totalUser, currentViewers);

        // 5. Connexion Protobuf persistante en mémoire (warmLiveSession) pour capter likes.total, shares et chat en temps réel
        if (!warmLiveSession.isConnected || String(warmLiveSession.roomId) !== String(roomId)) {
            if (warmLiveSession.connection) {
                try { warmLiveSession.connection.disconnect(); } catch (_) {}
            }
            warmLiveSession = {
                roomId,
                isConnected: false,
                connection: null,
                startedAt: startedAt || existingLive.started_at || new Date().toISOString(),
                title,
                currentViewers,
                peakViewers,
                totalUser,
                likes,
                shares,
                comments,
                followers,
                diamonds,
                recentComments: isSameRoom && Array.isArray(existingLive.recentComments) ? existingLive.recentComments : [],
                topQuestions: isSameRoom && Array.isArray(existingLive.topQuestions) ? existingLive.topQuestions : [],
                topCommenters: isSameRoom && Array.isArray(existingLive.topCommenters) ? existingLive.topCommenters : [],
                lastEventAt: Date.now()
            };

            try {
                const { TikTokLiveConnection } = require('tiktok-live-connector');
                const conn = new TikTokLiveConnection(username, { processInitialData: true });
                warmLiveSession.connection = conn;

                conn.on('roomUser', (d) => {
                    const v = parseInt(d?.total) || Number(d?.viewerCount || d?.userCount || 0);
                    if (v > 0) {
                        warmLiveSession.currentViewers = v;
                        if (v > warmLiveSession.peakViewers) warmLiveSession.peakViewers = v;
                    }
                    const tu = Number(d?.totalUser || d?.total_user || 0);
                    if (tu > warmLiveSession.totalUser) warmLiveSession.totalUser = tu;
                    warmLiveSession.lastEventAt = Date.now();
                });

                conn.on('like', (d) => {
                    const rawTotal = Number(d?.total || d?.totalLikeCount || 0);
                    const rawCount = Number(d?.count || d?.likeCount || 1);
                    if (rawTotal > 0) {
                        warmLiveSession.likes = Math.max(warmLiveSession.likes, rawTotal);
                    } else {
                        warmLiveSession.likes += rawCount;
                    }
                    warmLiveSession.lastEventAt = Date.now();
                });

                const onShare = (d) => {
                    const sc = Number(d?.shareCount || 0);
                    if (sc > warmLiveSession.shares) {
                        warmLiveSession.shares = sc;
                    } else {
                        warmLiveSession.shares += 1;
                    }
                    warmLiveSession.lastEventAt = Date.now();
                };

                conn.on('share', onShare);
                conn.on('social', (d) => {
                    const act = String(d?.action || '');
                    const key = String(d?.common?.displayText?.key || d?.displayType || '').toLowerCase();
                    const pat = String(d?.common?.displayText?.defaultPattern || '').toLowerCase();
                    if (act === '3' || key.includes('share') || pat.includes('share') || pat.includes('partag') || Number(d?.shareCount || 0) > 0) {
                        onShare(d);
                    } else if (act === '1' || key.includes('follow') || pat.includes('follow') || pat.includes('abonn')) {
                        warmLiveSession.followers += 1;
                    }
                });

                conn.on('chat', (d) => {
                    warmLiveSession.comments += 1;
                    const txt = (d?.content || d?.comment || '').trim();
                    const nick = d?.user?.nickname || d?.user?.uniqueId || d?.nickname || 'Spectateur';
                    if (txt) {
                        warmLiveSession.recentComments.unshift({
                            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                            nickname: nick,
                            comment: txt,
                            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        });
                        warmLiveSession.recentComments = warmLiveSession.recentComments.slice(0, 50);
                    }
                    warmLiveSession.lastEventAt = Date.now();
                });

                conn.on('streamEnd', () => {
                    warmLiveSession.isConnected = false;
                });

                await Promise.race([
                    conn.connect().then(() => {
                        warmLiveSession.isConnected = true;
                        // Laisser 1200ms pour décoder le buffer initial (processInitialData)
                        return new Promise(r => setTimeout(r, 1200));
                    }),
                    new Promise(r => setTimeout(r, 3000))
                ]);
            } catch (connErr) {
                console.warn('[getTikTokLiveStatus] Note connexion Protobuf:', connErr.message);
            }
        }

        // Fusionner les compteurs temps réel de warmLiveSession
        if (warmLiveSession.roomId === roomId) {
            if (warmLiveSession.likes > likes) likes = warmLiveSession.likes;
            if (warmLiveSession.shares > shares) shares = warmLiveSession.shares;
            if (warmLiveSession.comments > comments) comments = warmLiveSession.comments;
            if (warmLiveSession.followers > followers) followers = warmLiveSession.followers;
            if (warmLiveSession.totalUser > totalUser) totalUser = warmLiveSession.totalUser;
            if (warmLiveSession.peakViewers > peakViewers) peakViewers = warmLiveSession.peakViewers;
            // Si warmLiveSession a reçu un roomUser très récent (< 10s), utiliser sa valeur exacte
            if (warmLiveSession.currentViewers > 0 && (Date.now() - warmLiveSession.lastEventAt) < 10000) {
                currentViewers = warmLiveSession.currentViewers;
            }
        }

        const finalStartedAt = startedAt || (isSameRoom ? (existingLive.started_at || existingLive.startedAt) : null) || new Date().toISOString();

        // Mise à jour propre de Firestore sans jamais écraser les listes existantes
        const updatedLiveObj = {
            ...existingLive,
            isLive: true,
            status: 'LIVE',
            roomId: String(roomId),
            title,
            started_at: finalStartedAt,
            startedAt: finalStartedAt,
            currentViewers,
            peakViewers,
            totalUser,
            total_user: totalUser,
            cumulative_audience: totalUser,
            enter_count: totalUser,
            likes,
            totalLikes: likes,
            shares,
            totalShares: shares,
            comments,
            totalComments: comments,
            followers,
            newFollowers: followers,
            diamonds,
            totalDiamonds: diamonds,
            lastDetected: new Date().toISOString(),
            checkSource: 'firebase-live-gateway'
        };
        if (warmLiveSession.recentComments?.length > 0) {
            updatedLiveObj.recentComments = warmLiveSession.recentComments;
        }

        await userRef.set({
            tiktokLiveAPI: updatedLiveObj
        }, { merge: true });

        return res.status(200).json({
            status: 'success',
            data: {
                isLive: true,
                status: 'LIVE',
                roomId: String(roomId),
                title,
                currentViewers,
                viewers: currentViewers,
                peakViewers,
                totalUser,
                likes,
                shares,
                comments,
                followers,
                profileFollowers,
                startedAt: finalStartedAt,
                started_at: finalStartedAt,
                checkedAt: new Date().toISOString(),
                source: 'firebase-live-gateway'
            }
        });
    } catch (err) {
        console.error('[getTikTokLiveStatus] Erreur:', err.message);
        return res.status(500).json({
            status: 'error',
            error: err.message
        });
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



