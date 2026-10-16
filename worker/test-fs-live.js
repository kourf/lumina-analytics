const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function check() {
    const docSnap = await db.collection('users').doc('karamokho').get();
    const data = docSnap.data();
    const api = data?.tiktokLiveAPI || {};
    console.log("isLive:", api.isLive);
    console.log("startedAt:", api.startedAt);
    console.log("currentViewers:", api.currentViewers);
    console.log("totalUser:", api.totalUser);
    console.log("likes:", api.likes);
    console.log("shares:", api.shares);
    console.log("newFollowers:", api.newFollowers);
    process.exit(0);
}
check();
