const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function fix() {
    const userRef = db.collection('users').doc('karamokho');
    
    // We update both started_at and startedAt to the true start time of the current stream
    await userRef.update({
        'tiktokLiveAPI.startedAt': '2026-10-07T18:09:22.000Z',
        'tiktokLiveAPI.started_at': '2026-10-07T18:09:22.000Z'
    });
    
    console.log("Firestore updated successfully.");
    process.exit(0);
}
fix();
