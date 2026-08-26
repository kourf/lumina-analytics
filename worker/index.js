const { WebcastPushConnection } = require('tiktok-live-connector');
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');

// Initialisation de Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = getFirestore();

// Initialisation optionnelle de Redis (avec gestion gracieuse du mode dégradé)
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
                if (times > 5) {
                    console.warn('[Redis] Max retries reached. Operating in fallback memory mode.');
                    return null; // Stop retrying
                }
                return Math.min(times * 200, 2000);
            }
        });

        redis.on('error', (err) => {
            console.warn('[Redis Error] Connection failure, operating without cache:', err.message);
        });

        redis.connect()
            .then(() => console.log('Connecté au cache Memorystore Redis'))
            .catch(err => console.warn('Redis Memorystore non disponible:', err.message));
    } catch (e) {
        console.warn('Initialisation Redis échouée:', e.message);
    }
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

let currentConnection = null;
let isConnected = false;
let sessionRef = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Compteurs et statistiques en mémoire
let viewersCount = 0;
let totalLikes = 0;
let peakViewers = 0;
let liveStartTime = null;
let totalComments = 0;

// Nouveaux compteurs
let totalShares = 0;
let newFollowers = 0;
let totalDiamonds = 0;

// Tracking Contributeurs et Donateurs
let userMessagesCount = {};
let userGiftsTotal = {};
let topContributor = { nickname: '', count: 0 };
let topDonator = { nickname: '', diamonds: 0 };

// IA : Clustering de questions
let questionClusters = [];

const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || 'karam.drame';

// Fonction basique de similarité de Jaccard (pour clustering IA)
const getJaccardSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
};

const startLiveTracker = async () => {
    if (isConnected) return { status: 'already_connected' };

    console.log(`Tentative de connexion au Live de @${TIKTOK_USERNAME}... (Essai ${reconnectAttempts + 1})`);

    currentConnection = new WebcastPushConnection(TIKTOK_USERNAME, {
        processInitialData: true,
        enableExtendedGiftInfo: true,
        requestOptions: {
            timeout: 10000
        }
    });

    try {
        const state = await currentConnection.connect();
        isConnected = true;
        reconnectAttempts = 0;
        console.log(`Connecté avec succès à Room ID: ${state.roomId}`);
        
        liveStartTime = new Date();
        viewersCount = 0;
        totalLikes = 0;
        peakViewers = 0;
        totalComments = 0;
        totalShares = 0;
        newFollowers = 0;
        totalDiamonds = 0;
        userMessagesCount = {};
        userGiftsTotal = {};
        topContributor = { nickname: 'Aucun', count: 0 };
        topDonator = { nickname: 'Aucun', diamonds: 0 };
        questionClusters = [];

        sessionRef = db.collection('tiktokLiveSessions').doc(state.roomId.toString());
        await sessionRef.set({
            status: 'live',
            roomId: state.roomId,
            username: TIKTOK_USERNAME,
            startTime: liveStartTime,
            lastUpdate: FieldValue.serverTimestamp(),
            viewers: viewersCount,
            peakViewers: peakViewers,
            totalLikes: totalLikes,
            totalComments: totalComments,
            totalShares: totalShares,
            newFollowers: newFollowers,
            totalDiamonds: totalDiamonds
        });

        // Met à jour l'UI globale avec initialisation à 0
        await db.collection('users').doc('karamokho').set({
            tiktokLiveAPI: {
                isLive: true,
                currentViewers: 0,
                peakViewers: 0,
                likes: 0,
                shares: 0,
                followers: 0,
                diamonds: 0,
                topContributor: topContributor,
                topDonator: topDonator,
                topQuestions: [],
                lastDetected: FieldValue.serverTimestamp(),
                roomId: state.roomId
            }
        }, { merge: true });

        // VIEWERS
        currentConnection.on('roomUser', (data) => {
            viewersCount = data?.viewerCount || 0;
            if (viewersCount > peakViewers) peakViewers = viewersCount;
        });

        // LIKES
        currentConnection.on('like', (data) => {
            totalLikes += data?.likeCount || 0;
        });

        // PARTAGES & ABONNEMENTS
        currentConnection.on('social', (data) => {
            if (data?.displayType === 'pm_mt_guidance_share') {
                totalShares++;
            } else if (data?.displayType === 'pm_main_follow_message_viewer_2') {
                newFollowers++;
            }
        });

        // CADEAUX (Gifts)
        currentConnection.on('gift', (data) => {
            if (data?.giftType === 1 && !data?.repeatEnd) {
                return;
            }
            const diamonds = (data?.diamondCount || 0) * (data?.repeatCount || 1);
            totalDiamonds += diamonds;

            const uid = data?.userId;
            if (uid) {
                if (!userGiftsTotal[uid]) userGiftsTotal[uid] = { nickname: data.nickname || 'Anonyme', diamonds: 0 };
                userGiftsTotal[uid].diamonds += diamonds;

                if (userGiftsTotal[uid].diamonds > topDonator.diamonds) {
                    topDonator = { nickname: data.nickname || 'Anonyme', diamonds: userGiftsTotal[uid].diamonds };
                }
            }
        });

        // CHAT & IA CLUSTERING
        currentConnection.on('chat', async (data) => {
            totalComments++;
            
            const uid = data?.userId;
            if (uid) {
                if (!userMessagesCount[uid]) userMessagesCount[uid] = { nickname: data.nickname || 'Anonyme', count: 0 };
                userMessagesCount[uid].count++;

                if (userMessagesCount[uid].count > topContributor.count) {
                    topContributor = { nickname: data.nickname || 'Anonyme', count: userMessagesCount[uid].count };
                }
            }

            const msg = (data?.comment || '').trim();
            if (msg.includes('?') || msg.toLowerCase().startsWith('comment') || msg.toLowerCase().startsWith('pourquoi')) {
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

            if (sessionRef) {
                sessionRef.collection('messages').add({
                    userId: data?.userId || 'unknown',
                    uniqueId: data?.uniqueId || 'unknown',
                    nickname: data?.nickname || 'Anonyme',
                    comment: msg,
                    timestamp: FieldValue.serverTimestamp()
                }).catch(() => {});
            }
        });

        currentConnection.on('streamEnd', async () => {
            console.log("Le Live TikTok est terminé.");
            await stopLiveTracker();
        });

        currentConnection.on('disconnected', async () => {
            console.warn("Déconnecté de TikTok Live. Tentative de reconnexion...");
            isConnected = false;
            handleAutoReconnect();
        });

        currentConnection.on('error', (err) => {
            console.error('Erreur TikTok Live connection:', err?.message || err);
        });

    } catch (err) {
        console.error("Échec de la connexion TikTok Live:", err.message);
        isConnected = false;
        handleAutoReconnect();
        return { status: 'failed', error: err.message };
    }

    return { status: 'connected' };
};

const handleAutoReconnect = () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`Reconnexion programmée dans ${backoffDelay / 1000}s (Tentative ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        setTimeout(() => {
            if (!isConnected) {
                startLiveTracker();
            }
        }, backoffDelay);
    } else {
        console.error("Nombre maximal de tentatives de reconnexion atteint. Arrêt du tracker.");
    }
};

const stopLiveTracker = async () => {
    if (currentConnection) {
        try {
            currentConnection.disconnect();
        } catch (e) {
            console.warn('Erreur lors de la déconnexion TikTok:', e.message);
        }
        currentConnection = null;
    }
    
    if (isConnected && sessionRef) {
        try {
            await sessionRef.set({
                status: 'ended',
                endTime: FieldValue.serverTimestamp(),
                viewers: viewersCount,
                peakViewers: peakViewers,
                totalLikes: totalLikes,
                totalComments: totalComments,
                totalShares: totalShares,
                newFollowers: newFollowers,
                totalDiamonds: totalDiamonds,
                topQuestions: questionClusters.slice(0, 3)
            }, { merge: true });

            await db.collection('users').doc('karamokho').set({
                tiktokLiveAPI: {
                    isLive: false,
                    currentViewers: 0,
                    peakViewers: 0,
                    likes: 0,
                    shares: 0,
                    followers: 0,
                    diamonds: 0,
                    topContributor: { nickname: '', count: 0 },
                    topDonator: { nickname: '', diamonds: 0 },
                    topQuestions: [],
                    lastUpdated: FieldValue.serverTimestamp()
                }
            }, { merge: true });
        } catch (err) {
            console.error('Erreur mise à jour Firestore à l\'arrêt du Live:', err.message);
        }
    }
    
    isConnected = false;
};

app.get('/status', (req, res) => {
    res.json({ 
        service: 'Lumina TikTok Live Worker', 
        status: 'running',
        isConnected: isConnected,
        reconnectAttempts: reconnectAttempts,
        viewers: viewersCount,
        likes: totalLikes,
        comments: totalComments
    });
});

app.post('/start', async (req, res) => {
    reconnectAttempts = 0;
    const result = await startLiveTracker();
    res.json(result);
});

app.post('/stop', async (req, res) => {
    await stopLiveTracker();
    res.json({ status: 'stopped' });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Worker TikTok Live à l'écoute sur le port ${port}`);
    
    startLiveTracker();
    
    setInterval(() => {
        if (!isConnected && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            console.log("Worker inactif, vérification reconnexion...");
            handleAutoReconnect();
        } else if (isConnected) {
            const top3Questions = questionClusters.slice(0, 3);
            
            if (sessionRef) {
                sessionRef.set({
                    viewers: viewersCount,
                    peakViewers: peakViewers,
                    totalLikes: totalLikes,
                    totalComments: totalComments,
                    totalShares: totalShares,
                    newFollowers: newFollowers,
                    totalDiamonds: totalDiamonds,
                    lastUpdate: FieldValue.serverTimestamp()
                }, { merge: true }).catch(e => console.error("Heartbeat error", e.message));
            }

            db.collection('users').doc('karamokho').set({
                tiktokLiveAPI: {
                    currentViewers: viewersCount,
                    peakViewers: peakViewers,
                    likes: totalLikes,
                    shares: totalShares,
                    followers: newFollowers,
                    diamonds: totalDiamonds,
                    topContributor: topContributor,
                    topDonator: topDonator,
                    topQuestions: top3Questions,
                    lastUpdated: FieldValue.serverTimestamp()
                }
            }, { merge: true }).catch(e => console.error("UI Heartbeat error", e.message));
        }
    }, 15000);
});
