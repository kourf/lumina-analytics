const admin = require("firebase-admin");
// Initialisation de Firebase Admin avec les identifiants par défaut
admin.initializeApp({
  projectId: "lumina-analytics-kd-2026"
});

const db = admin.firestore();

const YOUTUBE_API_KEY = "AIzaSyDeCstNIEwTjVr5ltwvpS1TUsQZUt654qk";
const YOUTUBE_CHANNEL_ID = "UC_V-hdqGtizf9g7gxahdmqQ"; 
const YOUTUBE_UPLOADS_PLAYLIST_ID = "UU_V-hdqGtizf9g7gxahdmqQ";

async function runOnce() {
  console.log("Démarrage manuel de la synchronisation YouTube...");
  
  try {
    const channelUrl = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`;
    const channelResponse = await fetch(channelUrl);
    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      console.error("Chaîne introuvable");
      return;
    }

    const channelInfo = channelData.items[0];
    const stats = channelInfo.statistics;
    const snippet = channelInfo.snippet;

    const playlistUrl = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${YOUTUBE_UPLOADS_PLAYLIST_ID}&maxResults=50&key=${YOUTUBE_API_KEY}`;
    const playlistResponse = await fetch(playlistUrl);
    const playlistData = await playlistResponse.json();

    let videosData = [];

    if (playlistData.items && playlistData.items.length > 0) {
      const videoIds = playlistData.items.map(item => item.contentDetails.videoId).join(',');

      const videosUrl = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
      const videosResponse = await fetch(videosUrl);
      const videosDetails = await videosResponse.json();

      if (videosDetails.items) {
        videosData = videosDetails.items.map(v => {
          const vStats = v.statistics || {};
          const views = parseInt(vStats.viewCount || '0', 10);
          const likes = parseInt(vStats.likeCount || '0', 10);
          const comments = parseInt(vStats.commentCount || '0', 10);
          const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

          return {
            id: v.id,
            title: v.snippet.title,
            publishedAt: v.snippet.publishedAt,
            thumbnailUrl: v.snippet.thumbnails?.medium?.url || '',
            duration: v.contentDetails.duration,
            views: views,
            likes: likes,
            comments: comments,
            engagementRate: parseFloat(engagementRate.toFixed(2))
          };
        });
      }
    }

    const sampleViews = videosData.reduce((acc, v) => acc + v.views, 0);
    const sampleLikes = videosData.reduce((acc, v) => acc + v.likes, 0);
    const sampleComments = videosData.reduce((acc, v) => acc + v.comments, 0);
    const globalEngagementRate = sampleViews > 0 ? ((sampleLikes + sampleComments) / sampleViews) * 100 : 0;

    const sortedByViews = [...videosData].sort((a, b) => b.views - a.views);
    const topVideos = sortedByViews.slice(0, 5);

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const oldVideos = videosData.filter(v => new Date(v.publishedAt) < twoDaysAgo);
    const sortedWeakVideos = oldVideos.sort((a, b) => a.views - b.views);
    const weakVideos = sortedWeakVideos.slice(0, 5);

    const userRef = db.collection('users').doc('karamokho');
    await userRef.set({
      youtubeAPI: {
        channel: {
          title: snippet.title,
          description: snippet.description,
          thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
          customUrl: snippet.customUrl,
          subscribers: parseInt(stats.subscriberCount || '0', 10),
          totalViews: parseInt(stats.viewCount || '0', 10),
          videoCount: parseInt(stats.videoCount || '0', 10),
          globalEngagementRate: parseFloat(globalEngagementRate.toFixed(2)),
          lastSync: admin.firestore.FieldValue.serverTimestamp()
        },
        videos: videosData,
        topVideos: topVideos,
        weakVideos: weakVideos
      }
    }, { merge: true });

    console.log(`Succès: Chaîne ${snippet.title} synchronisée avec ${videosData.length} vidéos analysées dans Firestore.`);
    process.exit(0);
  } catch (error) {
    console.error("Erreur:", error);
    process.exit(1);
  }
}

runOnce();
