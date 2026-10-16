const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function check() {
    const docSnap = await db.collection('users').doc('karamokho').get();
    const data = docSnap.data();
    console.log("tiktokLiveAPI FULL:", JSON.stringify(data?.tiktokLiveAPI, null, 2));
    console.log("tiktokAPI:", JSON.stringify(data?.tiktokAPI, null, 2));
    process.exit(0);
}
check();
