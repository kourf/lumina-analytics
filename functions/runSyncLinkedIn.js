const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

if (!admin.apps?.length) {
  admin.initializeApp({
    projectId: 'lumina-analytics-kd-2026'
  });
}

const { syncLinkedInAccount } = require('./linkedinService');

async function run() {
  try {
    const result = await syncLinkedInAccount('karamokho');
    console.log('SYNC RESULT:', JSON.stringify(result.profile, null, 2));
  } catch (e) {
    console.error('ERROR:', e);
  }
}

run();
