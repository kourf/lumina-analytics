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

async function syncTikTok() {
  console.log('Demarrage de la synchronisation TikTok @karam.drame...');
  
  try {
    const userDocRef = doc(db, 'users', 'karamokho');
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      console.error('Document users/karamokho introuvable.');
      process.exit(1);
    }

    const userData = snap.data();
    const currentVideos = userData.tiktokAPI?.recentVideos || [];
    console.log(currentVideos.length + ' videos actuelles dans Firestore.');

    const profileRes = await fetch('https://www.tiktok.com/@karam.drame', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      }
    });

    let liveFollowers = userData.tiktokAPI?.followers || 6163;
    let liveTotalLikes = userData.tiktokAPI?.totalLikes || 16000;

    if (profileRes.ok) {
      const html = await profileRes.text();
      const universalMatch = html.match(/<script id=" __UNIVERSAL_DATA_FOR_REHYDRATION__\ type=\application\/json\>([\s\S]*?)<\/script>/);
 if (universalMatch) {
 try {
 const uni = JSON.parse(universalMatch[1]);
 const stats = uni.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.stats;
 if (stats) {
 if (stats.followerCount) liveFollowers = stats.followerCount;
 if (stats.heart || stats.heartCount) liveTotalLikes = stats.heart || stats.heartCount;
 console.log('Stats TikTok recuperees : ' + liveFollowers + ' abonnes, ' + liveTotalLikes + ' likes cumules.');
 }
 } catch (e) {
 console.warn('Erreur parsing:', e.message);
 }
 }
 }

 const totalViews = currentVideos.reduce((acc, v) => acc + (v.views || 0), 0);
 const totalLikes = liveTotalLikes || currentVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
 const totalComments = currentVideos.reduce((acc, v) => acc + (v.comments || 0), 0);
 const totalShares = currentVideos.reduce((acc, v) => acc + (v.shares || 0), 0);
 const engagementRate = totalViews > 0 ? (((totalLikes + totalComments + totalShares) / totalViews) * 100).toFixed(1) + '%' : '6.1%';

 await updateDoc(userDocRef, {
 'tiktokAPI.followers': liveFollowers,
 'tiktokAPI.likes': liveTotalLikes,
 'tiktokAPI.totalLikes': liveTotalLikes,
 'tiktokAPI.views': totalViews,
 'tiktokAPI.shares': totalShares,
 'tiktokAPI.totalComments': totalComments,
 'tiktokAPI.engagementRate': engagementRate,
 'tiktokAPI.lastSync': new Date().toISOString()
 });

 console.log('Synchronisation Firestore terminee avec succes !');
 process.exit(0);
 } catch (err) {
 console.error('Erreur de synchronisation TikTok:', err);
 process.exit(1);
 }
}

syncTikTok();
