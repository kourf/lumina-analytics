const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const PROJECT_ID = 'lumina-analytics-kd-2026';

async function archiveSession() {
  const archiveDocId = 'live_20261013_7696214325131741974';
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tiktok_archives/${archiveDocId}?key=${API_KEY}`;

  const archiveFields = {
    title: { stringValue: 'On bosse et discute ensemble !' },
    roomId: { stringValue: '7696214325131741974' },
    startedAt: { stringValue: '2026-10-13T18:02:35.000Z' },
    endedAt: { stringValue: '2026-10-13T21:28:06.000Z' },
    duration: { integerValue: '12331' },
    durationStr: { stringValue: '03:25:31' },
    views: { integerValue: '1076' },
    totalUser: { integerValue: '1076' },
    cumulative_audience: { integerValue: '1076' },
    peakViewers: { integerValue: '35' },
    replay_viewers: { integerValue: '838' },
    shares: { integerValue: '2' },
    likes: { integerValue: '3840' },
    newFollowers: { integerValue: '0' },
    createdAt: { stringValue: new Date().toISOString() }
  };

  console.log('Création de l\'archive officielle 13 oct. 2026...');
  const resArchive = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: archiveFields })
  });

  console.log('Archive status:', resArchive.status);

  // Mettre à jour users/karamokho avec les données finales de la session
  const userUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?updateMask.fieldPaths=tiktokLiveAPI.isLive&updateMask.fieldPaths=tiktokLiveAPI.currentViewers&updateMask.fieldPaths=tiktokLiveAPI.totalUser&updateMask.fieldPaths=tiktokLiveAPI.cumulative_audience&updateMask.fieldPaths=tiktokLiveAPI.started_at&updateMask.fieldPaths=tiktokLiveAPI.ended_at&updateMask.fieldPaths=tiktokLiveAPI.durationStr&updateMask.fieldPaths=tiktokLiveAPI.likes&updateMask.fieldPaths=tiktokLiveAPI.totalLikes&updateMask.fieldPaths=isLive&updateMask.fieldPaths=tiktokAPI.isLive&key=${API_KEY}`;

  const userUpdate = {
    fields: {
      'tiktokLiveAPI.isLive': { booleanValue: false },
      'isLive': { booleanValue: false },
      'tiktokAPI.isLive': { booleanValue: false },
      'tiktokLiveAPI.currentViewers': { integerValue: '0' },
      'tiktokLiveAPI.totalUser': { integerValue: '1076' },
      'tiktokLiveAPI.cumulative_audience': { integerValue: '1076' },
      'tiktokLiveAPI.started_at': { stringValue: '2026-10-13T18:02:35.000Z' },
      'tiktokLiveAPI.ended_at': { stringValue: '2026-10-13T21:28:06.000Z' },
      'tiktokLiveAPI.durationStr': { stringValue: '03:25:31' },
      'tiktokLiveAPI.likes': { integerValue: '3840' },
      'tiktokLiveAPI.totalLikes': { integerValue: '3840' }
    }
  };

  const resUser = await fetch(userUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userUpdate)
  });

  console.log('User update status:', resUser.status);
  console.log('✅ Archive et Firestore synchronisés avec succès !');
  process.exit(0);
}

archiveSession().catch(e => {
  console.error(e);
  process.exit(1);
});
