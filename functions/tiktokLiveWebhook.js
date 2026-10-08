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

    // --- NOTE : RÉACTIVATION SÉCURISÉE DU WEBHOOK COMME "HEALER" ---
    // Le Worker Render peut manquer des likes si TikTok ne les envoie pas dans le Webcast (ou s'il plante).
    // Ce webhook officiel reçoit la vraie valeur totale.
    // On utilise Math.max pour ne JAMAIS faire reculer les compteurs si le Worker est en avance.

    const newLikes = Math.max(existingLiveAPI.likes || existingLiveAPI.totalLikes || 0, likeCount);
    const newViewers = viewerCount > 0 ? viewerCount : (existingLiveAPI.currentViewers || existingLiveAPI.viewerCount || 0); // L'audience peut baisser, on prend la valeur webhook si > 0
    const newComments = Math.max(existingLiveAPI.comments || existingLiveAPI.totalComments || 0, commentCount);

    const updatedLiveAPI = {
      ...existingLiveAPI,
      likes: newLikes,
      currentViewers: newViewers,
      comments: newComments,
      isLive: event !== 'live_end',
      lastEvent: event,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (event === 'live_end') {
      // Nettoyage pour la fin du live
      updatedLiveAPI.isLive = false;
      
      // On peut ajouter l'archivage ici si besoin, comme avant
      const archiveSession = {
        sessionId: existingLiveAPI.roomId || liveId,
        startedAt: existingLiveAPI.startedAt || new Date().toISOString(),
        endedAt: new Date().toISOString(),
        metrics: {
          peakViewers: existingLiveAPI.peakViewers || newViewers,
          totalLikes: newLikes,
          totalComments: newComments,
          totalShares: existingLiveAPI.shares || 0,
        }
      };
      
      await userDocRef.set({
        tiktokLiveAPI: updatedLiveAPI,
        historyArchives: admin.firestore.FieldValue.arrayUnion(archiveSession)
      }, { merge: true });
    } else {
      // Mise à jour normale pendant le live
      await userDocRef.set({
        tiktokLiveAPI: updatedLiveAPI
      }, { merge: true });
    }

    return res.status(200).send({ success: true, healedLikes: newLikes });
  } catch (e) {
    console.error('TikTok Live webhook error:', e.message);
    return res.status(500).send({ success: false, error: 'Internal Server Error' });
  }
});
