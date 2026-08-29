async function testRest() {
  const url = 'https://firestore.googleapis.com/v1/projects/lumina-analytics-kd-2026/databases/(default)/documents/users/karamokho?updateMask.fieldPaths=tiktokLiveAPI.lastDetected';
  const body = {
    fields: {
      'tiktokLiveAPI': {
        mapValue: {
          fields: {
            'lastDetected': { stringValue: new Date().toISOString() }
          }
        }
      }
    }
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  console.log('REST STATUS:', res.status);
  const json = await res.json();
  console.log('Response:', JSON.stringify(json).substring(0, 200));
}

testRest();
