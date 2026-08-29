import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function check() {
  const snap = await getDoc(doc(db, 'users', 'karamokho'));
  const data = snap.data();
  console.log('Firestore tiktokLiveAPI:', JSON.stringify(data?.tiktokLiveAPI || {}));
  console.log('Firestore tiktokAPI.isLive:', data?.tiktokAPI?.isLive);
  console.log('Firestore isLive:', data?.isLive);
  process.exit(0);
}

check();
