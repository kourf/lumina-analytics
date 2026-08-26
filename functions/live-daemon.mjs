import { TikTokLiveConnection } from 'tiktok-live-connector';

const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const PROJECT_ID = 'lumina-analytics-kd-2026';
const REST_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?updateMask.fieldPaths=tiktokLiveAPI&key=${API_KEY}`;
const TIKTOK_USERNAME = 'karam.drame';

console.log(`[Lumina Live Daemon] 🚀 Démarrage du moteur de synchronisation temps réel pour @${TIKTOK_USERNAME}...`);

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(item => toFirestoreValue(item))
      }
    };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

let connection = null;
let isConnected = false;
let updateTimeout = null;

let stateData = {
  isLive: true,
  likes: 12700,
  shares: 152,
  followers: 87,
  comments: 457,
  currentViewers: 13,
  peakViewers: 89,
  started_at: new Date().toISOString(),
  roomId: '',
  topQuestions: [],
  topComments: [],
  recentComments: []
};

// Initialiser avec les données existantes de Firestore
async function initExistingData() {
  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?key=${API_KEY}`);
    const data = await res.json();
    if (data.fields?.tiktokLiveAPI?.mapValue?.fields) {
      const f = data.fields.tiktokLiveAPI.mapValue.fields;
      if (f.likes?.integerValue) stateData.likes = Math.max(stateData.likes, parseInt(f.likes.integerValue));
      if (f.shares?.integerValue) stateData.shares = Math.max(stateData.shares, parseInt(f.shares.integerValue));
      if (f.followers?.integerValue) stateData.followers = Math.max(stateData.followers, parseInt(f.followers.integerValue));
      if (f.comments?.integerValue) stateData.comments = Math.max(stateData.comments, parseInt(f.comments.integerValue));
      if (f.peakViewers?.integerValue) stateData.peakViewers = Math.max(stateData.peakViewers, parseInt(f.peakViewers.integerValue));
      if (f.started_at?.stringValue) stateData.started_at = f.started_at.stringValue;
    }
  } catch (e) {
    console.error("[Lumina Daemon] Erreur lecture initiale:", e.message);
  }
}

// Envoi vers Firestore avec debounce (max 1 envoi par 500ms)
function scheduleFirestoreSync() {
  if (updateTimeout) return;
  updateTimeout = setTimeout(async () => {
    updateTimeout = null;
    try {
      const payload = {
        fields: {
          tiktokLiveAPI: toFirestoreValue({
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
          })
        }
      };

      const res = await fetch(REST_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        console.log(`[Lumina Daemon Sync] ⚡ ${stateData.currentViewers} viewers | ❤️ ${stateData.likes} likes | 💬 ${stateData.comments} comments | 🔄 ${stateData.shares} shares`);
      }
    } catch (err) {
      console.error("[Lumina Daemon] Erreur écriture Firestore:", err.message);
    }
  }, 500);
}

function processIncomingMessage(commentText, nickname) {
  if (!commentText || commentText.trim().length < 2) return;
  const text = commentText.trim();
  const lower = text.toLowerCase();
  const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 1. Flux direct
  stateData.recentComments.unshift({
    id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 6),
    nickname: nickname || 'Spectateur',
    comment: text,
    time: nowTime
  });
  if (stateData.recentComments.length > 50) {
    stateData.recentComments = stateData.recentComments.slice(0, 50);
  }

  // 2. Détection questions & commentaires répétés
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
    console.log(`[Lumina Daemon] ✅ Connecté avec succès au Live TikTok ! Room ID: ${state.roomId}`);

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
    console.error(`[Lumina Daemon] Erreur connexion TikTok:`, err.message);
    isConnected = false;
    setTimeout(connectToLive, 15000);
  }
}

connectToLive();
