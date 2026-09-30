import { TikTokLiveConnection } from 'tiktok-live-connector';
import http from 'http';

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

function getInitialState() {
  return {
    isLive: false,
    likes: 0,
    shares: 0,
    followers: 0,
    initialFollowers: 0,
    finalFollowers: 0,
    comments: 0,
    currentViewers: 0,
    peakViewers: 0,
    started_at: null,
    roomId: '',
    topQuestions: [],      // Questions & demandes récurrentes des spectateurs
    topCommenters: [],      // TOP 5 des spectateurs ayant envoyé le plus de messages
    userMessageCounts: {},  // Map { pseudo: { nickname, count, lastComment, lastSeen } }
    topComments: [],
    recentComments: []
  };
}

let stateData = getInitialState();

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
            topCommenters: stateData.topCommenters.slice(0, 5),
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
        console.log(`[Lumina Daemon Sync] ⚡ ${stateData.currentViewers} viewers | ❤️ ${stateData.likes} likes | 💬 ${stateData.comments} comments | 🔄 ${stateData.shares} shares | 👥 Top 1: ${stateData.topCommenters[0]?.nickname || 'Aucun'}`);
      }
    } catch (err) {
      console.error("[Lumina Daemon] Erreur écriture Firestore:", err.message);
    }
  }, 500);
}

function processIncomingMessage(commentText, nickname, uniqueId) {
  if (!commentText || commentText.trim().length < 2) return;
  const text = commentText.trim();
  const lower = text.toLowerCase();
  const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const author = nickname || uniqueId || 'Spectateur';

  // 1. Suivi & Identification du Top 5 des spectateurs les plus actifs (par nombre de messages)
  if (!stateData.userMessageCounts[author]) {
    stateData.userMessageCounts[author] = {
      nickname: author,
      uniqueId: uniqueId || author,
      count: 0,
      lastComment: text,
      lastSeen: nowTime
    };
  }
  stateData.userMessageCounts[author].count += 1;
  stateData.userMessageCounts[author].lastComment = text;
  stateData.userMessageCounts[author].lastSeen = nowTime;

  // Calcul dynamique du TOP 5 en direct
  stateData.topCommenters = Object.values(stateData.userMessageCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((user, idx) => ({
      rank: idx + 1,
      nickname: user.nickname,
      count: user.count,
      lastComment: user.lastComment,
      badge: idx === 0 ? '👑 MVP' : idx === 1 ? '🥈 VIP' : idx === 2 ? '🥉 Bronze' : '⭐ Actif'
    }));

  // 2. Flux direct des commentaires récents (buffer glissant)
  stateData.recentComments.unshift({
    id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 6),
    nickname: author,
    comment: text,
    time: nowTime
  });
  if (stateData.recentComments.length > 50) {
    stateData.recentComments = stateData.recentComments.slice(0, 50);
  }

  // 3. Détection sémantique des questions et demandes fréquentes
  const questionKeywords = [
    'comment', 'pourquoi', 'combien', 'est ce', 'est-ce', 'c quoi', "c'est quoi",
    'quel', 'quelle', 'quels', 'quelles', 'qui', 'où', 'ou', 'quand',
    'tu penses', 'tu fais', 'tu conseil', 'tu conseille', 'tu recommandes',
    'avis sur', 'peux tu', 'peux-tu', 'tu peux', 'c normal', "c'est normal",
    'tu vis', 'tu gagnes', 'aide', 'montre', 'fais voir', 'demande', 'dis moi',
    'formation', 'prix', 'tuto', 'astuce', 'conseil', 'recommande'
  ];

  const isQuestionOrRequest = lower.includes('?') || questionKeywords.some(k => lower.startsWith(k) || lower.includes(' ' + k));

  if (isQuestionOrRequest) {
    const existing = stateData.topQuestions.find(q => 
      (q.original || '').toLowerCase() === lower || 
      (q.original && q.original.length > 8 && lower.includes(q.original.toLowerCase().slice(0, 12)))
    );
    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.lastAskedBy = author;
      existing.lastTime = nowTime;
    } else {
      stateData.topQuestions.unshift({ 
        original: text, 
        count: 1, 
        lastAskedBy: author,
        time: nowTime 
      });
    }
    stateData.topQuestions.sort((a, b) => (b.count || 1) - (a.count || 1));
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
    stateData.roomId = state.roomId || (state.roomInfo?.data?.id_str || state.roomInfo?.id_str || 'live_stream');
    stateData.isLive = true;
    stateData.started_at = new Date().toISOString();

    // 1. Capture des abonnés initiaux au moment exact du lancement
    if (state.roomInfo?.owner?.follower_count) {
      stateData.initialFollowers = state.roomInfo.owner.follower_count;
    } else if (state.roomInfo?.data?.owner?.follower_count) {
      stateData.initialFollowers = state.roomInfo.data.owner.follower_count;
    }
    console.log(`[Lumina Daemon] ✅ Connecté au Live TikTok ! Room ID: ${state.roomId} (Abonnés initiaux: ${stateData.initialFollowers})`);

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
      const uniqueId = data.user?.uniqueId || data.uniqueId;
      processIncomingMessage(text, nickname, uniqueId);
    });

    connection.on('questionNew', (data) => {
      const qText = data.details?.questionText || data.questionText || data.question || '';
      const nickname = data.user?.nickname || data.user?.uniqueId || data.nickname || 'Spectateur';
      const uniqueId = data.user?.uniqueId || data.uniqueId;
      processIncomingMessage(qText, nickname, uniqueId);
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
      
      // Capture des abonnés à la fin
      try {
        const roomInfo = await connection.getRoomInfo();
        stateData.finalFollowers = roomInfo?.owner?.follower_count || roomInfo?.data?.owner?.follower_count || (stateData.initialFollowers + stateData.followers);
      } catch (e) {
        stateData.finalFollowers = stateData.initialFollowers + stateData.followers;
      }

      await saveArchiveToFirestore();
      scheduleFirestoreSync();
      setTimeout(connectToLive, 10000);
    });

    connection.on('error', (err) => {
      console.error('[Lumina Daemon] Erreur connexion:', err.message);
    });

  } catch (err) {
    console.error(`[Lumina Daemon] Erreur connexion TikTok (stream inactif ou erreur):`, err.message);
    isConnected = false;
    stateData.isLive = false;
    scheduleFirestoreSync();
    setTimeout(connectToLive, 15000);
  }
}

async function saveArchiveToFirestore() {
  try {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const docId = `live_${dateStr}`;

    // Calcul de la durée exacte
    let durationSeconds = 0;
    if (stateData.started_at) {
      durationSeconds = Math.max(0, Math.floor((now.getTime() - new Date(stateData.started_at).getTime()) / 1000));
    }
    const h = Math.floor(durationSeconds / 3600);
    const m = Math.floor((durationSeconds % 3600) / 60);
    const s = durationSeconds % 60;
    const durationStr = `${pad(h)}:${pad(m)}:${pad(s)}`;

    // Calcul de l'acquisition exacte d'abonnés (Final - Initial)
    const acquiredFollowers = (stateData.finalFollowers && stateData.initialFollowers)
      ? Math.max(0, stateData.finalFollowers - stateData.initialFollowers)
      : stateData.followers;

    const archivePayload = {
      fields: {
        id: toFirestoreValue(docId),
        likes: toFirestoreValue(stateData.likes),
        shares: toFirestoreValue(stateData.shares),
        followers: toFirestoreValue(acquiredFollowers),
        newFollowers: toFirestoreValue(acquiredFollowers),
        initialFollowers: toFirestoreValue(stateData.initialFollowers),
        finalFollowers: toFirestoreValue(stateData.finalFollowers),
        comments: toFirestoreValue(stateData.comments),
        peakViewers: toFirestoreValue(stateData.peakViewers),
        startedAt: toFirestoreValue(stateData.started_at || now.toISOString()),
        endedAt: toFirestoreValue(now.toISOString()),
        durationStr: toFirestoreValue(durationStr),
        durationSeconds: toFirestoreValue(durationSeconds),
        topQuestions: toFirestoreValue(stateData.topQuestions.slice(0, 15)),
        topCommenters: toFirestoreValue(stateData.topCommenters.slice(0, 5)),
        roomId: toFirestoreValue(stateData.roomId)
      }
    };
    
    // Création d'une archive horodatée unique (ex: live_20260930_231500)
    const archiveUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tiktok_archives?documentId=${docId}&key=${API_KEY}`;
    
    const res = await fetch(archiveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(archivePayload)
    });
    
    if (res.ok) {
      console.log(`[Lumina Daemon] 📁 Archive du live sauvegardée avec succès: ${docId}`);
      stateData = getInitialState(); // Réinitialisation de l'état
    } else {
      console.error('[Lumina Daemon] Erreur sauvegarde archive:', await res.text());
    }
  } catch (err) {
    console.error("[Lumina Daemon] Exception lors de l'archivage:", err.message);
  }
}

connectToLive();

// Serveur HTTP basique pour satisfaire les exigences des hébergeurs (Render, Koyeb, etc.)
const PORT = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Lumina Live Daemon is running.\n');
}).listen(PORT, () => {
  console.log(`[Lumina Daemon] Serveur de santé écoutant sur le port ${PORT}`);
});
