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

async function updateLiveSession() {
  const roomId = '7679407957632633622';
  const url = 'https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=' + roomId;
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
      'Referer': 'https://www.tiktok.com/@karam.drame'
    }
  });

  const json = await res.json();
  const room = json.data || {};
  console.log('Room Info received:', room.title, 'Status:', room.status, 'Viewers:', room.user_count);

  const isLive = room.status === 2 || room.status === 4;
  const currentViewers = Number(room.user_count || 10);
  const title = room.title || 'Analyse de votre site !';
  const startedAt = room.create_time ? new Date(room.create_time * 1000).toISOString() : new Date().toISOString();

  const userDocRef = doc(db, 'users', 'karamokho');
  const snap = await getDoc(userDocRef);
  const currentData = snap.data()?.tiktokLiveAPI || {};

  const peakViewers = Math.max(Number(currentData.peakViewers || 0), currentViewers);
  const likes = Math.max(Number(currentData.likes || 0), Number(room.like_count || 0));

  const livePayload = {
    'tiktokLiveAPI.isLive': isLive,
    'tiktokLiveAPI.roomId': roomId,
    'tiktokLiveAPI.title': title,
    'tiktokLiveAPI.currentViewers': currentViewers,
    'tiktokLiveAPI.peakViewers': peakViewers,
    'tiktokLiveAPI.likes': likes,
    'tiktokLiveAPI.started_at': startedAt,
    'tiktokLiveAPI.lastDetected': new Date().toISOString(),
    'tiktokAPI.isLive': isLive
  };

  await updateDoc(userDocRef, livePayload);
  console.log('✅ Firestore Mis à Jour avec le LIVE ACTIF de Karam !');
  process.exit(0);
}

updateLiveSession();
