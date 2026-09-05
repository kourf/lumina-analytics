import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'lumina-analytics-kd-2026',
  apiKey: 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc',
  appId: '1:766102727241:web:670178653dfc59d24aad98',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    const snap = await getDoc(doc(db, 'users', 'karamokho'));
    if (snap.exists()) {
      const data = snap.data();
      console.log('=== FIRESTORE SNAPSHOT ===');
      console.log('tiktokLiveAPI.isLive:', data.tiktokLiveAPI?.isLive);
      console.log('tiktokAPI.isLive:', data.tiktokAPI?.isLive);
      console.log('isLive root:', data.isLive);
      console.log('roomId:', data.tiktokLiveAPI?.roomId);
      console.log('currentViewers:', data.tiktokLiveAPI?.currentViewers);
      console.log('lastDetected:', data.tiktokLiveAPI?.lastDetected);
      console.log('Full tiktokLiveAPI:', JSON.stringify(data.tiktokLiveAPI, null, 2));
    } else {
      console.log('Doc not found');
    }
  } catch (err) {
    console.error('Firestore read error:', err.message);
  }
  process.exit(0);
}

check();
