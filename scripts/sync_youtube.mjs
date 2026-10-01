import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

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

const YOUTUBE_API_KEY = 'AIzaSyDeCstNIEwTjVr5ltwvpS1TUsQZUt654qk';
const YOUTUBE_CHANNEL_ID = 'UC_V-hdqGtizf9g7gxahdmqQ';

function parseISODuration(duration) {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function runYouTubeFullSync() {
  console.log('🚀 Starting YouTube Full Sync for Karamokho...');
  
  // 1. Fetch Channel Info
  const chRes = await fetch(`https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`);
  const chData = await chRes.json();
  if (!chData.items || chData.items.length === 0) {
    throw new Error('Channel not found on YouTube API');
  }

  const chInfo = chData.items[0];
  const snippet = chInfo.snippet;
  const stats = chInfo.statistics;
  const uploadsPlaylistId = chInfo.contentDetails?.relatedPlaylists?.uploads || `UU${YOUTUBE_CHANNEL_ID.substring(2)}`;

  console.log(`✓ Channel: ${snippet.title} (@${snippet.customUrl || ''})`);
  console.log(`  Subscribers: ${stats.subscriberCount}, Views: ${stats.viewCount}, Videos: ${stats.videoCount}`);

  // 2. Fetch All Videos from Uploads Playlist
  let playlistItems = [];
  let pageToken = '';
  do {
    const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
    const plRes = await fetch(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50${pageParam}&key=${YOUTUBE_API_KEY}`);
    const plData = await plRes.json();
    if (plData.items) {
      playlistItems.push(...plData.items);
    }
    pageToken = plData.nextPageToken;
  } while (pageToken && playlistItems.length < 500);

  console.log(`✓ Fetched ${playlistItems.length} items from uploads playlist`);

  // 3. Batch fetch video details
  const videoIds = playlistItems.map(p => p.contentDetails.videoId);
  let allVideoDetails = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50).join(',');
    const vRes = await fetch(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,liveStreamingDetails&id=${batch}&key=${YOUTUBE_API_KEY}`);
    const vData = await vRes.json();
    if (vData.items) {
      allVideoDetails.push(...vData.items);
    }
  }

  console.log(`✓ Retrieved details for ${allVideoDetails.length} videos`);

  // 4. Map and classify videos
  const videosData = allVideoDetails.map(v => {
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

  // 5. Analyses globales
  const sampleViews = videosData.reduce((acc, v) => acc + v.views, 0);
  const sampleLikes = videosData.reduce((acc, v) => acc + v.likes, 0);
  const sampleComments = videosData.reduce((acc, v) => acc + v.comments, 0);
  const globalEngagementRate = sampleViews > 0 ? ((sampleLikes + sampleComments) / sampleViews) * 100 : 0;

  const shorts = videosData.filter(v => v.type === 'Short');
  const lives = videosData.filter(v => v.type === 'Direct' || v.type === 'Live' || v.format === 'live');
  const videos = videosData.filter(v => (v.type === 'Vidéo' || v.type === 'Video') && v.format !== 'live');

  const avgShortDuration = shorts.length > 0 ? shorts.reduce((acc, v) => acc + v.durationSec, 0) / shorts.length : 0;
  const avgVideoDuration = videos.length > 0 ? videos.reduce((acc, v) => acc + v.durationSec, 0) / videos.length : 0;
  const avgLiveDuration = lives.length > 0 ? lives.reduce((acc, v) => acc + v.durationSec, 0) / lives.length : 0;

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
  }

  // Top videos & weak videos
  const sortedByViews = [...videosData].sort((a, b) => b.views - a.views);
  const topVideos = sortedByViews.slice(0, 15);

  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const oldVideos = videosData.filter(v => new Date(v.publishedAt) < twoDaysAgo);
  const oldClassic = oldVideos.filter(v => (v.type === 'Vidéo' || v.type === 'Video') && v.format !== 'live').sort((a, b) => a.views - b.views);
  const oldShorts = oldVideos.filter(v => v.type === 'Short').sort((a, b) => a.views - b.views);
  const oldLives = oldVideos.filter(v => v.type === 'Direct' || v.type === 'Live' || v.format === 'live').sort((a, b) => a.views - b.views);
  const weakVideos = [
    ...oldClassic.slice(0, 5),
    ...oldShorts.slice(0, 5),
    ...oldLives.slice(0, 5)
  ];

  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    'youtubeAPI.channel': {
      id: chInfo.id,
      title: snippet.title,
      description: snippet.description || '',
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      customUrl: snippet.customUrl || '@karamdrm',
      publishedAt: snippet.publishedAt,
      subscribers: parseInt(stats.subscriberCount || '0', 10),
      totalViews: parseInt(stats.viewCount || '0', 10),
      videoCount: parseInt(stats.videoCount || '0', 10),
      globalEngagementRate: parseFloat(globalEngagementRate.toFixed(2)),
      totalLikes: sampleLikes,
      lastSync: {
        seconds: nowSeconds,
        nanoseconds: 0
      }
    },
    'youtubeAPI.analytics': {
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
    'youtubeAPI.videos': videosData,
    'youtubeAPI.topVideos': topVideos,
    'youtubeAPI.weakVideos': weakVideos
  };

  console.log(`Updating Firestore users/karamokho...`);
  console.log(`- Total videos: ${videosData.length}`);
  console.log(`- Lives: ${lives.length}, Shorts: ${shorts.length}, Videos: ${videos.length}`);
  
  await updateDoc(doc(db, 'users', 'karamokho'), payload);

  console.log('✅ Firestore updated successfully with fresh YouTube data!');
}

runYouTubeFullSync()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  });
