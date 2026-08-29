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

async function archiveSession() {
  const userDocRef = doc(db, 'users', 'karamokho');
  const snap = await getDoc(userDocRef);
  const data = snap.data() || {};
  const prevArchives = data.historyArchives || data.tiktokLiveAPI?.historyArchives || [];

  const todayLive = {
    id: 'live_7679407957632633622',
    roomId: '7679407957632633622',
    date: '2026-08-29T11:05:34.000Z',
    startedAt: '2026-08-29T11:05:34.000Z',
    endedAt: '2026-08-29T13:15:19.000Z',
    durationStr: '02h10',
    durationMinutes: 130,
    peakViewers: 33,
    avgViewers: 14,
    totalUser: 602,
    totalLikes: 2450,
    totalComments: 430,
    shares: 38,
    followers: 6,
    title: 'Analyse de votre site !'
  };

  // Filtrer pour ne pas doubler si déjà présent
  const updatedArchives = [todayLive, ...prevArchives.filter(a => a.roomId !== '7679407957632633622')];

  await updateDoc(userDocRef, {
    'historyArchives': updatedArchives,
    'tiktokLiveAPI.historyArchives': updatedArchives,
    'tiktokLiveAPI.isLive': false,
    'tiktokLiveAPI.currentViewers': 0,
    'tiktokLiveAPI.totalUser': 602,
    'tiktokLiveAPI.lastDetected': new Date().toISOString(),
    'tiktokAPI.isLive': false
  });

  console.log('✅ SESSION LIVE DU 29 AOÛT ARCHIVÉE AVEC SUCCÈS DANS HISTOIRE DES LIVES !');
  process.exit(0);
}

archiveSession();
