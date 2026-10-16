import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'lumina-analytics-kd-2026',
  appId: '1:766102727241:web:670178653dfc59d24aad98',
  storageBucket: 'lumina-analytics-kd-2026.firebasestorage.app',
  apiKey: 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc',
  authDomain: 'lumina-analytics-kd-2026.firebaseapp.com'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const snap = await getDoc(doc(db, 'users', 'karamokho'));
  if (snap.exists()) {
    const data = snap.data();
    console.log("=== FIRESTORE users/karamokho ===");
    console.log("isLive:", data.isLive);
    console.log("tiktokLiveAPI:", JSON.stringify(data.tiktokLiveAPI, null, 2));
  } else {
    console.log("Document does not exist");
  }
  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
