import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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

async function update() {
  const userDocRef = doc(db, 'users', 'karamokho');
  await updateDoc(userDocRef, {
    'tiktokLiveAPI.currentViewers': 8,
    'tiktokLiveAPI.totalUser': 409,
    'tiktokLiveAPI.peakViewers': 33,
    'tiktokLiveAPI.isLive': true,
    'tiktokLiveAPI.lastDetected': new Date().toISOString()
  });
  console.log('Mis a jour Firestore: 8 viewers actuels, 409 entrees totales !');
  process.exit(0);
}

update();
