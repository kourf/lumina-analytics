import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'lumina-analytics-kd-2026',
  apiKey: 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc',
  appId: '1:766102727241:web:670178653dfc59d24aad98',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setOffline() {
  try {
    const userRef = doc(db, 'users', 'karamokho');
    await updateDoc(userRef, {
      'tiktokLiveAPI.isLive': false,
      'tiktokLiveAPI.currentViewers': 0,
      'tiktokLiveAPI.roomId': '',
      'tiktokLiveAPI.lastChecked': new Date().toISOString(),
      'tiktokAPI.isLive': false,
      'isLive': false
    });
    console.log('✅ Firestore mis à jour : isLive = false, currentViewers = 0');
  } catch (err) {
    console.error('Erreur mise à jour Firestore:', err.message);
  }
  process.exit(0);
}

setOffline();
