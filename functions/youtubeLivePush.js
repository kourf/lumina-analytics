const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { getSecret } = require('./secrets');
admin.initializeApp();
const db = admin.firestore();

// Topic name must match the Pub/Sub topic created in GCP (e.g., youtube-live-events)
exports.youtubeLivePush = functions.pubsub.topic('youtube-live-events').onPublish(async (message) => {
  try {
    // message.data is a base64‑encoded string
    const dataBuffer = Buffer.from(message.data, 'base64');
    const payload = JSON.parse(dataBuffer.toString());
    // Expected payload format (simplified): { eventType: 'liveStreamingDetails', resourceId: '<liveId>', statistics: { viewerCount, likeCount, commentCount } }
    const liveId = payload.resourceId || 'unknown';
    const stats = payload.statistics || {};
    const docRef = db.collection('liveMetrics').doc(`youtube_${liveId}`);
    const update = {
      isLive: true,
      eventType: payload.eventType || 'unknown',
      viewerCount: Number(stats.viewerCount) || 0,
      likeCount: Number(stats.likeCount) || 0,
      commentCount: Number(stats.commentCount) || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await docRef.set(update, { merge: true });
    console.log(`YouTube Live metrics stored for ${liveId}`);
  } catch (e) {
    console.error('YouTube Live Pub/Sub handler error', e);
  }
});
