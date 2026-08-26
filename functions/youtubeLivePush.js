const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Topic name must match the Pub/Sub topic created in GCP (e.g., youtube-live-events)
exports.youtubeLivePush = functions.pubsub.topic('youtube-live-events').onPublish(async (message) => {
  try {
    if (!message || !message.data) {
      console.warn('YouTube Live Pub/Sub handler: Message data is empty.');
      return;
    }

    // message.data is a base64-encoded string
    const dataBuffer = Buffer.from(message.data, 'base64');
    let payload;
    try {
      payload = JSON.parse(dataBuffer.toString('utf8'));
    } catch (parseError) {
      console.error('YouTube Live Pub/Sub handler: Invalid JSON payload');
      return;
    }

    if (!payload || typeof payload !== 'object') {
      console.error('YouTube Live Pub/Sub handler: Payload is not an object');
      return;
    }

    const rawId = String(payload.resourceId || '');
    const liveId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');

    if (!liveId) {
      console.warn('YouTube Live Pub/Sub handler: Invalid or missing resourceId');
      return;
    }

    const stats = payload.statistics || {};
    const docRef = db.collection('liveMetrics').doc(`youtube_${liveId}`);
    const update = {
      isLive: payload.eventType !== 'live_end',
      eventType: String(payload.eventType || 'unknown'),
      viewerCount: Math.max(0, Number(stats.viewerCount) || 0),
      likeCount: Math.max(0, Number(stats.likeCount) || 0),
      commentCount: Math.max(0, Number(stats.commentCount) || 0),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(update, { merge: true });
    console.log(`YouTube Live metrics stored safely for ${liveId}`);
  } catch (e) {
    console.error('YouTube Live Pub/Sub handler error:', e.message);
  }
});
