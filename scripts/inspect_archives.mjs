import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'lumina-analytics-kd-2026',
  appId: '1:766102727241:web:670178653dfc59d24aad98',
  apiKey: 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const s = await getDocs(collection(db, 'tiktok_archives'));
  console.log('Archives count:', s.size);
  s.docs.forEach(d => {
    const data = d.data();
    console.log(d.id, {
      title: data.title,
      duration: data.duration,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      peakViewers: data.peakViewers,
      totalUser: data.totalUser || data.cumulative_audience,
      likes: data.likes || data.totalLikes
    });
  });
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
