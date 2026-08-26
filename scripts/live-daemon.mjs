import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { TikTokLiveConnection } from 'tiktok-live-connector';

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
const TIKTOK_USERNAME = 'karam.drame';

console.log(`[Lumina Live Daemon] Démarrage du daemon de synchronisation temps réel pour @${TIKTOK_USERNAME}...`);

let connection = null;
let isConnected = false;
let updateTimeout = null;

let stateData = {
  isLive: true,
  likes: 12500,
  shares: 148,
  followers: 86,
  comments: 420,
  currentViewers: 16,
  peakViewers: 89,
  started_at: null,
  roomId: '',
  topQuestions: [],
  topComments: [],
  recentComments: []
};

// Initialiser avec les données existantes de Firestore
async function initExistingData() {
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const live = snap.data().tiktokLiveAPI || {};
      stateData.likes = Math.max(stateData.likes, live.likes || 0);
      stateData.shares = Math.max(stateData.shares, live.shares || 0);
      stateData.followers = Math.max(stateData.followers, live.followers || 0);
      stateData.comments = Math.max(stateData.comments, live.comments || 0);
      stateData.peakViewers = Math.max(stateData.peakViewers, live.peakViewers || 0);
      stateData.started_at = live.started_at || new Date().toISOString();
      stateData.topQuestions = live.topQuestions || [];
      stateData.topComments = live.topComments || [];
      stateData.recentComments = live.recentComments || [];
    }
  } catch (e) {
    console.error("[Lumina Daemon] Erreur lecture initiale:", e.message);
  }
}

// Envoi différé (debounce) vers Firestore toutes les 1.5s pour respecter les quotas
function scheduleFirestoreSync() {
  if (updateTimeout) return;
  updateTimeout = setTimeout(async () => {
    updateTimeout = null;
    try {
      await setDoc(userRef, {
        tiktokLiveAPI: {
          isLive: isConnected,
          likes: stateData.likes,
          shares: stateData.shares,
          followers: stateData.followers,
          comments: stateData.comments,
          currentViewers: stateData.currentViewers,
          peakViewers: stateData.peakViewers,
          roomId: stateData.roomId,
          started_at: stateData.started_at,
          topQuestions: stateData.topQuestions.slice(0, 15),
          topComments: stateData.topComments.slice(0, 15),
          recentComments: stateData.recentComments.slice(0, 50),
          lastSyncTime: new Date().toISOString()
        },
        tiktok: {
          totalLikes: stateData.likes
        }
      }, { merge: true });
      console.log(`[Lumina Daemon Sync] ⚡ ${stateData.currentViewers} viewers | ❤️ ${stateData.likes} likes | 💬 ${stateData.comments} comments | 🔄 ${stateData.shares} shares`);
    } catch (err) {
      console.error("[Lumina Daemon] Erreur écriture Firestore:", err.message);
    }
  }, 1500);
}

function processIncomingMessage(commentText, nickname) {
  if (!commentText || commentText.trim().length < 2) return;
  const text = commentText.trim();
  const lower = text.toLowerCase();
  const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 1. Ajouter au flux direct des commentaires récents
  stateData.recentComments.unshift({
    id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 6),
    nickname: nickname || 'Spectateur',
    comment: text,
    time: nowTime
  });
  if (stateData.recentComments.length > 50) {
    stateData.recentComments = stateData.recentComments.slice(0, 50);
  }

  // 2. Détection de questions ou de commentaires répétés
  const isQuestion = lower.includes('?') || 
    ['comment', 'pourquoi', 'combien', 'est ce', 'est-ce', 'c quoi', "c'est quoi", 'quel', 'quelle', 'quels', 'quelles', 'qui', 'où', 'ou', 'quand', 'tu penses', 'tu fais', 'tu conseil', 'tu conseille', 'tu recommandes', 'avis sur', 'peux tu', 'peux-tu', 'tu peux', 'c normal', "c'est normal", 'tu vis', 'tu gagnes'].some(k => lower.startsWith(k) || lower.includes(' ' + k));

  if (isQuestion) {
    const existing = stateData.topQuestions.find(q => (q.original || '').toLowerCase() === lower || (q.original && q.original.length > 8 && lower.includes(q.original.toLowerCase().slice(0, 12))));
    if (existing) {
      existing.count = (existing.count || 1) + 1;
    } else {
      stateData.topQuestions.unshift({ original: text, count: 1 });
    }
    stateData.topQuestions.sort((a, b) => (b.count || 1) - (a.count || 1));
  } else {
    const existingC = stateData.topComments.find(c => (c.text || c.original || '').toLowerCase() === lower || (c.text && c.text.length > 6 && lower === c.text.toLowerCase()));
    if (existingC) {
      existingC.count = (existingC.count || 1) + 1;
    } else {
      stateData.topComments.unshift({ text: text, count: 1 });
    }
    stateData.topComments.sort((a, b) => (b.count || 1) - (a.count || 1));
  }

  scheduleFirestoreSync();
}

async function connectToLive() {
  await initExistingData();
  
  console.log(`[Lumina Daemon] Connexion au Webcast TikTok de @${TIKTOK_USERNAME}...`);
  connection = new TikTokLiveConnection(TIKTOK_USERNAME, { processInitialData: true });

  try {
    const state = await connection.connect();
    isConnected = true;
    stateData.roomId = state.roomId || '';
    stateData.isLive = true;
    console.log(`[Lumina Daemon] ✅ Connecté avec succès au Live ! Room ID: ${state.roomId}`);

    if (state.roomInfo?.data?.user_count) {
      stateData.currentViewers = state.roomInfo.data.user_count;
    }
    if (state.roomInfo?.data?.stats?.like_count) {
      stateData.likes = Math.max(stateData.likes, state.roomInfo.data.stats.like_count);
    }
    scheduleFirestoreSync();

    connection.on('roomUser', (data) => {
      const v = data.viewerCount || parseInt(data.total) || parseInt(data.userCount);
      if (typeof v === 'number' && !isNaN(v) && v >= 0) {
        stateData.currentViewers = v;
        if (v > stateData.peakViewers) stateData.peakViewers = v;
        scheduleFirestoreSync();
      }
    });

    connection.on('like', (data) => {
      const rawTotal = typeof data.total === 'number' ? data.total : parseInt(data.total);
      const rawCount = typeof data.count === 'number' ? data.count : parseInt(data.count);
      const totalLikesVal = (!isNaN(rawTotal) && rawTotal > 0) ? rawTotal : (typeof data.totalLikeCount === 'number' ? data.totalLikeCount : parseInt(data.totalLikeCount));
      const countVal = (!isNaN(rawCount) && rawCount > 0) ? rawCount : (typeof data.likeCount === 'number' ? data.likeCount : parseInt(data.likeCount)) || 1;

      if (totalLikesVal && !isNaN(totalLikesVal) && totalLikesVal > 0) {
        stateData.likes = Math.max(stateData.likes, totalLikesVal);
      } else {
        stateData.likes += countVal;
      }
      scheduleFirestoreSync();
    });

    connection.on('chat', (data) => {
      stateData.comments++;
      const text = data.content || data.comment || '';
      const nickname = data.user?.nickname || data.user?.uniqueId || data.nickname;
      processIncomingMessage(text, nickname);
    });

    connection.on('questionNew', (data) => {
      const qText = data.details?.questionText || data.questionText || data.question || '';
      const nickname = data.user?.nickname || data.user?.uniqueId || data.nickname || 'Spectateur';
      processIncomingMessage(qText, nickname);
    });

    connection.on('social', (data) => {
      const text = String(data.displayType || data.label || data.action || '').toLowerCase();
      if (text.includes('share') || text.includes('partagé')) stateData.shares++;
      if (text.includes('follow') || text.includes('abonné')) stateData.followers++;
      scheduleFirestoreSync();
    });

    connection.on('share', () => {
      stateData.shares++;
      scheduleFirestoreSync();
    });

    connection.on('follow', () => {
      stateData.followers++;
      scheduleFirestoreSync();
    });

    connection.on('streamEnd', async () => {
      console.log('[Lumina Daemon] 🛑 Le live s\'est terminé.');
      isConnected = false;
      stateData.isLive = false;
      scheduleFirestoreSync();
      setTimeout(connectToLive, 10000);
    });

    connection.on('error', (err) => {
      console.error('[Lumina Daemon] Erreur connexion:', err.message);
    });

  } catch (err) {
    console.error(`[Lumina Daemon] Impossible de se connecter (hors ligne ou erreur):`, err.message);
    isConnected = false;
    setTimeout(connectToLive, 15000);
  }
}

connectToLive();
