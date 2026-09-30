import fetch from 'node-fetch';

const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const PROJECT_ID = 'lumina-analytics-kd-2026';

async function check() {
  console.log("--- 1. tiktok_archives ---");
  const r1 = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tiktok_archives?key=${API_KEY}`);
  const d1 = await r1.json();
  if (d1.documents) {
    for (const doc of d1.documents) {
      console.log("Archive doc name:", doc.name);
    }
  } else {
    console.log("No documents in tiktok_archives");
  }

  console.log("--- 2. users/karamokho ---");
  const r2 = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?key=${API_KEY}`);
  const d2 = await r2.json();
  const f = d2.fields || {};
  if (f.historyArchives) {
    console.log("f.historyArchives found:", JSON.stringify(f.historyArchives));
  }
  if (f.tiktokLiveAPI?.mapValue?.fields?.historyArchives) {
    console.log("f.tiktokLiveAPI.historyArchives found:", JSON.stringify(f.tiktokLiveAPI.mapValue.fields.historyArchives));
  }

  console.log("--- 3. tiktokLiveSessions ---");
  const r3 = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tiktokLiveSessions?key=${API_KEY}`);
  const d3 = await r3.json();
  if (d3.documents) {
    for (const doc of d3.documents) {
      console.log("tiktokLiveSessions doc name:", doc.name);
    }
  } else {
    console.log("No documents in tiktokLiveSessions");
  }
}

check();
