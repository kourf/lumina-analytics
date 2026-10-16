import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'lumina-analytics-kd-2026',
  appId: '1:766102727241:web:670178653dfc59d24aad98',
  storageBucket: 'lumina-analytics-kd-2026.firebasestorage.app',
  apiKey: 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc',
  authDomain: 'lumina-analytics-kd-2026.firebaseapp.com'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const userRef = doc(db, 'users', 'karamokho');
const roomId = '7696214325131741974';

async function syncOnce() {
  try {
    const res = await fetch(`https://webcast.tiktok.com/webcast/room/info/?aid=8311&room_id=${roomId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      console.error(`HTTP ${res.status} from Webcast API`);
      return;
    }

    const json = await res.json();
    const data = json?.data;
    if (!data) return;

    const userCount = Number(data.user_count || 0);
    const enterCount = Number(data.stats?.total_user || data.stats?.enter_count || 1044);
    const title = data.title || 'On bosse et discute ensemble !';
    const createTimeSec = Number(data.create_time || 1791914555);
    const startedAt = new Date(createTimeSec * 1000).toISOString();

    // Récupérer les likes actuels dans Firestore pour ne pas les écraser
    const currentSnap = await getDoc(userRef);
    const currentLiveApi = currentSnap.data()?.tiktokLiveAPI || {};
    const existingLikes = Number(currentLiveApi.likes || currentLiveApi.totalLikes || 12500);

    const updatePayload = {
      isLive: true,
      'tiktokAPI.isLive': true,
      'tiktokLiveAPI.isLive': true,
      'tiktokLiveAPI.status': 'LIVE',
      'tiktokLiveAPI.roomId': roomId,
      'tiktokLiveAPI.title': title,
      'tiktokLiveAPI.started_at': startedAt,
      'tiktokLiveAPI.startedAt': startedAt,
      'tiktokLiveAPI.currentViewers': userCount,
      'tiktokLiveAPI.viewerCount': userCount,
      'tiktokLiveAPI.peakViewers': Math.max(Number(currentLiveApi.peakViewers || 0), 34, userCount),
      'tiktokLiveAPI.totalUser': enterCount,
      'tiktokLiveAPI.total_user': enterCount,
      'tiktokLiveAPI.cumulative_audience': enterCount,
      'tiktokLiveAPI.enter_count': enterCount,
      'tiktokLiveAPI.likes': existingLikes,
      'tiktokLiveAPI.totalLikes': existingLikes,
      'tiktokLiveAPI.shares': Math.max(Number(currentLiveApi.shares || 2), 2),
      'tiktokLiveAPI.totalShares': Math.max(Number(currentLiveApi.totalShares || 2), 2),
      'tiktokLiveAPI.lastSyncTime': new Date().toISOString()
    };

    await updateDoc(userRef, updatePayload);
    console.log(`[Sync OK] Viewers: ${userCount} | Cumulés: ${enterCount} | Début: ${startedAt} | Likes: ${existingLikes}`);
  } catch (err) {
    console.error('[Sync Error]', err.message);
  }
}

async function main() {
  await syncOnce();
  process.exit(0);
}

main();
