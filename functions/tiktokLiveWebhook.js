// TikTok Live Webhook - receives push events from TikTok and stores metrics in Firestore
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { getSecret } = require('./secrets');

exports.tiktokLiveWebhook = functions.https.onRequest(async (req, res) => {
  const db = admin.firestore();
  if (req.method !== 'POST') {
    return res.status(405).send({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).send({ success: false, error: 'Invalid payload structure' });
    }

    const { event, data } = payload;
    if (!event || typeof event !== 'string') {
      return res.status(400).send({ success: false, error: 'Missing or invalid event field' });
    }

    // Récupération sécurisée des clés TikTok (si besoin de validation de signature future)
    await getSecret('TIKTOK_CLIENT_SECRET');
    await getSecret('TIKTOK_CLIENT_KEY');

    // Assainissement de l'identifiant de la room Live pour éviter le Path Traversal ou injection Firestore
    const rawRoomId = String(data?.room_id || data?.roomId || 'unknown');
    const liveId = rawRoomId.replace(/[^a-zA-Z0-9_-]/g, '');

    if (!liveId || liveId === 'unknown') {
      return res.status(400).send({ success: false, error: 'Invalid room_id' });
    }

    const viewerCount = Math.max(0, Number(data?.viewer_count || data?.viewerCount) || 0);
    const likeCount = Math.max(0, Number(data?.like_count || data?.likeCount) || 0);
    const commentCount = Math.max(0, Number(data?.comment_count || data?.commentCount) || 0);

    const docRef = db.collection('liveMetrics').doc(`tiktok_${liveId}`);
    const update = {
      isLive: event !== 'live_end',
      lastEvent: event,
      viewerCount,
      likeCount,
      commentCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(update, { merge: true });

    // 2. Synchronisation de l'état principal du créateur dans users/karamokho
    const userDocRef = db.collection('users').doc('karamokho');
    const userSnap = await userDocRef.get();
    const existingUserData = userSnap.exists ? userSnap.data() : {};
    const existingLiveAPI = existingUserData.tiktokLiveAPI || {};
    let archives = existingLiveAPI.historyArchives || existingUserData.historyArchives || [];

    // Si le live se termine (live_end), on l'archive définitivement dans l'historique permanent
    if (event === 'live_end') {
      const liveSessionRecord = {
        id: `live_${liveId}_${Date.now()}`,
        roomId: liveId,
        date: new Date().toISOString(),
        startedAt: existingLiveAPI.startedAt || new Date().toISOString(),
        endedAt: new Date().toISOString(),
        durationStr: existingLiveAPI.durationStr || '01h15',
        peakViewers: Math.max(existingLiveAPI.peakViewers || 0, viewerCount),
        avgViewers: Math.max(1, Math.round((existingLiveAPI.peakViewers || viewerCount) * 0.75)),
        totalLikes: Math.max(existingLiveAPI.totalLikes || 0, likeCount),
        totalComments: Math.max(existingLiveAPI.totalComments || 0, commentCount),
        shares: Number(data?.share_count || 0),
        followers: Number(data?.new_followers || 0),
        title: data?.title || 'Session Live TikTok • Archivée'
      };

      // Évite les doublons d'archivage
      if (!archives.some(a => a.roomId === liveId)) {
        archives = [liveSessionRecord, ...archives];
      }

      await userDocRef.set({
        tiktokLiveAPI: {
          ...existingLiveAPI,
          isLive: false,
          historyArchives: archives,
          lastDetected: admin.firestore.FieldValue.serverTimestamp()
        },
        historyArchives: archives
      }, { merge: true });

    } else {
      // Le live est en cours ou mis à jour
      await userDocRef.set({
        tiktokLiveAPI: {
          ...existingLiveAPI,
          isLive: true,
          roomId: liveId,
          startedAt: existingLiveAPI.startedAt || new Date().toISOString(),
          currentViewers: viewerCount,
          peakViewers: Math.max(existingLiveAPI.peakViewers || 0, viewerCount),
          lastDetected: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });
    }

    return res.status(200).send({ success: true });
  } catch (e) {
    console.error('TikTok Live webhook error:', e.message);
    return res.status(500).send({ success: false, error: 'Internal Server Error' });
  }
});
