import { TikTokLiveConnection } from 'tiktok-live-connector';
import http from 'http';

const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const PROJECT_ID = 'lumina-analytics-kd-2026';
const REST_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?key=${API_KEY}`;
const TIKTOK_USERNAME = 'karam.drame';
const PORT = process.env.PORT || 8080;

console.log(`[Lumina Live Daemon] 🚀 Initialisation du service de surveillance TikTok Live pour @${TIKTOK_USERNAME}...`);

// 1. Serveur HTTP de santé pour Render / Koyeb (obligatoire pour le binding de port)
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });

  const statusPayload = {
    status: 'ok',
    service: 'Lumina Live Daemon',
    username: TIKTOK_USERNAME,
    isLive: isConnected,
    currentViewers: stateData.currentViewers,
    likes: stateData.likes,
    shares: stateData.shares,
    comments: stateData.comments,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  };

  res.end(JSON.stringify(statusPayload, null, 2));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Lumina Live Daemon] ✅ Serveur de santé écoutant sur le port ${PORT} (0.0.0.0:${PORT})`);
});

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
    totalUser: 0,
    started_at: null,
    roomId: '',
    topQuestions: [],
    topCommenters: [],
    userMessageCounts: {},
    topComments: [],
    recentComments: []
  };
}

let stateData = getInitialState();

// Initialiser avec les dernières métriques Firestore
async function initExistingData() {
  try {
    const res = await fetch(REST_URL);
    if (!res.ok) return;
    const data = await res.json();
    if (data.fields?.tiktokLiveAPI?.mapValue?.fields) {
      const f = data.fields.tiktokLiveAPI.mapValue.fields;
      if (f.likes?.integerValue) stateData.likes = Math.max(stateData.likes, parseInt(f.likes.integerValue));
      if (f.shares?.integerValue) stateData.shares = Math.max(stateData.shares, parseInt(f.shares.integerValue));
      if (f.followers?.integerValue) stateData.followers = Math.max(stateData.followers, parseInt(f.followers.integerValue));
      if (f.comments?.integerValue) stateData.comments = Math.max(stateData.comments, parseInt(f.comments.integerValue));
      if (f.peakViewers?.integerValue) stateData.peakViewers = Math.max(stateData.peakViewers, parseInt(f.peakViewers.integerValue));
      if (f.totalUser?.integerValue) stateData.totalUser = Math.max(stateData.totalUser, parseInt(f.totalUser.integerValue));
      if (f.started_at?.stringValue) stateData.started_at = f.started_at.stringValue;
      if (f.roomId?.stringValue) stateData.roomId = f.roomId.stringValue;
    }
  } catch (e) {
    console.warn('[Lumina Daemon] Initialisation Firestore silencieuse:', e.message);
  }
}

// Envoi vers Firestore avec debounce (actif uniquement en cours de Live pour éviter tout écrasement)
function scheduleFirestoreSync() {
  if (!isConnected) return; // Ne jamais écraser Firestore si le live n'est pas actif
  if (updateTimeout) return;

  updateTimeout = setTimeout(async () => {
    updateTimeout = null;
    try {
      const updateMaskFields = [
        'updateMask.fieldPaths=tiktokLiveAPI.isLive',
        'updateMask.fieldPaths=tiktokLiveAPI.currentViewers',
        'updateMask.fieldPaths=tiktokLiveAPI.peakViewers',
        'updateMask.fieldPaths=tiktokLiveAPI.likes',
        'updateMask.fieldPaths=tiktokLiveAPI.totalLikes',
        'updateMask.fieldPaths=tiktokLiveAPI.shares',
        'updateMask.fieldPaths=tiktokLiveAPI.totalShares',
        'updateMask.fieldPaths=tiktokLiveAPI.comments',
        'updateMask.fieldPaths=tiktokLiveAPI.newFollowers',
        'updateMask.fieldPaths=tiktokLiveAPI.followers',
        'updateMask.fieldPaths=tiktokLiveAPI.roomId',
        'updateMask.fieldPaths=tiktokLiveAPI.started_at',
        'updateMask.fieldPaths=tiktokLiveAPI.topQuestions',
        'updateMask.fieldPaths=tiktokLiveAPI.topCommenters',
        'updateMask.fieldPaths=tiktokLiveAPI.recentComments',
        'updateMask.fieldPaths=tiktokLiveAPI.lastDetected'
      ].join('&');

      const maskUrl = `${REST_URL}&${updateMaskFields}`;

      const liveApiPayload = {
        isLive: toFirestoreValue(true),
        currentViewers: toFirestoreValue(stateData.currentViewers),
        peakViewers: toFirestoreValue(stateData.peakViewers),
        likes: toFirestoreValue(stateData.likes),
        totalLikes: toFirestoreValue(stateData.likes),
        shares: toFirestoreValue(stateData.shares),
        totalShares: toFirestoreValue(stateData.shares),
        comments: toFirestoreValue(stateData.comments),
        newFollowers: toFirestoreValue(stateData.followers),
        followers: toFirestoreValue(stateData.followers),
        roomId: toFirestoreValue(stateData.roomId),
        started_at: toFirestoreValue(stateData.started_at || new Date().toISOString()),
        topQuestions: toFirestoreValue(stateData.topQuestions.slice(0, 15)),
        topCommenters: toFirestoreValue(stateData.topCommenters.slice(0, 5)),
        recentComments: toFirestoreValue(stateData.recentComments.slice(0, 50)),
        lastDetected: toFirestoreValue(new Date().toISOString())
      };

      const payload = {
        fields: {
          tiktokLiveAPI: {
            mapValue: {
              fields: liveApiPayload
            }
          }
        }
      };

      await fetch(maskUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

    } catch (err) {
      console.warn('[Lumina Daemon] Erreur écriture Firestore:', err.message);
    }
  }, 1000);
}

function processIncomingMessage(commentText, nickname, uniqueId) {
  if (!commentText || commentText.trim().length < 2) return;
  const text = commentText.trim();
  const lower = text.toLowerCase();
  const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const author = nickname || uniqueId || 'Spectateur';

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

  stateData.recentComments.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    nickname: author,
    comment: text,
    time: nowTime
  });
  if (stateData.recentComments.length > 50) {
    stateData.recentComments = stateData.recentComments.slice(0, 50);
  }

  const questionKeywords = [
    'comment', 'pourquoi', 'combien', 'est ce', 'est-ce', 'c quoi', "c'est quoi",
    'quel', 'quelle', 'quels', 'quelles', 'qui', 'où', 'ou', 'quand',
    'tu penses', 'tu fais', 'tu conseil', 'tu conseille', 'tu recommandes',
    'avis sur', 'peux tu', 'peux-tu', 'tu peux', 'c normal', "c'est normal",
    'formation', 'prix', 'tuto', 'astuce', 'conseil'
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

  try {
    console.log(`[Lumina Daemon] Vérification du flux TikTok Live pour @${TIKTOK_USERNAME}...`);
    connection = new TikTokLiveConnection(TIKTOK_USERNAME, { processInitialData: true });

    const state = await connection.connect();
    isConnected = true;
    stateData.roomId = state.roomId || (state.roomInfo?.data?.id_str || state.roomInfo?.id_str || 'live_stream');
    stateData.isLive = true;
    if (!stateData.started_at) {
      stateData.started_at = new Date().toISOString();
    }

    console.log(`[Lumina Daemon] 🔴 LIVE EN DIRECT DÉTECTÉ ! Room ID: ${stateData.roomId}`);

    if (state.roomInfo?.data?.user_count) {
      stateData.currentViewers = state.roomInfo.data.user_count;
      stateData.peakViewers = Math.max(stateData.peakViewers, stateData.currentViewers);
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
      console.log('[Lumina Daemon] 🛑 Le live TikTok est terminé.');
      isConnected = false;
      stateData.isLive = false;
      await saveArchiveToFirestore();
      setTimeout(connectToLive, 20000);
    });

    connection.on('error', (err) => {
      console.warn('[Lumina Daemon] Événement erreur TikTok:', err.message);
    });

  } catch (err) {
    // Mode veille normal quand Karam n'est pas en direct
    isConnected = false;
    stateData.isLive = false;
    console.log(`[Lumina Daemon] ⚪ Aucun direct en cours pour @${TIKTOK_USERNAME} (${err.message}). Prochaine vérification dans 30s.`);
    setTimeout(connectToLive, 30000);
  }
}

async function saveArchiveToFirestore() {
  try {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const docId = `live_${dateStr}_${stateData.roomId || 'session'}`;

    let durationSeconds = 0;
    if (stateData.started_at) {
      durationSeconds = Math.max(0, Math.floor((now.getTime() - new Date(stateData.started_at).getTime()) / 1000));
    }
    const h = Math.floor(durationSeconds / 3600);
    const m = Math.floor((durationSeconds % 3600) / 60);
    const s = durationSeconds % 60;
    const durationStr = `${pad(h)}:${pad(m)}:${pad(s)}`;

    const archivePayload = {
      fields: {
        id: toFirestoreValue(docId),
        likes: toFirestoreValue(stateData.likes),
        shares: toFirestoreValue(stateData.shares),
        followers: toFirestoreValue(stateData.followers),
        newFollowers: toFirestoreValue(stateData.followers),
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

    const archiveUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tiktok_archives?documentId=${docId}&key=${API_KEY}`;

    await fetch(archiveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(archivePayload)
    });
    console.log(`[Lumina Daemon] 📁 Archive TikTok Live sauvegardée : ${docId}`);
  } catch (err) {
    console.warn('[Lumina Daemon] Exception archivage:', err.message);
  }
}

connectToLive();
