const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const PROJECT_ID = 'lumina-analytics-kd-2026';

async function updateFirestoreLiveFields() {
  const mask = [
    'updateMask.fieldPaths=tiktokLiveAPI.isLive',
    'updateMask.fieldPaths=tiktokLiveAPI.currentViewers',
    'updateMask.fieldPaths=tiktokLiveAPI.totalUser',
    'updateMask.fieldPaths=tiktokLiveAPI.cumulative_audience',
    'updateMask.fieldPaths=tiktokLiveAPI.started_at',
    'updateMask.fieldPaths=tiktokLiveAPI.ended_at',
    'updateMask.fieldPaths=tiktokLiveAPI.durationStr',
    'updateMask.fieldPaths=tiktokLiveAPI.likes',
    'updateMask.fieldPaths=tiktokLiveAPI.totalLikes',
    'updateMask.fieldPaths=isLive',
    'updateMask.fieldPaths=tiktokAPI.isLive'
  ].join('&');

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?${mask}&key=${API_KEY}`;

  const body = {
    fields: {
      isLive: { booleanValue: false },
      'tiktokAPI.isLive': { booleanValue: false },
      tiktokLiveAPI: {
        mapValue: {
          fields: {
            isLive: { booleanValue: false },
            currentViewers: { integerValue: '0' },
            totalUser: { integerValue: '1076' },
            cumulative_audience: { integerValue: '1076' },
            started_at: { stringValue: '2026-10-13T18:02:35.000Z' },
            ended_at: { stringValue: '2026-10-13T21:28:06.000Z' },
            durationStr: { stringValue: '03:25:31' },
            likes: { integerValue: '3840' },
            totalLikes: { integerValue: '3840' }
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

  console.log('Update status:', res.status);
  const data = await res.json();
  console.log('Result likes:', data.fields?.tiktokLiveAPI?.mapValue?.fields?.likes);
  console.log('Result totalUser:', data.fields?.tiktokLiveAPI?.mapValue?.fields?.totalUser);
}

updateFirestoreLiveFields();
