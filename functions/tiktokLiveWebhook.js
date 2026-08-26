// TikTok Live Webhook - receives push events from TikTok and stores metrics in Firestore
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { getSecret } = require('./secrets');
admin.initializeApp();
const db = admin.firestore();

exports.tiktokLiveWebhook = functions.https.onRequest(async (req, res) => {
  // TikTok sends POST with JSON payload
  try {
    const tiktokClientSecret = await getSecret('TIKTOK_CLIENT_SECRET');
    const tiktokClientKey = await getSecret('TIKTOK_CLIENT_KEY');
    const payload = req.body;
    const { event, data } = payload;
    // Expected fields: event type ("live_start", "live_end", "viewer_count", "like_count", "comment_count")
    const liveId = data?.room_id || data?.roomId || 'unknown';
    const docRef = db.collection('liveMetrics').doc(`tiktok_${liveId}`);
    const update = {
      isLive: event !== 'live_end',
      lastEvent: event,
      viewerCount: data?.viewer_count || data?.viewerCount || 0,
      likeCount: data?.like_count || data?.likeCount || 0,
      commentCount: data?.comment_count || data?.commentCount || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await docRef.set(update, { merge: true });
    res.status(200).send({ success: true });
  } catch (e) {
    console.error('TikTok Live webhook error', e);
    res.status(500).send({ success: false, error: e.message });
  }
});
