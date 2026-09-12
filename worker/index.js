/**
 * Lumina Analytics - Backend Worker TikTok Live (Production-Ready)
 * 
 * Responsabilités :
 * 1. Connexion temps réel TikTok Live via tiktok-live-connector (bypass CORS & WebSocket Webcast).
 * 2. Serveur WebSocket bi-directionnel Socket.io pour diffusion sub-seconde vers React.
 * 3. Détection automatique du Live avec boucle de reconnexion exponentielle (Backoff).
 * 4. Détection de streamEnd, agrégation statistique, calcul de rétention et archivage Firestore.
 * 5. Réinitialisation automatique à zéro du dashboard pour la session suivante.
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector/legacy');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const Redis = require('ioredis');

const fs = require('fs');
const path = require('path');

// 1. INITIALISATION FIREBASE ADMIN SDK
const apps = getApps();
if (!apps.length) {
    const saPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(saPath)) {
        try {
            const serviceAccount = require(saPath);
            initializeApp({ credential: cert(serviceAccount) });
            console.log('✓ Firebase Admin initialisé avec succès via serviceAccountKey.json');
        } catch (e) {
            console.warn('[Firebase] Erreur chargement serviceAccountKey.json:', e.message);
        }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            initializeApp({ credential: cert(serviceAccount) });
            console.log('✓ Firebase Admin initialisé via variable JSON');
        } catch (e) {
            console.warn('[Firebase] Initialisation via variable JSON échouée:', e.message);
        }
    } else {
        try {
            initializeApp({ projectId: process.env.PROJECT_ID || 'lumina-analytics-kd-2026' });
        } catch (e) {
            console.warn('[Firebase] Initialisation par défaut:', e.message);
        }
    }
}
const db = getFirestore();

// 2. INITIALISATION OPTIONNELLE DE REDIS (Mode dégradé gracieux)
let redis = null;
if (process.env.REDIS_HOST) {
    try {
        redis = new Redis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            connectTimeout: 5000,
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                if (times > 5) return null;
                return Math.min(times * 200, 2000);
            }
        });
        redis.on('error', (err) => console.warn('[Redis] Indisponible, fallback mémoire locale:', err.message));
        redis.connect().then(() => console.log('✓ Connecté au cache Redis Memorystore')).catch(() => {});
    } catch (e) {
        console.warn('[Redis] Erreur configuration:', e.message);
    }
}

// 3. INITIALISATION EXPRESS & SERVEUR WEBSOCKET SOCKET.IO
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    pingInterval: 10000,
    pingTimeout: 5000
});

// 4. CONFIGURATION DE L'UTILISATEUR CIBLE & CONSTANTES
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || 'karam.drame';
const TARGET_FIRESTORE_USER = process.env.FIRESTORE_USER_ID || 'karamokho';
const MAX_RECONNECT_ATTEMPTS = 8;
const DETECTION_INTERVAL_OFFLINE_MS = 30000; // 30 secondes en mode hors ligne

// 5. VARIABLES D'ÉTAT DE SESSION LIVE EN MÉMOIRE
let currentConnection = null;
let isConnected = false;
let currentRoomId = null;
let currentSessionId = null;
let liveStartTime = null;
let reconnectAttempts = 0;
let isDetecting = false;
let detectionTimer = null;
let timelineInterval = null;

// Compteurs volatils en temps réel
let viewersCount = 0;
let peakViewers = 0;
let viewerSamples = []; // Échantillons pour calcul de la moyenne
let totalLikes = 0;
let totalComments = 0;
let totalShares = 0;
let newFollowers = 0;
let totalDiamonds = 0;

// Tracking Contributeurs & IA
let userMessagesCount = {};
let userGiftsTotal = {};
let topContributor = { nickname: 'Aucun', count: 0 };
let topDonator = { nickname: 'Aucun', diamonds: 0 };
let questionClusters = [];
let liveTimelinePoints = []; // [{ time: '0m', timestamp: ISO, viewers: 10 }]

// Helper similarité Jaccard pour clustering de questions
const getJaccardSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
};

// Formateur de durée (ex: "01h24m30s")
const formatDuration = (startMs, endMs) => {
    const diff = Math.max(0, endMs - startMs);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h > 0 ? `${String(h).padStart(2, '0')}h` : ''}${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`;
};

// 6. GESTION DES CONNEXIONS SOCKET.IO (CLIENTS FRONTEND)
io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connecté : ${socket.id} (Total: ${io.engine.clientsCount})`);

    // Envoi de l'état initial complet dès la connexion
    socket.emit('liveStatus', {
        isLive: isConnected,
        username: TIKTOK_USERNAME,
        roomId: currentRoomId,
        sessionId: currentSessionId,
        startedAt: liveStartTime ? liveStartTime.toISOString() : null,
        currentViewers: viewersCount,
        peakViewers: peakViewers,
        totalLikes: totalLikes,
        totalShares: totalShares,
        newFollowers: newFollowers,
        totalDiamonds: totalDiamonds,
        topQuestions: questionClusters.slice(0, 4),
        topContributors: [
            { rank: 1, name: topContributor.nickname, count: topContributor.count },
            { rank: 2, name: topDonator.nickname, diamonds: topDonator.diamonds }
        ].filter(c => c.name && c.name !== 'Aucun'),
        timeline: liveTimelinePoints
    });

    socket.on('requestState', () => {
        socket.emit('liveStatus', {
            isLive: isConnected,
            username: TIKTOK_USERNAME,
            roomId: currentRoomId,
            sessionId: currentSessionId,
            startedAt: liveStartTime ? liveStartTime.toISOString() : null,
            currentViewers: viewersCount,
            peakViewers: peakViewers,
            totalLikes: totalLikes,
            totalShares: totalShares,
            newFollowers: newFollowers,
            timeline: liveTimelinePoints
        });
    });

    socket.on('disconnect', () => {
        console.log(`[WebSocket] Client déconnecté : ${socket.id}`);
    });
});

// 7. BROADCASTING WEBSOCKET EN TEMPS RÉEL & SYNCHRONISATION FIRESTORE THROTTLÉE
let firestoreSyncTimer = null;
let firestoreIsSyncing = false;
let firestorePendingSync = false;

const syncMetricsToFirestore = async () => {
    if (!isConnected || !currentSessionId) return;
    if (firestoreIsSyncing) {
        firestorePendingSync = true;
        return;
    }

    firestoreIsSyncing = true;
    firestorePendingSync = false;

    try {
        await db.collection('users').doc(TARGET_FIRESTORE_USER).set({
            tiktokLiveAPI: {
                isLive: true,
                session_id: currentSessionId,
                roomId: currentRoomId,
                title: currentConnection?.roomInfo?.data?.title || 'Live TikTok en direct',
                startedAt: liveStartTime ? liveStartTime.toISOString() : null,
                started_at: liveStartTime ? liveStartTime.toISOString() : null,
                currentViewers: viewersCount,
                peakViewers: peakViewers,
                likes: totalLikes,
                totalLikes: totalLikes,
                shares: totalShares,
                totalShares: totalShares,
                followers: newFollowers,
                newFollowers: newFollowers,
                diamonds: totalDiamonds,
                totalDiamonds: totalDiamonds,
                comments: totalComments,
                topContributor: topContributor,
                topDonator: topDonator,
                topQuestions: questionClusters.slice(0, 4),
                lastDetected: FieldValue.serverTimestamp(),
                workerLastHeartbeat: FieldValue.serverTimestamp()
            }
        }, { merge: true });

        // Mise à jour de la session d'archivage en parallèle
        db.collection('tiktokLiveSessions').doc(currentSessionId).set({
            peakViewers,
            currentViewers: viewersCount,
            totalLikes,
            totalComments,
            totalShares,
            newFollowers,
            totalDiamonds,
            lastUpdated: FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});

    } catch (err) {
        console.warn('[Firestore Sync] Erreur mise à jour live metrics:', err.message);
    } finally {
        firestoreIsSyncing = false;
        if (firestorePendingSync) {
            scheduleFirestoreSync(1000);
        }
    }
};

const scheduleFirestoreSync = (delayMs = 2500) => {
    if (firestoreSyncTimer) return;
    firestoreSyncTimer = setTimeout(() => {
        firestoreSyncTimer = null;
        syncMetricsToFirestore();
    }, delayMs);
};

const broadcastMetrics = () => {
    const elapsedSecs = liveStartTime ? Math.floor((Date.now() - liveStartTime.getTime()) / 1000) : 0;
    const uptimeStr = liveStartTime ? formatDuration(liveStartTime.getTime(), Date.now()) : '00:00:00';

    io.emit('metricsUpdate', {
        timestamp: new Date().toISOString(),
        viewersCount,
        peakViewers,
        totalLikes,
        totalComments,
        totalShares,
        newFollowers,
        totalDiamonds,
        elapsedSeconds: elapsedSecs,
        uptimeFormatted: uptimeStr,
        topContributor,
        topDonator,
        topQuestions: questionClusters.slice(0, 4)
    });

    // Déclenchement de la synchronisation groupée Firestore (sub-3s)
    scheduleFirestoreSync();
};

// 8. COEUR DU TRACKER : DÉMARRAGE DU LIVE TIKTOK
const startLiveTracker = async () => {
    if (isConnected || isDetecting) return { status: 'in_progress' };

    isDetecting = true;
    console.log(`[TikTok] Vérification de l'état Live pour @${TIKTOK_USERNAME} (Tentative ${reconnectAttempts + 1})...`);

    currentConnection = new WebcastPushConnection(TIKTOK_USERNAME, {
        processInitialData: true,
        enableExtendedGiftInfo: true,
        requestOptions: {
            timeout: 10000
        }
    });

    try {
        const state = await currentConnection.connect();
        
        // LE STREAM EST ACTIF !
        isConnected = true;
        isDetecting = false;
        reconnectAttempts = 0;
        currentRoomId = state.roomId.toString();
        const createTimeSec = state.roomInfo?.data?.create_time;
        liveStartTime = (createTimeSec && typeof createTimeSec === 'number' && createTimeSec > 1000000000) 
            ? new Date(createTimeSec * 1000) 
            : new Date();
        
        // Génération d'un session_id unique et immutable pour l'archivage
        const dateStamp = liveStartTime.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        currentSessionId = `live_${TIKTOK_USERNAME}_${dateStamp}_${currentRoomId}`;

        console.log(`🔥 [TikTok] LIVE EN COURS DÉTECTÉ !`);
        console.log(`- Room ID: ${currentRoomId}`);
        console.log(`- Session ID: ${currentSessionId}`);
        console.log(`- Début: ${liveStartTime.toISOString()}`);

        // Initialisation avec les statistiques réelles fournies par TikTok
        const initialStats = state.roomInfo?.data?.stats || {};
        viewersCount = Number(state.roomInfo?.data?.user_count || 0);
        peakViewers = viewersCount;
        viewerSamples = viewersCount > 0 ? [viewersCount] : [];
        totalLikes = Number(initialStats.like_count || 0);
        totalComments = Number(initialStats.comment_count || 0);
        totalShares = Number(initialStats.share_count || 0);
        newFollowers = Number(initialStats.follow_count || 0);
        totalDiamonds = Number(initialStats.fan_ticket || 0);
        userMessagesCount = {};
        userGiftsTotal = {};
        topContributor = { nickname: 'Aucun', count: 0 };
        topDonator = { nickname: 'Aucun', diamonds: 0 };
        questionClusters = [];
        liveTimelinePoints = [{
            time: '0m',
            timestamp: liveStartTime.toISOString(),
            viewers: viewersCount
        }];

        // Enregistrement initial dans la collection d'archives tiktokLiveSessions
        await db.collection('tiktokLiveSessions').doc(currentSessionId).set({
            session_id: currentSessionId,
            roomId: currentRoomId,
            username: TIKTOK_USERNAME,
            status: 'live',
            startedAt: liveStartTime.toISOString(),
            started_at: liveStartTime.toISOString(),
            title: state.roomInfo?.data?.title || 'Live TikTok en direct',
            createdAt: FieldValue.serverTimestamp(),
            peakViewers: peakViewers,
            avgViewers: viewersCount,
            totalLikes: totalLikes,
            totalComments: totalComments,
            totalShares: totalShares,
            newFollowers: newFollowers,
            totalDiamonds: totalDiamonds,
            timeline: liveTimelinePoints,
            topQuestions: [],
            topContributors: []
        });

        // Mise à jour de la vue temps réel globale dans users/karamokho
        await db.collection('users').doc(TARGET_FIRESTORE_USER).set({
            tiktokLiveAPI: {
                isLive: true,
                session_id: currentSessionId,
                roomId: currentRoomId,
                title: state.roomInfo?.data?.title || 'Live TikTok en direct',
                startedAt: liveStartTime.toISOString(),
                started_at: liveStartTime.toISOString(),
                currentViewers: viewersCount,
                peakViewers: peakViewers,
                likes: totalLikes,
                shares: totalShares,
                followers: newFollowers,
                diamonds: totalDiamonds,
                topContributor: topContributor,
                topDonator: topDonator,
                topQuestions: [],
                lastUpdated: FieldValue.serverTimestamp(),
                workerLastHeartbeat: FieldValue.serverTimestamp()
            }
        }, { merge: true });

        // Notification WebSocket immédiate à tous les dashboards
        io.emit('liveStatus', {
            isLive: true,
            username: TIKTOK_USERNAME,
            roomId: currentRoomId,
            sessionId: currentSessionId,
            startedAt: liveStartTime.toISOString(),
            timeline: liveTimelinePoints
        });

        // Intervalle de snapshot de timeline de rétention (toutes les 60 secondes)
        if (timelineInterval) clearInterval(timelineInterval);
        timelineInterval = setInterval(() => {
            if (!isConnected || !liveStartTime) return;
            const minutesElapsed = Math.round((Date.now() - liveStartTime.getTime()) / 60000);
            const point = {
                time: `${minutesElapsed}m`,
                timestamp: new Date().toISOString(),
                viewers: viewersCount
            };
            liveTimelinePoints.push(point);
            io.emit('timelinePoint', point);

            // Synchronisation de la courbe dans Firestore
            db.collection('tiktokLiveSessions').doc(currentSessionId).set({
                timeline: liveTimelinePoints,
                peakViewers,
                totalLikes,
                totalComments
            }, { merge: true }).catch(() => {});
        }, 60000);

        // 9. ATTACHEMENT DES ÉVÉNEMENTS WEBCASHPUSH

        // Concurrent Viewers
        currentConnection.on('roomUser', (data) => {
            viewersCount = Math.max(0, Number(data?.viewerCount) || 0);
            viewerSamples.push(viewersCount);
            if (viewersCount > peakViewers) {
                peakViewers = viewersCount;
            }
            broadcastMetrics();
        });

        // Tracking dédoublonné pour éviter les doubles incrémentations entre 'social' et 'share'/'follow'
        const handledSocialMsgIds = new Set();
        const markSocialHandled = (id) => {
            if (!id) return false;
            if (handledSocialMsgIds.has(id)) return true;
            handledSocialMsgIds.add(id);
            if (handledSocialMsgIds.size > 2000) {
                const first = handledSocialMsgIds.values().next().value;
                handledSocialMsgIds.delete(first);
            }
            return false;
        };

        const handleShareEvent = (data) => {
            const msgId = data?.msgId || data?.id || (data?.userId ? `${data.userId}_share_${Date.now()}` : null);
            if (msgId && markSocialHandled(msgId)) return;
            const count = Math.max(1, Number(data?.shareCount) || 1);
            totalShares += count;
            console.log(`[TikTok Event] 🔄 Partage détecté (+${count}, total: ${totalShares})`);
            broadcastMetrics();
        };

        const handleFollowEvent = (data) => {
            const msgId = data?.msgId || data?.id || (data?.userId ? `${data.userId}_follow_${Date.now()}` : null);
            if (msgId && markSocialHandled(msgId)) return;
            newFollowers++;
            console.log(`[TikTok Event] ➕ Nouvel abonné détecté (total live: ${newFollowers})`);
            broadcastMetrics();
        };

        // Likes de session (cumulatif automatique ou batch)
        currentConnection.on('like', (data) => {
            const rawTotal = typeof data?.total === 'number' ? data.total : parseInt(data?.total || data?.totalLikeCount || 0);
            const rawCount = typeof data?.count === 'number' ? data.count : parseInt(data?.count || data?.likeCount || 1);
            
            if (!isNaN(rawTotal) && rawTotal > 0) {
                totalLikes = Math.max(totalLikes, rawTotal);
            } else if (!isNaN(rawCount) && rawCount > 0) {
                totalLikes += rawCount;
            } else {
                totalLikes += 1;
            }
            broadcastMetrics();
        });

        // Partages & Abonnements (écouteurs dédiés + fallback social)
        currentConnection.on('share', handleShareEvent);
        currentConnection.on('follow', handleFollowEvent);

        currentConnection.on('social', (data) => {
            const displayType = String(data?.displayType || data?.label || data?.action || '').toLowerCase();
            if (displayType.includes('share') || displayType.includes('partagé') || data?.shareType || data?.shareTarget) {
                handleShareEvent(data);
            } else if (displayType.includes('follow') || displayType.includes('abonné') || data?.followType) {
                handleFollowEvent(data);
            }
        });

        // Cadeaux (Gifts / Diamonds)
        currentConnection.on('gift', (data) => {
            if (data?.giftType === 1 && !data?.repeatEnd) return;
            const diamonds = (data?.diamondCount || 0) * (data?.repeatCount || 1);
            totalDiamonds += diamonds;

            const uid = data?.userId || data?.uniqueId;
            if (uid) {
                const name = data.nickname || data.uniqueId || 'Anonyme';
                if (!userGiftsTotal[uid]) userGiftsTotal[uid] = { nickname: name, diamonds: 0 };
                userGiftsTotal[uid].diamonds += diamonds;

                if (userGiftsTotal[uid].diamonds > topDonator.diamonds) {
                    topDonator = { nickname: name, diamonds: userGiftsTotal[uid].diamonds };
                }
            }
            broadcastMetrics();
        });

        // Tchat en direct & Extraction de questions
        currentConnection.on('chat', async (data) => {
            totalComments++;

            const uid = data?.userId || data?.uniqueId;
            const nickname = data?.nickname || data?.uniqueId || 'Spectateur';
            const msg = (data?.comment || '').trim();

            if (uid) {
                if (!userMessagesCount[uid]) userMessagesCount[uid] = { nickname, count: 0 };
                userMessagesCount[uid].count++;

                if (userMessagesCount[uid].count > topContributor.count) {
                    topContributor = { nickname, count: userMessagesCount[uid].count };
                }
            }

            // Détection automatique de question stratégique
            const isQuestion = msg.includes('?') || /^(comment|pourquoi|combien|quel|quelle|est-ce)/i.test(msg);
            if (isQuestion && msg.length > 8) {
                let foundCluster = false;
                for (let cluster of questionClusters) {
                    if (getJaccardSimilarity(cluster.original, msg) > 0.4) {
                        cluster.count++;
                        foundCluster = true;
                        break;
                    }
                }
                if (!foundCluster) {
                    questionClusters.push({ original: msg, count: 1 });
                }
                questionClusters.sort((a, b) => b.count - a.count);
                if (questionClusters.length > 20) questionClusters.pop();
            }

            // Émission WebSocket instantanée du message au composant Tchat
            io.emit('chatMessage', {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                user: nickname,
                uniqueId: data?.uniqueId || '',
                text: msg,
                isQuestion,
                avatar: data?.profilePictureUrl || null,
                timestamp: new Date().toISOString()
            });

            // Enregistrement asynchrone non-bloquant du message dans la sous-collection Firestore
            if (currentSessionId) {
                db.collection('tiktokLiveSessions')
                  .doc(currentSessionId)
                  .collection('messages')
                  .add({
                      userId: uid || 'unknown',
                      nickname,
                      comment: msg,
                      isQuestion,
                      timestamp: FieldValue.serverTimestamp()
                  }).catch(() => {});
            }

            broadcastMetrics();
        });

        // Événement streamEnd officiel de TikTok
        currentConnection.on('streamEnd', async () => {
            console.log("🛑 [TikTok] Événement streamEnd reçu de TikTok !");
            await stopLiveTracker();
        });

        // Déconnexion temporaire du flux
        currentConnection.on('disconnected', async () => {
            console.warn("⚠️ [TikTok] Connexion Webcast fermée. Vérification de reconnexion...");
            isConnected = false;
            handleAutoReconnect();
        });

        currentConnection.on('error', (err) => {
            console.error('[TikTok Error]', err?.message || err);
        });

    } catch (err) {
        // En cas d'erreur (ex: utilisateur hors ligne), on programme la vérification suivante
        isDetecting = false;
        isConnected = false;
        handleAutoReconnect();
        return { status: 'offline', message: err.message };
    }

    return { status: 'connected', roomId: currentRoomId, sessionId: currentSessionId };
};

// 10. GESTION DE RECONNEXION AVEC BACKOFF EXPONENTIEL
const handleAutoReconnect = () => {
    if (detectionTimer) clearTimeout(detectionTimer);

    // Calcul du délai avec backoff exponentiel plafonné à 30 secondes
    const backoffDelay = isConnected 
        ? 5000 
        : Math.min(1000 * Math.pow(2, Math.min(reconnectAttempts, 5)), DETECTION_INTERVAL_OFFLINE_MS);

    reconnectAttempts++;
    console.log(`[Reconnexion] Prochaine vérification programmée dans ${Math.round(backoffDelay / 1000)}s (Tentative ${reconnectAttempts})...`);

    detectionTimer = setTimeout(async () => {
        if (!isConnected) {
            await startLiveTracker();
        }
    }, backoffDelay);
};

// 11. ARRÊT & ARCHIVAGE COMPLET DE LA SESSION (streamEnd)
const stopLiveTracker = async () => {
    if (timelineInterval) {
        clearInterval(timelineInterval);
        timelineInterval = null;
    }

    if (currentConnection) {
        try {
            currentConnection.disconnect();
        } catch (e) {
            console.warn('[TikTok] Erreur disconnect:', e.message);
        }
        currentConnection = null;
    }

    const streamEndTime = new Date();
    const durationMs = liveStartTime ? Math.max(0, streamEndTime.getTime() - liveStartTime.getTime()) : 0;
    const durationFormatted = liveStartTime ? formatDuration(liveStartTime.getTime(), streamEndTime.getTime()) : '00:00';
    
    // Calcul de l'audience moyenne
    const avgViewers = viewerSamples.length > 0 
        ? Math.round(viewerSamples.reduce((a, b) => a + b, 0) / viewerSamples.length)
        : Math.round(peakViewers * 0.75);

    const completedSessionRecord = {
        id: currentSessionId || `live_${Date.now()}`,
        session_id: currentSessionId || `live_${Date.now()}`,
        roomId: currentRoomId,
        username: TIKTOK_USERNAME,
        status: 'ended',
        startedAt: liveStartTime ? liveStartTime.toISOString() : streamEndTime.toISOString(),
        endedAt: streamEndTime.toISOString(),
        date: liveStartTime ? liveStartTime.toISOString() : streamEndTime.toISOString(),
        durationSeconds: Math.floor(durationMs / 1000),
        duration: durationFormatted,
        durationStr: durationFormatted,
        peakViewers,
        avgViewers,
        likes: totalLikes,
        totalLikes,
        comments: totalComments,
        totalComments,
        shares: totalShares,
        followers: newFollowers,
        diamonds: totalDiamonds,
        title: `Live TikTok • Session @${TIKTOK_USERNAME} (${durationFormatted})`,
        topQuestions: questionClusters.slice(0, 4),
        topContributors: [
            { rank: 1, name: topContributor.nickname, badge: "Top Fan", comments: topContributor.count },
            { rank: 2, name: topDonator.nickname, badge: "VIP", diamonds: topDonator.diamonds }
        ].filter(c => c.name && c.name !== 'Aucun'),
        timeline: liveTimelinePoints.length > 0 ? liveTimelinePoints : [
            { time: '0m', viewers: 0 },
            { time: durationFormatted, viewers: peakViewers }
        ]
    };

    console.log(`💾 [Archivage] Sauvegarde de la session ${completedSessionRecord.id} dans Firestore...`);

    try {
        // A. Sauvegarde dans le document unique d'archive
        if (currentSessionId) {
            await db.collection('tiktokLiveSessions').doc(currentSessionId).set(completedSessionRecord, { merge: true });
        }

        // B. Ajout dans l'historique permanent de l'utilisateur (tableau dénormalisé pour l'UI)
        const userDocRef = db.collection('users').doc(TARGET_FIRESTORE_USER);
        const userSnap = await userDocRef.get();
        const existingData = userSnap.exists ? userSnap.data() : {};
        const existingArchives = existingData.historyArchives || existingData.tiktokLiveAPI?.historyArchives || [];

        // Évite les doublons d'archivage
        const updatedArchives = [
            completedSessionRecord,
            ...existingArchives.filter(a => a.id !== completedSessionRecord.id && a.sessionId !== completedSessionRecord.id)
        ].slice(0, 50); // Conservation des 50 dernières sessions

        // C. RÉINITIALISATION DU DASHBOARD À ZÉRO pour le prochain direct
        await userDocRef.set({
            historyArchives: updatedArchives,
            tiktokLiveAPI: {
                isLive: false,
                session_id: null,
                roomId: null,
                startedAt: null,
                started_at: null,
                endedAt: streamEndTime.toISOString(),
                currentViewers: 0,
                peakViewers: 0,
                likes: 0,
                shares: 0,
                followers: 0,
                diamonds: 0,
                topContributor: { nickname: '', count: 0 },
                topDonator: { nickname: '', diamonds: 0 },
                topQuestions: [],
                historyArchives: updatedArchives,
                lastDetected: FieldValue.serverTimestamp()
            }
        }, { merge: true });

        console.log(`✓ [Archivage] Session archivée avec succès. Dashboard réinitialisé à zéro.`);
    } catch (err) {
        console.warn('[Archivage Admin SDK Warning]', err.message);
        try {
            // Fallback gracieux via API REST Firestore sécurisée
            const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
            const PROJECT_ID = 'lumina-analytics-kd-2026';
            const restUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${TARGET_FIRESTORE_USER}?updateMask.fieldPaths=tiktokLiveAPI.isLive&updateMask.fieldPaths=tiktokLiveAPI.currentViewers&updateMask.fieldPaths=tiktokLiveAPI.roomId&updateMask.fieldPaths=tiktokLiveAPI.endedAt&updateMask.fieldPaths=tiktokAPI.isLive&key=${API_KEY}`;
            
            await fetch(restUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields: {
                        'tiktokLiveAPI.isLive': { booleanValue: false },
                        'tiktokLiveAPI.currentViewers': { integerValue: 0 },
                        'tiktokLiveAPI.roomId': { stringValue: '' },
                        'tiktokLiveAPI.endedAt': { stringValue: streamEndTime.toISOString() },
                        'tiktokAPI.isLive': { booleanValue: false }
                    }
                })
            });
            console.log(`✓ [Archivage Fallback] Dashboard réinitialisé via REST API.`);
        } catch (restErr) {
            console.error('[Archivage Fallback Error]', restErr.message);
        }
    }

    // D. Diffusion de la fin de stream aux clients WebSocket
    io.emit('streamEnded', {
        session: completedSessionRecord
    });

    io.emit('liveStatus', {
        isLive: false,
        username: TIKTOK_USERNAME,
        roomId: null,
        sessionId: null,
        currentViewers: 0
    });

    // Remise à zéro des états en mémoire
    isConnected = false;
    currentRoomId = null;
    currentSessionId = null;
    liveStartTime = null;

    // Relance de la détection périodique
    handleAutoReconnect();
};

// 12. ROUTES HTTP DE MONITORING ET DE COMMANDE
app.get('/status', (req, res) => {
    res.json({
        service: 'Lumina TikTok Live WebSocket Engine',
        status: isConnected ? 'streaming' : 'monitoring',
        isLive: isConnected,
        username: TIKTOK_USERNAME,
        connectedClients: io.engine.clientsCount,
        session_id: currentSessionId,
        metrics: {
            viewers: viewersCount,
            peak: peakViewers,
            likes: totalLikes,
            comments: totalComments,
            shares: totalShares,
            followers: newFollowers,
            diamonds: totalDiamonds
        },
        uptime: liveStartTime ? formatDuration(liveStartTime.getTime(), Date.now()) : null
    });
});

app.get('/session/current', (req, res) => {
    res.json({
        isLive: isConnected,
        session_id: currentSessionId,
        roomId: currentRoomId,
        startedAt: liveStartTime,
        metrics: {
            viewers: viewersCount,
            peak: peakViewers,
            likes: totalLikes,
            shares: totalShares,
            followers: newFollowers
        },
        topQuestions: questionClusters.slice(0, 4),
        timeline: liveTimelinePoints
    });
});

app.post('/session/start', async (req, res) => {
    reconnectAttempts = 0;
    const result = await startLiveTracker();
    res.json(result);
});

app.post('/session/stop', async (req, res) => {
    await stopLiveTracker();
    res.json({ status: 'stopped', message: 'Live archivé et réinitialisé avec succès' });
});

// 13. DÉMARRAGE DU SERVEUR SUR LE PORT CONFIGURÉ
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`🚀 [Backend Worker] Serveur actif sur le port ${PORT}`);
    console.log(`- Surveillance Live : @${TIKTOK_USERNAME}`);
    console.log(`- WebSocket : ws://localhost:${PORT}`);
    console.log(`- Synchronisation : Firestore 'users/${TARGET_FIRESTORE_USER}'`);

    // Démarrage initial de la boucle de détection
    startLiveTracker();

    // Heartbeat périodique (toutes les 15 secondes) vers Firestore pendant un Live
    setInterval(() => {
        if (isConnected && currentSessionId) {
            broadcastMetrics();

            db.collection('users').doc(TARGET_FIRESTORE_USER).set({
                tiktokLiveAPI: {
                    currentViewers: viewersCount,
                    peakViewers: peakViewers,
                    likes: totalLikes,
                    shares: totalShares,
                    followers: newFollowers,
                    diamonds: totalDiamonds,
                    topContributor: topContributor,
                    topDonator: topDonator,
                    topQuestions: questionClusters.slice(0, 4),
                    lastUpdated: FieldValue.serverTimestamp()
                }
            }, { merge: true }).catch(() => {});
        }
    }, 15000);
});
