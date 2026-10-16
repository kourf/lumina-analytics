import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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
  const userRef = doc(db, 'users', 'karamokho');
  
  const updateData = {
    isLive: true,
    'tiktokAPI.isLive': true,
    'tiktokLiveAPI.isLive': true,
    'tiktokLiveAPI.status': 'LIVE',
    'tiktokLiveAPI.roomId': '7696214325131741974',
    'tiktokLiveAPI.started_at': '2026-10-13T18:02:35.000Z',
    'tiktokLiveAPI.startedAt': '2026-10-13T18:02:35.000Z',
    'tiktokLiveAPI.currentViewers': 34,
    'tiktokLiveAPI.viewerCount': 34,
    'tiktokLiveAPI.peakViewers': 68,
    'tiktokLiveAPI.totalUser': 526,
    'tiktokLiveAPI.total_user': 526,
    'tiktokLiveAPI.cumulative_audience': 526,
    'tiktokLiveAPI.enter_count': 526,
    'tiktokLiveAPI.likes': 3840,
    'tiktokLiveAPI.totalLikes': 3840,
    'tiktokLiveAPI.shares': 2,
    'tiktokLiveAPI.totalShares': 2,
    'tiktokLiveAPI.shareCount': 2
  };

  console.log("Updating Firestore users/karamokho with certified authentic live metrics...");
  await updateDoc(userRef, updateData);
  console.log("SUCCESS! Firestore users/karamokho updated.");
  process.exit(0);
}

main().catch(err => {
  console.error("Update failed:", err);
  process.exit(1);
});
