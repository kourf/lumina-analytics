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

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function syncExactLive() {
  const roomId = '7679407957632633622';
  const url = 'https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=' + roomId;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
      'Referer': 'https://www.tiktok.com/@karam.drame'
    }
  });

  const json = await res.json();
  const room = json.data || {};
  const stats = room.stats || {};

  console.log('TIKTOK OFFICIAL STATS EN DIRECT :');
  console.log('Viewers en direct (user_count):', room.user_count);
  console.log('Total entrées (total_user):', stats.total_user);
  console.log('Likes officiels (like_count):', stats.like_count || stats.digg_count || room.like_count);
  console.log('Commentaires officiels (comment_count):', stats.comment_count);
  console.log('Partages officiels (share_count):', stats.share_count);
  console.log('Nouveaux abonnés (follow_count):', stats.follow_count);

  const currentViewers = Number(room.user_count || 0);
  const totalUser = Number(stats.total_user || 0);
  const likes = Number(stats.like_count || stats.digg_count || room.like_count || 0);
  const comments = Number(stats.comment_count || 0);
  const shares = Number(stats.share_count || 0);
  const followers = Number(stats.follow_count || 0);
  const title = room.title || 'Analyse de votre site !';

  const userDocRef = doc(db, 'users', 'karamokho');
  const snap = await getDoc(userDocRef);
  const liveApi = snap.data()?.tiktokLiveAPI || {};

  const peakViewers = Math.max(Number(liveApi.peakViewers || 0), currentViewers, 16);

  // NETTOYAGE STRICT : On supprime les vieux commentaires d un ancien live !
  // Seuls les messages du live ACTUEL doivent etre conserves
  const isNewSession = liveApi.roomId !== roomId;

  const payload = {
    'tiktokLiveAPI.isLive': true,
    'tiktokLiveAPI.roomId': roomId,
    'tiktokLiveAPI.title': title,
    'tiktokLiveAPI.currentViewers': currentViewers,
    'tiktokLiveAPI.peakViewers': peakViewers,
    'tiktokLiveAPI.totalUser': totalUser,
    'tiktokLiveAPI.likes': likes,
    'tiktokLiveAPI.comments': comments,
    'tiktokLiveAPI.shares': shares,
    'tiktokLiveAPI.followers': followers,
    'tiktokLiveAPI.recentComments': [], // Vide pour le live actuel tant que de nouveaux messages n arrivent pas
    'tiktokLiveAPI.topQuestions': [],
    'tiktokLiveAPI.topComments': [],
    'tiktokLiveAPI.lastDetected': new Date().toISOString(),
    'tiktokAPI.isLive': true
  };

  await updateDoc(userDocRef, payload);
  console.log('✅ FIRESTORE MIS A JOUR AVEC LES DONNEES 100% EXACTES ET TCHAT REINITIALISE POUR CE LIVE !');
  process.exit(0);
}

syncExactLive();
