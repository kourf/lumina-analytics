// TikTok Live Webhook - receives push events from TikTok and stores metrics in Firestore
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { getSecret } = require('./secrets');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

exports.tiktokLiveWebhook = functions.https.onRequest(async (req, res) => {
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
    return res.status(200).send({ success: true });
  } catch (e) {
    console.error('TikTok Live webhook error:', e.message);
    return res.status(500).send({ success: false, error: 'Internal Server Error' });
  }
});
