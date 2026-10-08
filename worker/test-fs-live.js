const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function check() {
    const docSnap = await db.collection('users').doc('karamokho').get();
    const data = docSnap.data();
    console.log("tiktokLiveAPI isLive:", data?.tiktokLiveAPI?.isLive);
    console.log("tiktokLiveAPI startedAt:", data?.tiktokLiveAPI?.startedAt);
    console.log("tiktokLiveAPI started_at:", data?.tiktokLiveAPI?.started_at);
    console.log("tiktokLiveAPI likes:", data?.tiktokLiveAPI?.likes);
    console.log("tiktokLiveAPI totalLikes:", data?.tiktokLiveAPI?.totalLikes);
    console.log("tiktokLiveAPI roomId:", data?.tiktokLiveAPI?.roomId);
    process.exit(0);
}
check();
