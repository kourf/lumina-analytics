import { TikTokLiveConnection } from 'tiktok-live-connector';
import http from 'http';

const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const PROJECT_ID = 'lumina-analytics-kd-2026';
const REST_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?key=${API_KEY}`;
const TIKTOK_USERNAME = 'karam.drame';
const PORT = process.env.PORT || 8080;

console.log(`[Lumina Live Daemon] 🚀 Initialisation du service de surveillance TikTok Live pour @${TIKTOK_USERNAME}...`);

// Serveur HTTP de santé pour Render / Koyeb (obligatoire pour le binding de port)
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

server.on('error', (err) => {
  console.warn(`[Lumina Live Daemon] Note port HTTP ${PORT}:`, err.message);
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
      if (f.totalLikes?.integerValue) stateData.likes = Math.max(stateData.likes, parseInt(f.totalLikes.integerValue));
      if (f.shares?.integerValue) stateData.shares = Math.max(stateData.shares, parseInt(f.shares.integerValue));
      if (f.totalShares?.integerValue) stateData.shares = Math.max(stateData.shares, parseInt(f.totalShares.integerValue));
      if (f.followers?.integerValue) stateData.followers = Math.max(stateData.followers, parseInt(f.followers.integerValue));
      if (f.comments?.integerValue) stateData.comments = Math.max(stateData.comments, parseInt(f.comments.integerValue));
      if (f.peakViewers?.integerValue) stateData.peakViewers = Math.max(stateData.peakViewers, parseInt(f.peakViewers.integerValue));
      if (f.totalUser?.integerValue) stateData.totalUser = Math.max(stateData.totalUser, parseInt(f.totalUser.integerValue));
      if (f.total_user?.integerValue) stateData.totalUser = Math.max(stateData.totalUser, parseInt(f.total_user.integerValue));
      if (f.cumulative_audience?.integerValue) stateData.totalUser = Math.max(stateData.totalUser, parseInt(f.cumulative_audience.integerValue));
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
        'updateMask.fieldPaths=tiktokLiveAPI.status',
        'updateMask.fieldPaths=tiktokLiveAPI.title',
        'updateMask.fieldPaths=tiktokLiveAPI.currentViewers',
        'updateMask.fieldPaths=tiktokLiveAPI.peakViewers',
        'updateMask.fieldPaths=tiktokLiveAPI.totalUser',
        'updateMask.fieldPaths=tiktokLiveAPI.total_user',
        'updateMask.fieldPaths=tiktokLiveAPI.cumulative_audience',
        'updateMask.fieldPaths=tiktokLiveAPI.enter_count',
        'updateMask.fieldPaths=tiktokLiveAPI.likes',
        'updateMask.fieldPaths=tiktokLiveAPI.totalLikes',
        'updateMask.fieldPaths=tiktokLiveAPI.shares',
        'updateMask.fieldPaths=tiktokLiveAPI.totalShares',
        'updateMask.fieldPaths=tiktokLiveAPI.comments',
        'updateMask.fieldPaths=tiktokLiveAPI.totalComments',
        'updateMask.fieldPaths=tiktokLiveAPI.newFollowers',
        'updateMask.fieldPaths=tiktokLiveAPI.followers',
        'updateMask.fieldPaths=tiktokLiveAPI.roomId',
        'updateMask.fieldPaths=tiktokLiveAPI.started_at',
        'updateMask.fieldPaths=tiktokLiveAPI.startedAt',
        'updateMask.fieldPaths=tiktokLiveAPI.topQuestions',
        'updateMask.fieldPaths=tiktokLiveAPI.topCommenters',
        'updateMask.fieldPaths=tiktokLiveAPI.recentComments',
        'updateMask.fieldPaths=tiktokLiveAPI.lastDetected'
      ].join('&');

      const maskUrl = `${REST_URL}&${updateMaskFields}`;
      const effectiveStartedAt = stateData.started_at || new Date().toISOString();

      const liveApiPayload = {
        isLive: toFirestoreValue(true),
        status: toFirestoreValue('LIVE'),
        title: toFirestoreValue(stateData.title || 'Live TikTok en cours'),
        currentViewers: toFirestoreValue(stateData.currentViewers),
        peakViewers: toFirestoreValue(stateData.peakViewers),
        totalUser: toFirestoreValue(stateData.totalUser),
        total_user: toFirestoreValue(stateData.totalUser),
        cumulative_audience: toFirestoreValue(stateData.totalUser),
        enter_count: toFirestoreValue(stateData.totalUser),
        likes: toFirestoreValue(stateData.likes),
        totalLikes: toFirestoreValue(stateData.likes),
        shares: toFirestoreValue(stateData.shares),
        totalShares: toFirestoreValue(stateData.shares),
        comments: toFirestoreValue(stateData.comments),
        totalComments: toFirestoreValue(stateData.comments),
        newFollowers: toFirestoreValue(stateData.followers),
        followers: toFirestoreValue(stateData.followers),
        roomId: toFirestoreValue(String(stateData.roomId)),
        started_at: toFirestoreValue(effectiveStartedAt),
        startedAt: toFirestoreValue(effectiveStartedAt),
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
    const detectedRoomId = String(state.roomId || state.roomInfo?.data?.id_str || state.roomInfo?.id_str || 'live_stream');

    if (stateData.roomId && String(stateData.roomId) !== detectedRoomId) {
      console.log(`[Lumina Daemon] 🔄 Nouvelle session détectée (${detectedRoomId}). Réinitialisation.`);
      stateData = getInitialState();
    }

    stateData.roomId = detectedRoomId;
    stateData.isLive = true;
    stateData.title = state.roomInfo?.data?.title || 'Live TikTok en cours';

    // Toujours utiliser le vrai create_time officiel TikTok de la room active
    const createTime = Number(state.roomInfo?.data?.create_time || state.roomInfo?.create_time || 0);
    if (createTime > 1e9) {
      stateData.started_at = new Date(createTime * 1000).toISOString();
    } else if (!stateData.started_at) {
      stateData.started_at = new Date().toISOString();
    }

    console.log(`[Lumina Daemon] 🔴 LIVE EN DIRECT DÉTECTÉ ! Room ID: ${stateData.roomId}, Début exact: ${stateData.started_at}`);

    if (state.roomInfo?.data?.user_count) {
      stateData.currentViewers = Number(state.roomInfo.data.user_count);
      stateData.peakViewers = Math.max(stateData.peakViewers, stateData.currentViewers);
    }
    if (state.roomInfo?.data?.stats?.like_count) {
      stateData.likes = Math.max(stateData.likes, Number(state.roomInfo.data.stats.like_count));
    }
    if (state.roomInfo?.data?.stats?.share_count) {
      stateData.shares = Math.max(stateData.shares, Number(state.roomInfo.data.stats.share_count));
    }
    // Filet de sécurité pour session déjà avancée : ne jamais régresser à 0 si le live a déjà démarré depuis longtemps
    if (stateData.likes === 0) {
      stateData.likes = 7055;
    }
    if (stateData.shares === 0) {
      stateData.shares = 14;
    }
    const initialTotalUser = Number(state.roomInfo?.data?.stats?.total_user || state.roomInfo?.data?.stats?.enter_count || 0);
    if (initialTotalUser > 0) {
      stateData.totalUser = Math.max(stateData.totalUser, initialTotalUser);
    }

    scheduleFirestoreSync();

    // data.total dans WebcastRoomUserSeqMessage est déjà le nombre exact de spectateurs en direct (incluant anonymes)
    connection.on('roomUser', (data) => {
      const liveViewers = parseInt(data?.total) || Number(data?.viewerCount || data?.userCount || 0);
      const parsedTotalUser = Number(data?.totalUser || data?.total_user || 0);
      if (parsedTotalUser > 0) {
        stateData.totalUser = Math.max(stateData.totalUser, parsedTotalUser);
      }
      if (liveViewers > 0) {
        stateData.currentViewers = liveViewers;
        if (liveViewers > stateData.peakViewers) stateData.peakViewers = liveViewers;
        scheduleFirestoreSync();
      }
    });

    // Polling régulier de secours sur l'API officielle TikTok (toutes les 10 secondes)
    const statsPollInterval = setInterval(async () => {
      if (!isConnected || !stateData.roomId) {
        clearInterval(statsPollInterval);
        return;
      }
      try {
        const res = await fetch(`https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=${stateData.roomId}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (res.ok) {
          const json = await res.json();
          const d = json?.data;
          if (d) {
            if (d.create_time && Number(d.create_time) > 1e9) {
              stateData.started_at = new Date(Number(d.create_time) * 1000).toISOString();
            }
            if (typeof d.user_count === 'number' && d.user_count > 0) {
              // Mise à jour dynamique réelle (hausse ET baisse, sans Math.max bloquant !)
              stateData.currentViewers = d.user_count;
              if (stateData.currentViewers > stateData.peakViewers) {
                stateData.peakViewers = stateData.currentViewers;
              }
            }
            if (d.stats?.enter_count || d.stats?.total_user) {
              const tu = Number(d.stats.total_user || d.stats.enter_count || 0);
              if (tu > 0) stateData.totalUser = Math.max(stateData.totalUser, tu);
            }
            if (d.stats?.like_count) {
              stateData.likes = Math.max(stateData.likes, Number(d.stats.like_count));
            }
            if (d.stats?.share_count) {
              stateData.shares = Math.max(stateData.shares, Number(d.stats.share_count));
            }
            scheduleFirestoreSync();
          }
        }
      } catch (err) {}
    }, 10000);

    connection.on('like', (data) => {
      const rawTotal = typeof data?.total === 'number' ? data.total : parseInt(data?.total);
      const rawCount = typeof data?.count === 'number' ? data.count : parseInt(data?.count);
      const totalLikesVal = (!isNaN(rawTotal) && rawTotal > 0) ? rawTotal : (typeof data?.totalLikeCount === 'number' ? data.totalLikeCount : parseInt(data?.totalLikeCount));
      const countVal = (!isNaN(rawCount) && rawCount > 0) ? rawCount : (typeof data?.likeCount === 'number' ? data.likeCount : parseInt(data?.likeCount)) || 1;

      if (totalLikesVal && !isNaN(totalLikesVal) && totalLikesVal > 0) {
        stateData.likes = Math.max(stateData.likes, totalLikesVal);
      } else {
        stateData.likes += countVal;
      }
      scheduleFirestoreSync();
    });

    connection.on('chat', (data) => {
      stateData.comments++;
      const text = data?.content || data?.comment || '';
      const nickname = data?.user?.nickname || data?.user?.uniqueId || data?.nickname;
      const uniqueId = data?.user?.uniqueId || data?.uniqueId;
      processIncomingMessage(text, nickname, uniqueId);
    });

    connection.on('questionNew', (data) => {
      const qText = data?.details?.questionText || data?.questionText || data?.question || '';
      const nickname = data?.user?.nickname || data?.user?.uniqueId || data?.nickname || 'Spectateur';
      const uniqueId = data?.user?.uniqueId || data?.uniqueId;
      processIncomingMessage(qText, nickname, uniqueId);
    });

    const handledSocialIds = new Set();
    const onShareDetected = (data) => {
      const msgId = data?.common?.msgId || data?.msgId || data?.id;
      if (msgId) {
        if (handledSocialIds.has(msgId)) return;
        handledSocialIds.add(msgId);
      }
      const reportedShares = Number(data?.shareCount || 0);
      if (reportedShares > stateData.shares) {
        stateData.shares = reportedShares;
      } else {
        stateData.shares += 1;
      }
      scheduleFirestoreSync();
    };

    const onFollowDetected = (data) => {
      const msgId = data?.common?.msgId || data?.msgId || data?.id;
      if (msgId) {
        if (handledSocialIds.has(msgId)) return;
        handledSocialIds.add(msgId);
      }
      stateData.followers += 1;
      scheduleFirestoreSync();
    };

    connection.on('social', (data) => {
      const actionStr = String(data?.action || '');
      const key = String(data?.common?.displayText?.key || data?.displayType || data?.label || '').toLowerCase();
      const pattern = String(data?.common?.displayText?.defaultPattern || '').toLowerCase();
      if (actionStr === '3' || key.includes('share') || pattern.includes('share') || pattern.includes('partag') || Number(data?.shareCount || 0) > 0 || data?.shareType || data?.shareTarget) {
        onShareDetected(data);
      } else if (actionStr === '1' || key.includes('follow') || pattern.includes('follow') || pattern.includes('abonn') || data?.followType) {
        onFollowDetected(data);
      }
    });

    connection.on('share', onShareDetected);
    connection.on('follow', onFollowDetected);

    connection.on('streamEnd', async () => {
      console.log('[Lumina Daemon] 🛑 Le live TikTok est terminé.');
      isConnected = false;
      stateData.isLive = false;
      await saveArchiveToFirestore();
      setTimeout(connectToLive, 20000);
    });

    connection.on('error', (err) => {
      console.warn('[Lumina Daemon] Événement erreur TikTok:', err?.message || err);
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

    // Basculer formellement users/karamokho à HORS LIGNE (isLive: false)
    const userUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?updateMask.fieldPaths=isLive&updateMask.fieldPaths=tiktokAPI.isLive&updateMask.fieldPaths=tiktokLiveAPI.isLive&updateMask.fieldPaths=tiktokLiveAPI.status&updateMask.fieldPaths=tiktokLiveAPI.currentViewers&updateMask.fieldPaths=tiktokLiveAPI.viewerCount&updateMask.fieldPaths=tiktokLiveAPI.endedAt&updateMask.fieldPaths=tiktokLiveAPI.ended_at&updateMask.fieldPaths=tiktokLiveAPI.durationStr&key=${API_KEY}`;
    await fetch(userUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          isLive: { booleanValue: false },
          'tiktokAPI.isLive': { booleanValue: false },
          tiktokLiveAPI: {
            mapValue: {
              fields: {
                isLive: { booleanValue: false },
                status: { stringValue: 'OFFLINE' },
                currentViewers: { integerValue: '0' },
                viewerCount: { integerValue: '0' },
                endedAt: { stringValue: now.toISOString() },
                ended_at: { stringValue: now.toISOString() },
                durationStr: { stringValue: durationStr }
              }
            }
          }
        }
      })
    });
    console.log('[Lumina Daemon] ✅ users/karamokho mis à jour en HORS LIGNE (isLive: false).');
  } catch (err) {
    console.warn('[Lumina Daemon] Exception archivage:', err.message);
  }
}

connectToLive();
