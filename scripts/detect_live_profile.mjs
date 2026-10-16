import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "lumina-analytics-kd-2026",
  appId: "1:766102727241:web:670178653dfc59d24aad98",
  apiKey: "AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function detect() {
  try {
    const profileRes = await fetch('https://www.tiktok.com/@karam.drame', {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });
    const html = await profileRes.text();
    const idx = html.indexOf('__UNIVERSAL_DATA_FOR_REHYDRATION__');
    
    let isLive = false;
    let currentViewers = 0;
    let roomId = '';
    let title = '';
    let r = null;

    if (idx !== -1) {
      const tagClose = html.indexOf('>', idx);
      const endTag = html.indexOf('</script>', tagClose);
      const json = JSON.parse(html.substring(tagClose + 1, endTag));
      const userInfo = json.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.user;
      roomId = userInfo?.roomId || '';
      console.log('User Info roomId:', roomId);
      
      if (roomId && roomId !== '0') {
        const roomRes = await fetch('https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=' + roomId, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
            'Referer': 'https://www.tiktok.com/@karam.drame'
          }
        });
        if (roomRes.ok) {
          const rJson = await roomRes.json();
          r = rJson.data;
          const ownerHandle = String(r?.owner?.display_id || r?.owner?.unique_id || '').toLowerCase();
          const isOwnerValid = !ownerHandle || ownerHandle === 'karam.drame';
          if (r && r.status === 2 && isOwnerValid) {
            isLive = true;
            currentViewers = r?.user_count || 0;
            title = r?.title || '';
            console.log('STATUS:', r?.status, 'TITLE:', r?.title, 'VIEWERS:', r?.user_count);
          } else {
            console.log('Live inactif ou autre streamer (status:', r?.status, ')');
            isLive = false;
            currentViewers = 0;
            roomId = '';
          }
        }
      }
    }

    const userRef = doc(db, 'users', 'karamokho');
    const updateData = {
      'tiktokLiveAPI.isLive': isLive,
      'tiktokAPI.isLive': isLive,
      'isLive': isLive,
      'tiktokLiveAPI.currentViewers': currentViewers,
      'tiktokLiveAPI.roomId': roomId,
      'tiktokLiveAPI.title': title,
      'tiktokLiveAPI.lastChecked': new Date().toISOString()
    };

    if (isLive) {
      if (r?.stats?.like_count || r?.stats?.digg_count) {
        updateData['tiktokLiveAPI.totalLikes'] = r?.stats?.like_count || r?.stats?.digg_count || 0;
      }
      if (r?.stats?.share_count !== undefined) {
        updateData['tiktokLiveAPI.totalShares'] = r?.stats?.share_count || 0;
      }
      if (r?.stats?.follow_count !== undefined) {
        updateData['tiktokLiveAPI.newFollowers'] = r?.stats?.follow_count || 0;
      }
      const totalUser = r?.stats?.total_user || r?.stats?.enter_count || 0;
      if (totalUser > 0) {
        updateData['tiktokLiveAPI.totalUser'] = totalUser;
        updateData['tiktokLiveAPI.total_user'] = totalUser;
        updateData['tiktokLiveAPI.cumulative_audience'] = totalUser;
        updateData['tiktokLiveAPI.enter_count'] = totalUser;
      }
      if (r?.create_time && typeof r.create_time === 'number' && r.create_time > 1e9) {
        const trueStart = new Date(r.create_time * 1000).toISOString();
        updateData['tiktokLiveAPI.startedAt'] = trueStart;
        updateData['tiktokLiveAPI.started_at'] = trueStart;
      }
    }

    await updateDoc(userRef, updateData);

    console.log(`Firestore mis à jour - isLive: ${isLive}, Viewers: ${currentViewers}`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la détection:', error);
    process.exit(1);
  }
}

detect();