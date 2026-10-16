const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
    const userRef = db.collection('users').doc('karamokho');
    
    // Heure réelle de début du stream (environ 17:15 UTC, il y a plusieurs heures)
    const trueStartTime = '2026-10-12T17:15:21.512Z';

    const liveApiUpdate = {
        'tiktokLiveAPI.isLive': true,
        'tiktokLiveAPI.status': 'LIVE',
        'tiktokLiveAPI.roomId': '7695846892931910422',
        'tiktokLiveAPI.startedAt': trueStartTime,
        'tiktokLiveAPI.started_at': trueStartTime,
        'tiktokLiveAPI.currentViewers': 14,
        'tiktokLiveAPI.viewerCount': 14,
        'tiktokLiveAPI.peakViewers': 48,
        'tiktokLiveAPI.totalUser': 642,
        'tiktokLiveAPI.total_user': 642,
        'tiktokLiveAPI.cumulative_audience': 642,
        'tiktokLiveAPI.likes': 1480,
        'tiktokLiveAPI.totalLikes': 1480,
        'tiktokLiveAPI.shares': 2,
        'tiktokLiveAPI.totalShares': 2,
        'tiktokLiveAPI.shareCount': 2,
        'tiktokLiveAPI.newFollowers': 4,
        'tiktokLiveAPI.followers': 4,
        'tiktokLiveAPI.lastDetected': new Date().toISOString(),
        'tiktokLiveAPI.lastChecked': new Date().toISOString()
    };

    await userRef.update(liveApiUpdate);
    console.log("Firestore updated with corrected TikTok Live KPIs successfully!");
    process.exit(0);
}

run().catch(err => {
    console.error("Erreur Firestore update:", err);
    process.exit(1);
});
