const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function fix() {
    const userRef = db.collection('users').doc('karamokho');
    
    setInterval(async () => {
        await userRef.update({
            'tiktokLiveAPI.startedAt': '2026-10-07T18:09:22.000Z',
            'tiktokLiveAPI.started_at': '2026-10-07T18:09:22.000Z'
        });
        console.log("Forced startedAt to 18:09:22.000Z");
    }, 2000);
}
fix();
