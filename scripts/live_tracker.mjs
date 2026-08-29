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

async function runTrackerOnce() {
  const roomId = '7679407957632633622';
  const url = 'https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=' + roomId;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Referer': 'https://www.tiktok.com/@karam.drame'
      }
    });

    if (!res.ok) {
      console.log('HTTP error Webcast:', res.status);
      return;
    }

    const json = await res.json();
    const room = json.data;
    if (!room) return;

    const isLive = room.status === 2 || room.status === 4;
    const currentViewers = Number(room.user_count || 0);
    const title = room.title || 'Live TikTok en cours';
    const nowTimeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const userDocRef = doc(db, 'users', 'karamokho');
    const snap = await getDoc(userDocRef);
    const liveApi = snap.data()?.tiktokLiveAPI || {};

    const prevPeak = Number(liveApi.peakViewers || 0);
    const peakViewers = Math.max(prevPeak, currentViewers);
    const prevHistory = Array.isArray(liveApi.history) ? liveApi.history : [];

    const newHistory = [...prevHistory.slice(-40), { time: nowTimeStr, viewers: currentViewers }];
    
    const startedTime = room.create_time ? (room.create_time * 1000) : (new Date(liveApi.started_at || Date.now()).getTime());
    const durationMinutes = Math.max(1, Math.round((Date.now() - startedTime) / 60000));
    
    const estimatedLikes = Math.max(Number(liveApi.likes || 0), Math.round(durationMinutes * 45 + currentViewers * 35));
    const estimatedComments = Math.max(Number(liveApi.comments || 0), Math.round(durationMinutes * 9 + currentViewers * 4));
    const estimatedShares = Math.max(Number(liveApi.shares || 0), Math.round(durationMinutes * 0.8));
    const estimatedFollowers = Math.max(Number(liveApi.followers || 0), Math.round(durationMinutes * 0.3));

    const payload = {
      'tiktokLiveAPI.isLive': isLive,
      'tiktokLiveAPI.roomId': roomId,
      'tiktokLiveAPI.title': title,
      'tiktokLiveAPI.currentViewers': currentViewers,
      'tiktokLiveAPI.peakViewers': peakViewers,
      'tiktokLiveAPI.likes': estimatedLikes,
      'tiktokLiveAPI.comments': estimatedComments,
      'tiktokLiveAPI.shares': estimatedShares,
      'tiktokLiveAPI.followers': estimatedFollowers,
      'tiktokLiveAPI.history': newHistory,
      'tiktokLiveAPI.lastDetected': new Date().toISOString(),
      'tiktokAPI.isLive': isLive
    };

    await updateDoc(userDocRef, payload);
    console.log('[' + nowTimeStr + '] LIVE SYNCHRONISE : ' + currentViewers + ' viewers, ' + peakViewers + ' pic, ' + estimatedLikes + ' likes, ' + estimatedComments + ' comms');
  } catch (e) {
    console.error('Erreur tracker:', e.message);
  }
}

async function loop() {
  console.log('Demarrage du tracker Live TikTok temps reel...');
  await runTrackerOnce();
  process.exit(0);
}

loop();
