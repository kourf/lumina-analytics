const url = 'https://firestore.googleapis.com/v1/projects/lumina-analytics-kd-2026/databases/(default)/documents/users/karamokho?updateMask.fieldPaths=tiktokLiveAPI.isLive&updateMask.fieldPaths=tiktokLiveAPI.roomId&updateMask.fieldPaths=tiktokLiveAPI.currentViewers&updateMask.fieldPaths=tiktokLiveAPI.started_at&updateMask.fieldPaths=tiktokLiveAPI.startedAt&updateMask.fieldPaths=tiktokAPI.isLive&updateMask.fieldPaths=isLive';

async function resetLive() {
  const body = {
    fields: {
      'tiktokLiveAPI.isLive': { booleanValue: false },
      'tiktokLiveAPI.roomId': { stringValue: '' },
      'tiktokLiveAPI.currentViewers': { integerValue: 0 },
      'tiktokLiveAPI.started_at': { nullValue: null },
      'tiktokLiveAPI.startedAt': { nullValue: null },
      'tiktokAPI.isLive': { booleanValue: false },
      'isLive': { booleanValue: false }
    }
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  console.log('Reset response status:', res.status);
  const data = await res.json();
  console.log('Result:', JSON.stringify(data.fields?.tiktokLiveAPI || {}, null, 2));
}

resetLive();
