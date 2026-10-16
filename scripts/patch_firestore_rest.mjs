const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const PROJECT_ID = 'lumina-analytics-kd-2026';

async function patchFirestore() {
  const fieldsToUpdate = {
    'tiktokLiveAPI.isLive': { booleanValue: true },
    'tiktokLiveAPI.roomId': { stringValue: '7696214325131741974' },
    'tiktokLiveAPI.title': { stringValue: 'On bosse et discute ensemble !' },
    'tiktokLiveAPI.currentViewers': { integerValue: '18' },
    'tiktokLiveAPI.viewerCount': { integerValue: '18' },
    'tiktokLiveAPI.peakViewers': { integerValue: '35' },
    'tiktokLiveAPI.totalUser': { integerValue: '526' },
    'tiktokLiveAPI.total_user': { integerValue: '526' },
    'tiktokLiveAPI.cumulative_audience': { integerValue: '526' },
    'tiktokLiveAPI.enter_count': { integerValue: '526' },
    'tiktokLiveAPI.likes': { integerValue: '3840' },
    'tiktokLiveAPI.totalLikes': { integerValue: '3840' },
    'tiktokLiveAPI.shares': { integerValue: '2' },
    'tiktokLiveAPI.totalShares': { integerValue: '2' },
    'tiktokLiveAPI.shareCount': { integerValue: '2' },
    'tiktokLiveAPI.started_at': { stringValue: '2026-10-13T18:02:35.000Z' },
    'tiktokLiveAPI.startedAt': { stringValue: '2026-10-13T18:02:35.000Z' },
    'tiktokLiveAPI.lastDetected': { stringValue: new Date().toISOString() },
    'tiktokAPI.isLive': { booleanValue: true },
    'isLive': { booleanValue: true }
  };

  const updateMask = Object.keys(fieldsToUpdate)
    .map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join('&');

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?${updateMask}&key=${API_KEY}`;

  console.log('Sending PATCH to Firestore REST API...');
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: fieldsToUpdate
      }),
      signal: controller.signal
    });

    clearTimeout(t);
    console.log('REST STATUS:', res.status);
    const json = await res.json();
    if (res.ok) {
      console.log('✅ Firestore mis à jour avec SUCCÈS via REST API !');
      console.log('Champs mis à jour :', Object.keys(json.fields?.tiktokLiveAPI?.mapValue?.fields || {}));
    } else {
      console.error('Erreur REST:', JSON.stringify(json));
    }
  } catch (e) {
    clearTimeout(t);
    console.error('Fetch exception:', e.message);
  }

  process.exit(0);
}

patchFirestore();
