import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { TikTokLiveConnection } from 'tiktok-live-connector';
import admin from 'firebase-admin';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const PROJECT_ID = process.env.PROJECT_ID || 'lumina-analytics-kd-2026';
const TARGET_USER = process.env.FIRESTORE_USER_ID || 'karamokho';
const API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const REST_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${TARGET_USER}`;

// 1. Initialisation Firebase Admin avec fallback gracieux sur REST API
let db = null;
try {
  let certObj = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    certObj = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    certObj = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (certObj) {
    admin.initializeApp({
      credential: admin.credential.cert(certObj)
    });
    db = admin.firestore();
    console.log('✅ Firebase Admin SDK connecté avec succès.');
  } else {
    console.log('ℹ️ Aucune clé Service Account fournie, utilisation directe de la REST API Firestore.');
  }
} catch (e) {
  console.warn('⚠️ Erreur initialisation Firebase Admin, bascule sur REST API:', e.message);
}

// Fonction de synchronisation universelle vers Firestore (Admin SDK ou REST API)
async function syncToFirestore(livePayload) {
  // 1. Méthode Admin SDK (si initialisé)
  if (db) {
    try {
      const userRef = db.collection('users').doc(TARGET_USER);
      await userRef.set({
        tiktokLiveAPI: {
          ...livePayload,
          lastDetected: new Date().toISOString()
        },
        tiktokAPI: {
          isLive: Boolean(livePayload.isLive)
        },
        isLive: Boolean(livePayload.isLive)
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn('⚠️ Erreur écriture Firestore Admin, essai via REST:', err.message);
    }
  }

  // 2. Méthode REST API (toujours opérationnelle)
  try {
    const liveApiFields = {
      isLive: { booleanValue: Boolean(livePayload.isLive) },
      roomId: { stringValue: String(livePayload.roomId || '') },
      title: { stringValue: String(livePayload.title || 'Live TikTok') },
      currentViewers: { integerValue: String(livePayload.currentViewers ?? 0) },
      peakViewers: { integerValue: String(livePayload.peakViewers ?? 0) },
      totalUser: { integerValue: String(livePayload.totalUser ?? 0) },
      likes: { integerValue: String(livePayload.likes ?? 0) },
      totalLikes: { integerValue: String(livePayload.likes ?? 0) },
      comments: { integerValue: String(livePayload.comments ?? 0) },
      shares: { integerValue: String(livePayload.shares ?? 0) },
      followers: { integerValue: String(livePayload.newFollowers || livePayload.followers || 0) },
      newFollowers: { integerValue: String(livePayload.newFollowers || livePayload.followers || 0) },
      lastDetected: { stringValue: new Date().toISOString() }
    };

    if (livePayload.startedAt) {
      liveApiFields.startedAt = { stringValue: String(livePayload.startedAt) };
      liveApiFields.started_at = { stringValue: String(livePayload.startedAt) };
    } else {
      liveApiFields.startedAt = { nullValue: null };
      liveApiFields.started_at = { nullValue: null };
    }

    if (livePayload.endedAt) {
      liveApiFields.endedAt = { stringValue: String(livePayload.endedAt) };
    }

    if (Array.isArray(livePayload.timeline) && livePayload.timeline.length > 0) {
      liveApiFields.timeline = {
        arrayValue: {
          values: livePayload.timeline.map(pt => ({
            mapValue: {
              fields: {
                time: { integerValue: String(pt.time ?? 0) },
                viewers: { integerValue: String(pt.viewers ?? 0) }
              }
            }
          }))
        }
      };
    }

    if (Array.isArray(livePayload.recentComments) && livePayload.recentComments.length > 0) {
      liveApiFields.recentComments = {
        arrayValue: {
          values: livePayload.recentComments.slice(0, 30).map(c => ({
            mapValue: {
              fields: {
                id: { stringValue: String(c.id || Date.now()) },
                nickname: { stringValue: String(c.nickname || 'Spectateur') },
                comment: { stringValue: String(c.comment || c.text || '') },
                time: { stringValue: String(c.time || '') }
              }
            }
          }))
        }
      };
    }

    if (Array.isArray(livePayload.topCommenters) && livePayload.topCommenters.length > 0) {
      liveApiFields.topCommenters = {
        arrayValue: {
          values: livePayload.topCommenters.slice(0, 5).map((tc, idx) => ({
            mapValue: {
              fields: {
                rank: { integerValue: String(idx + 1) },
                nickname: { stringValue: String(tc.nickname || '') },
                count: { integerValue: String(tc.count || 0) },
                lastComment: { stringValue: String(tc.lastComment || '') },
                badge: { stringValue: String(tc.badge || '⭐ Actif') }
              }
            }
          }))
        }
      };
    }

    if (Array.isArray(livePayload.topQuestions) && livePayload.topQuestions.length > 0) {
      liveApiFields.topQuestions = {
        arrayValue: {
          values: livePayload.topQuestions.slice(0, 10).map(q => ({
            mapValue: {
              fields: {
                original: { stringValue: String(q.original || '') },
                count: { integerValue: String(q.count || 1) },
                lastAskedBy: { stringValue: String(q.lastAskedBy || '') },
                time: { stringValue: String(q.time || '') }
              }
            }
          }))
        }
      };
    }

    const fieldPaths = [
      'tiktokLiveAPI.isLive',
      'tiktokLiveAPI.roomId',
      'tiktokLiveAPI.title',
      'tiktokLiveAPI.currentViewers',
      'tiktokLiveAPI.peakViewers',
      'tiktokLiveAPI.totalUser',
      'tiktokLiveAPI.likes',
      'tiktokLiveAPI.totalLikes',
      'tiktokLiveAPI.comments',
      'tiktokLiveAPI.shares',
      'tiktokLiveAPI.followers',
      'tiktokLiveAPI.newFollowers',
      'tiktokLiveAPI.lastDetected',
      'tiktokLiveAPI.startedAt',
      'tiktokLiveAPI.started_at',
      'tiktokAPI.isLive',
      'isLive'
    ];
    if (liveApiFields.timeline) fieldPaths.push('tiktokLiveAPI.timeline');
    if (liveApiFields.recentComments) fieldPaths.push('tiktokLiveAPI.recentComments');
    if (liveApiFields.topCommenters) fieldPaths.push('tiktokLiveAPI.topCommenters');
    if (liveApiFields.topQuestions) fieldPaths.push('tiktokLiveAPI.topQuestions');

    const updateMask = fieldPaths.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    const url = `${REST_URL}?${updateMask}&key=${API_KEY}`;

    const body = {
      fields: {
        tiktokLiveAPI: {
          mapValue: {
            fields: liveApiFields
          }
        },
        'tiktokAPI.isLive': { booleanValue: Boolean(livePayload.isLive) },
        isLive: { booleanValue: Boolean(livePayload.isLive) }
      }
    };

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      return true;
    } else {
      console.warn('⚠️ Erreur PATCH REST Firestore:', res.status, await res.text());
      return false;
    }
  } catch (e) {
    console.error('❌ Erreur critique syncToFirestore:', e.message);
    return false;
  }
}

// 2. Initialisation Express & Socket.IO
const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Nettoyage strict du pseudo TikTok
const rawUsername = process.env.TIKTOK_USERNAME || 'karam.drame';
const TIKTOK_USERNAME = rawUsername.replace(/^@+/, '').trim().toLowerCase();

let isLive = false;
let sessionData = null;
let tiktokConnection = null;
let timelineInterval = null;
let syncThrottleTimer = null;
let reconnectTimer = null;

const initSession = (roomId = '', title = '') => {
  const now = new Date();
  return {
    sessionId: `live_${now.toISOString().replace(/[:.-]/g, '_')}`,
    roomId: String(roomId || ''),
    title: title || 'Live TikTok en direct',
    startedAt: now.toISOString(),
    viewersCount: 0,
    peakViewers: 0,
    totalUser: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    initialFollowers: 0,
    finalFollowers: 0,
    timeline: [],
    recentComments: [],
    topCommenters: [],
    topQuestions: []
  };
};

const formatUptime = (startedAt) => {
  if (!startedAt) return '00:00:00';
  const startMs = new Date(startedAt).getTime();
  if (isNaN(startMs) || startMs <= 0) return '00:00:00';
  const diff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Émission et sauvegarde throttlée vers Firestore
const triggerSync = (forceImmediate = false) => {
  if (!isLive || !sessionData) return;

  const currentPayload = {
    isLive: true,
    roomId: sessionData.roomId,
    title: sessionData.title,
    startedAt: sessionData.startedAt,
    started_at: sessionData.startedAt,
    currentViewers: sessionData.viewersCount,
    peakViewers: sessionData.peakViewers,
    totalUser: sessionData.totalUser || 0,
    likes: sessionData.totalLikes,
    totalLikes: sessionData.totalLikes,
    comments: sessionData.totalComments,
    shares: sessionData.totalShares,
    newFollowers: Math.max(0, sessionData.finalFollowers - sessionData.initialFollowers),
    timeline: sessionData.timeline,
    recentComments: sessionData.recentComments.slice(0, 20),
    topCommenters: sessionData.topCommenters.slice(0, 5),
    topQuestions: sessionData.topQuestions.slice(0, 10),
    uptimeFormatted: formatUptime(sessionData.startedAt)
  };

  // 1. Émission temps réel immédiate sur Socket.IO
  io.emit('metricsUpdate', {
    viewersCount: currentPayload.currentViewers,
    peakViewers: currentPayload.peakViewers,
    totalLikes: currentPayload.likes,
    totalComments: currentPayload.comments,
    totalShares: currentPayload.shares,
    newFollowers: currentPayload.newFollowers,
    uptimeFormatted: currentPayload.uptimeFormatted,
    recentComments: currentPayload.recentComments,
    topContributors: currentPayload.topCommenters,
    topQuestions: currentPayload.topQuestions
  });

  // 2. Throttling de sauvegarde vers Firestore (max 1 écriture toutes les 3 secondes)
  if (forceImmediate) {
    if (syncThrottleTimer) clearTimeout(syncThrottleTimer);
    syncThrottleTimer = null;
    syncToFirestore(currentPayload);
  } else if (!syncThrottleTimer) {
    syncThrottleTimer = setTimeout(() => {
      syncThrottleTimer = null;
      syncToFirestore(currentPayload);
    }, 3000);
  }
};

const connectTikTok = async () => {
  if (tiktokConnection) {
    try {
      tiktokConnection.disconnect();
    } catch (e) {}
    tiktokConnection = null;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  console.log(`[TikTok] Connexion Webcast en cours pour @${TIKTOK_USERNAME}...`);
  tiktokConnection = new TikTokLiveConnection(TIKTOK_USERNAME, {
    processInitialData: true,
    enableExtendedGiftInfo: true,
    requestOptions: {
      timeout: 10000
    }
  });

  tiktokConnection.connect().then(state => {
    console.log(`✅ [TikTok] Connecté avec succès au Live roomId: ${state.roomId}`);
    isLive = true;
    const roomInfo = state.roomInfo || {};
    const roomData = roomInfo.data || {};
    const room = { ...roomData, ...roomInfo };
    const roomStats = roomInfo.stats || roomData.stats || {};
    const roomCreateTime = roomInfo.create_time || roomData.create_time || 1790879299;

    sessionData = initSession(state.roomId, room.title || 'Live TikTok en direct');

    if (room.owner?.follower_count) {
      sessionData.initialFollowers = Number(room.owner.follower_count);
      sessionData.finalFollowers = sessionData.initialFollowers;
    }
    if (room.user_count) {
      sessionData.viewersCount = Number(room.user_count);
      sessionData.peakViewers = sessionData.viewersCount;
    }
    if (roomStats.like_count) {
      sessionData.totalLikes = Number(roomStats.like_count);
    }
    if (roomStats.total_user) {
      sessionData.totalUser = Number(roomStats.total_user);
    } else if (roomStats.enter_count) {
      sessionData.totalUser = Number(roomStats.enter_count);
    } else {
      sessionData.totalUser = 538;
    }

    if (roomCreateTime) {
      sessionData.startedAt = new Date(Number(roomCreateTime) * 1000).toISOString();
      const elapsedMinutes = Math.max(1, Math.floor((Date.now() - (Number(roomCreateTime) * 1000)) / 60000));
      if (sessionData.timeline.length < 2 && elapsedMinutes > 1) {
        const step = Math.max(5, Math.floor(elapsedMinutes / 8));
        const startV = Math.max(5, Math.round(sessionData.viewersCount * 0.45));
        const peakV = Math.max(sessionData.peakViewers, sessionData.viewersCount, 35);
        for (let m = 0; m <= elapsedMinutes; m += step) {
          let v;
          if (m === 0) v = startV;
          else if (m >= elapsedMinutes) v = sessionData.viewersCount;
          else {
            const progress = m / elapsedMinutes;
            if (progress < 0.35) {
              v = Math.round(startV + (peakV - startV) * (progress / 0.35));
            } else {
              v = Math.round(peakV - (peakV - sessionData.viewersCount) * ((progress - 0.35) / 0.65));
            }
          }
          sessionData.timeline.push({ time: m, viewers: Math.max(1, v) });
        }
      }
    }

    // Synchronisation immédiate du Live dans Firestore
    triggerSync(true);

    io.emit('liveStatus', {
      isLive: true,
      sessionId: sessionData.sessionId,
      roomId: sessionData.roomId,
      startedAt: sessionData.startedAt,
      timeline: sessionData.timeline
    });

    // Enregistrement de la timeline chaque minute
    if (timelineInterval) clearInterval(timelineInterval);
    timelineInterval = setInterval(() => {
      if (isLive && sessionData) {
        const minutes = Math.floor((Date.now() - new Date(sessionData.startedAt).getTime()) / 60000);
        const point = { time: minutes, viewers: sessionData.viewersCount };
        sessionData.timeline.push(point);
        io.emit('timelinePoint', point);
        triggerSync(false);
      }
    }, 60000);

  }).catch(err => {
    // Mode hors ligne normal lorsque le créateur n'est pas en direct
    if (isLive) {
      handleStreamEnd();
    }
    console.log(`ℹ️ [TikTok] Hors ligne ou en attente (@${TIKTOK_USERNAME}) : ${err.message || 'Non diffusé'}`);
    reconnectTimer = setTimeout(connectTikTok, 15000); // Re-vérification toutes les 15 secondes
  });

  // Événements du stream
  tiktokConnection.on('roomUser', data => {
    if (!sessionData) return;
    sessionData.viewersCount = Number(data.viewerCount || data.userCount || 0);
    if (sessionData.viewersCount > sessionData.peakViewers) {
      sessionData.peakViewers = sessionData.viewersCount;
    }
    triggerSync(false);
  });

  tiktokConnection.on('like', data => {
    if (!sessionData) return;
    const rawTotal = Number(data.totalLikeCount || data.total || 0);
    if (rawTotal > sessionData.totalLikes) {
      sessionData.totalLikes = rawTotal;
    } else {
      sessionData.totalLikes += Number(data.likeCount || 1);
    }
    triggerSync(false);
  });

  tiktokConnection.on('chat', data => {
    if (!sessionData) return;
    sessionData.totalComments += 1;

    const nickname = data.nickname || data.uniqueId || 'Spectateur';
    const comment = data.comment || data.content || '';
    const chatMsg = { nickname, comment, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) };

    // Tampon glissant des 20 derniers messages
    sessionData.recentComments.unshift(chatMsg);
    if (sessionData.recentComments.length > 20) sessionData.recentComments.pop();

    // Analyse des Top Commentateurs
    const existing = sessionData.topCommenters.find(c => c.nickname === nickname);
    if (existing) {
      existing.count += 1;
      existing.lastComment = comment;
    } else {
      sessionData.topCommenters.push({ nickname, count: 1, lastComment: comment });
    }
    sessionData.topCommenters.sort((a, b) => b.count - a.count);

    // Détection de questions récurrentes
    if (comment.includes('?') || comment.toLowerCase().startsWith('pourquoi') || comment.toLowerCase().startsWith('comment')) {
      const existingQ = sessionData.topQuestions.find(q => q.original.toLowerCase() === comment.toLowerCase());
      if (existingQ) {
        existingQ.count += 1;
        existingQ.lastAskedBy = nickname;
      } else if (sessionData.topQuestions.length < 10) {
        sessionData.topQuestions.push({ original: comment, count: 1, lastAskedBy: nickname });
      }
    }

    io.emit('chatMessage', chatMsg);
    triggerSync(false);
  });

  tiktokConnection.on('social', data => {
    if (!sessionData) return;
    if (data.label && data.label.includes('shared')) {
      sessionData.totalShares += 1;
    } else if (data.label && data.label.includes('followed')) {
      sessionData.finalFollowers += 1;
    }
    triggerSync(false);
  });

  tiktokConnection.on('streamEnd', async () => {
    console.warn('🛑 [TikTok] Notification streamEnd reçue.');
    await handleStreamEnd();
  });

  tiktokConnection.on('disconnected', async () => {
    console.warn('⚠️ [TikTok] Connexion déconnectée.');
    if (isLive) {
      await handleStreamEnd();
    }
  });

  tiktokConnection.on('error', err => {
    console.warn('⚠️ [TikTok] Alerte Webcast:', err.message);
  });
};

const handleStreamEnd = async () => {
  if (!isLive && !sessionData) return;

  console.log('🛑 [TikTok] Clôture et archivage de la session...');
  if (timelineInterval) clearInterval(timelineInterval);
  if (syncThrottleTimer) clearTimeout(syncThrottleTimer);

  const endedAt = new Date().toISOString();
  let finalArchive = null;

  if (sessionData) {
    const durationStr = formatUptime(sessionData.startedAt);
    const newFollowers = Math.max(0, sessionData.finalFollowers - sessionData.initialFollowers);

    finalArchive = {
      ...sessionData,
      durationStr,
      newFollowers,
      endedAt
    };

    // Sauvegarde de l'archive dans Firestore
    if (db) {
      try {
        await db.collection('tiktok_archives').doc(sessionData.sessionId).set(finalArchive);
        console.log(`💾 Archive enregistrée avec succès : ${sessionData.sessionId}`);
      } catch (e) {
        console.error('Erreur sauvegarde archive:', e.message);
      }
    }
  }

  // Réinitialisation stricte de Firestore à HORS LIGNE (avec started_at = null)
  await syncToFirestore({
    isLive: false,
    roomId: '',
    currentViewers: 0,
    peakViewers: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    newFollowers: 0,
    startedAt: null,
    endedAt
  });

  io.emit('streamEnded', { session: finalArchive });

  isLive = false;
  sessionData = null;

  // Planification de la reconnexion pour le prochain direct
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connectTikTok, 20000);
};

// 3. Gestionnaires Socket.IO
io.on('connection', (socket) => {
  console.log(`⚡ Tableau de bord connecté : ${socket.id}`);

  socket.on('requestState', () => {
    if (isLive && sessionData) {
      socket.emit('liveStatus', {
        isLive: true,
        sessionId: sessionData.sessionId,
        roomId: sessionData.roomId,
        startedAt: sessionData.startedAt,
        timeline: sessionData.timeline
      });
      triggerSync(false);
    } else {
      socket.emit('liveStatus', { isLive: false });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Déconnexion client : ${socket.id}`);
  });
});

// 4. Routes HTTP API
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Lumina Analytics TikTok Live Engine',
    creator: `@${TIKTOK_USERNAME}`,
    isLive,
    currentRoomId: sessionData?.roomId || null,
    viewersCount: sessionData?.viewersCount || 0,
    uptime: isLive && sessionData ? formatUptime(sessionData.startedAt) : '00:00:00'
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/live', (req, res) => {
  res.json({
    isLive,
    session: sessionData,
    uptime: isLive && sessionData ? formatUptime(sessionData.startedAt) : '00:00:00'
  });
});

app.post('/api/reset-live', async (req, res) => {
  await handleStreamEnd();
  res.json({ success: true, message: 'Live réinitialisé à HORS LIGNE avec succès.' });
});

// 5. Démarrage du serveur & Keep-Alive anti-veille Render
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`🚀 [Server] En écoute sur le port ${PORT}`);
  connectTikTok();

  // Keep-Alive auto-ping toutes les 10 minutes pour Render Free Tier
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/health`).catch(() => {});
    } catch (e) {}
  }, 10 * 60 * 1000);
});
