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

    if (idx !== -1) {
      const tagClose = html.indexOf('>', idx);
      const endTag = html.indexOf('</script>', tagClose);
      const json = JSON.parse(html.substring(tagClose + 1, endTag));
      const userInfo = json.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.user;
      roomId = userInfo?.roomId || '';
      console.log('User Info roomId:', roomId);
      
      if (roomId && roomId !== '0') {
        isLive = true;
        const roomRes = await fetch('https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=' + roomId, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
            'Referer': 'https://www.tiktok.com/@karam.drame'
          }
        });
        const rJson = await roomRes.json();
        const r = rJson.data;
        currentViewers = r?.user_count || 0;
        title = r?.title || '';
        console.log('STATUS:', r?.status, 'TITLE:', r?.title, 'VIEWERS:', r?.user_count, 'STATS:', r?.stats);
      }
    }

    const userRef = doc(db, 'users', 'karamokho');
    await updateDoc(userRef, {
      'tiktokLiveAPI.isLive': isLive,
      'tiktokLiveAPI.currentViewers': currentViewers,
      'tiktokLiveAPI.roomId': roomId,
      'tiktokLiveAPI.title': title,
      'tiktokLiveAPI.lastChecked': new Date().toISOString()
    });

    console.log(`Firestore mis à jour - isLive: ${isLive}, Viewers: ${currentViewers}`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la détection:', error);
    process.exit(1);
  }
}

detect();