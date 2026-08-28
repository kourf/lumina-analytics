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

async function fetchLiveVideoStats(videoId) {
  try {
    const url = 'https://www.tiktok.com/@karam.drame/video/' + videoId;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
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
  console.log('Demarrage de la synchronisation des 71 videos TikTok...');
  
  const userDocRef = doc(db, 'users', 'karamokho');
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    console.error('Document users/karamokho introuvable.');
    process.exit(1);
  }

  const userData = snap.data();
  const videos = userData.tiktokAPI?.recentVideos || [];
  console.log('Analyse de ' + videos.length + ' videos dans le catalogue...');

  let liveFollowers = userData.tiktokAPI?.followers || 6163;
  let liveTotalLikes = userData.tiktokAPI?.totalLikes || 16000;
  let liveAvatar = userData.tiktokAPI?.avatar_url || '';

  try {
    const profileRes = await fetch('https://www.tiktok.com/@karam.drame', {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9' }
    });
    if (profileRes.ok) {
      const html = await profileRes.text();
      const idx = html.indexOf('__UNIVERSAL_DATA_FOR_REHYDRATION__');
      if (idx !== -1) {
        const tagClose = html.indexOf('>', idx);
        const endTag = html.indexOf('</script>', tagClose);
        const json = JSON.parse(html.substring(tagClose + 1, endTag));
        const userDetail = json.__DEFAULT_SCOPE__?.['webapp.user-detail'];
        if (userDetail?.userInfo?.stats) {
          liveFollowers = userDetail.userInfo.stats.followerCount || liveFollowers;
          liveTotalLikes = userDetail.userInfo.stats.heart || userDetail.userInfo.stats.heartCount || liveTotalLikes;
        }
        if (userDetail?.userInfo?.user?.avatarLarger) {
          liveAvatar = userDetail.userInfo.user.avatarLarger;
        }
      }
    }
  } catch (e) {
    console.warn('Erreur profil global:', e.message);
  }

  const updatedVideos = [...videos];
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < updatedVideos.length; i += BATCH_SIZE) {
    const batch = updatedVideos.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (v, index) => {
      const realIndex = i + index;
      const liveStats = await fetchLiveVideoStats(v.id);
      if (liveStats) {
        updatedVideos[realIndex] = {
          ...v,
          views: Math.max(v.views || 0, liveStats.views),
          likes: Math.max(v.likes || 0, liveStats.likes),
          comments: Math.max(v.comments || 0, liveStats.comments),
          shares: Math.max(v.shares || 0, liveStats.shares),
          coverUrl: liveStats.coverUrl || v.coverUrl,
          title: liveStats.title || v.title
        };
        console.log('[' + (realIndex + 1) + '/' + updatedVideos.length + '] Video ' + v.id + ' : ' + updatedVideos[realIndex].views + ' vues, ' + updatedVideos[realIndex].likes + ' likes');
      } else {
        console.log('[' + (realIndex + 1) + '/' + updatedVideos.length + '] Video ' + v.id + ' conservee');
      }
    });

    await Promise.all(promises);
    await new Promise(r => setTimeout(r, 150));
  }

  const totalViews = updatedVideos.reduce((acc, v) => acc + (v.views || 0), 0);
  const totalLikes = liveTotalLikes || updatedVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const totalComments = updatedVideos.reduce((acc, v) => acc + (v.comments || 0), 0);
  const totalShares = updatedVideos.reduce((acc, v) => acc + (v.shares || 0), 0);
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
    'tiktokAPI.lastSync': new Date().toISOString()
  };

  console.log('TOTAUX ACTUALISES : ' + totalViews + ' vues cumulees, ' + totalLikes + ' likes, ' + liveFollowers + ' followers.');

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
        lastSync: new Date().toISOString()
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
