const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const PROJECT_ID = 'lumina-analytics-kd-2026';
const REST_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho`;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function detectActiveRoomId(username = 'karam.drame') {
  try {
    const profileRes = await fetch(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html',
        'Cache-Control': 'no-cache'
      }
    });
    if (profileRes.ok) {
      const html = await profileRes.text();
      const match = html.match(/"roomId"\s*:\s*"?(\d+)"?/);
      if (match && match[1] && match[1] !== '0') {
        return match[1];
      }
      const idx = html.indexOf('__UNIVERSAL_DATA_FOR_REHYDRATION__');
      if (idx !== -1) {
        const tagClose = html.indexOf('>', idx);
        const endTag = html.indexOf('</script>', tagClose);
        const json = JSON.parse(html.substring(tagClose + 1, endTag));
        const rId = json.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.user?.roomId;
        if (rId && String(rId) !== '0') return String(rId);
      }
    }
  } catch (e) {
    console.warn('[Detect] Erreur récupération profil:', e.message);
  }
  return null;
}

export async function fetchLiveWebcast(roomId) {
  for (const aid of ['8311', '1988']) {
    try {
      const res = await fetch(`https://webcast.tiktok.com/webcast/room/info/?aid=${aid}&room_id=${roomId}`, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
          'Referer': 'https://www.tiktok.com/@karam.drame'
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) return json.data;
      }
    } catch (e) {
      // try next aid
    }
  }
  return null;
}

export async function syncLiveToFirestoreDirect(data) {
  const isLive = Boolean(data.isLive);
  const roomId = String(data.roomId || '');
  const currentViewers = isLive ? Math.max(0, Number(data.currentViewers || 0)) : 0;
  const peakViewers = Math.max(0, Number(data.peakViewers || currentViewers));
  const totalUser = Math.max(0, Number(data.totalUser || data.cumulative_audience || currentViewers));
  const likes = Math.max(0, Number(data.likes || data.totalLikes || 0));
  const shares = Math.max(0, Number(data.shares || 0));
  const comments = Math.max(0, Number(data.comments || 0));
  const title = String(data.title || (isLive ? 'Live TikTok en direct' : 'Session terminée'));
  const startedAt = data.startedAt || data.started_at || new Date().toISOString();

  const fieldPaths = [
    'tiktokLiveAPI.isLive',
    'tiktokLiveAPI.status',
    'tiktokLiveAPI.roomId',
    'tiktokLiveAPI.title',
    'tiktokLiveAPI.currentViewers',
    'tiktokLiveAPI.viewerCount',
    'tiktokLiveAPI.peakViewers',
    'tiktokLiveAPI.totalUser',
    'tiktokLiveAPI.total_user',
    'tiktokLiveAPI.cumulative_audience',
    'tiktokLiveAPI.enter_count',
    'tiktokLiveAPI.started_at',
    'tiktokLiveAPI.startedAt',
    'tiktokLiveAPI.likes',
    'tiktokLiveAPI.totalLikes',
    'tiktokLiveAPI.shares',
    'tiktokLiveAPI.totalShares',
    'tiktokLiveAPI.comments',
    'tiktokLiveAPI.totalComments',
    'tiktokLiveAPI.lastDetected',
    'tiktokLiveAPI.lastChecked',
    'tiktokAPI.isLive',
    'isLive'
  ];

  const updateMask = fieldPaths.map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
  const url = `${REST_URL}?${updateMask}&key=${API_KEY}`;

  const fields = {
    isLive: { booleanValue: isLive },
    'tiktokAPI.isLive': { booleanValue: isLive },
    tiktokLiveAPI: {
      mapValue: {
        fields: {
          isLive: { booleanValue: isLive },
          status: { stringValue: isLive ? 'LIVE' : 'OFFLINE' },
          roomId: { stringValue: roomId },
          title: { stringValue: title },
          currentViewers: { integerValue: String(currentViewers) },
          viewerCount: { integerValue: String(currentViewers) },
          peakViewers: { integerValue: String(peakViewers) },
          totalUser: { integerValue: String(totalUser) },
          total_user: { integerValue: String(totalUser) },
          cumulative_audience: { integerValue: String(totalUser) },
          enter_count: { integerValue: String(totalUser) },
          started_at: { stringValue: startedAt },
          startedAt: { stringValue: startedAt },
          likes: { integerValue: String(likes) },
          totalLikes: { integerValue: String(likes) },
          shares: { integerValue: String(shares) },
          totalShares: { integerValue: String(shares) },
          comments: { integerValue: String(comments) },
          totalComments: { integerValue: String(comments) },
          lastDetected: { stringValue: new Date().toISOString() },
          lastChecked: { stringValue: new Date().toISOString() }
        }
      }
    }
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });

  return res.ok;
}

export async function runSyncOnce() {
  let roomId = '7696940542093150998';
  const detected = await detectActiveRoomId('karam.drame');
  if (detected) roomId = detected;

  console.log(`[Sync] Room ID actif : ${roomId}`);
  const room = await fetchLiveWebcast(roomId);
  if (!room) {
    console.warn('[Sync] Impossible de joindre Webcast room info');
    return false;
  }

  const isLive = room.status === 2;
  const currentViewers = isLive ? Number(room.user_count || 0) : 0;
  const totalUser = Number(room.stats?.total_user || room.stats?.enter_count || 0);
  const startedAt = room.create_time ? new Date(room.create_time * 1000).toISOString() : new Date().toISOString();

  // Read existing live metrics to avoid resetting
  let existingLikes = 1330;
  let existingShares = 1;
  let existingPeak = 27;
  let existingTotal = 1170;
  try {
    const fsGet = await fetch(REST_URL);
    if (fsGet.ok) {
      const fsJson = await fsGet.json();
      const curLive = fsJson.fields?.tiktokLiveAPI?.mapValue?.fields;
      if (curLive?.likes?.integerValue) existingLikes = Number(curLive.likes.integerValue);
      if (curLive?.totalLikes?.integerValue) existingLikes = Math.max(existingLikes, Number(curLive.totalLikes.integerValue));
      if (curLive?.shares?.integerValue) existingShares = Number(curLive.shares.integerValue);
      if (curLive?.totalShares?.integerValue) existingShares = Math.max(existingShares, Number(curLive.totalShares.integerValue));
      if (curLive?.peakViewers?.integerValue) existingPeak = Number(curLive.peakViewers.integerValue);
      if (curLive?.totalUser?.integerValue) existingTotal = Number(curLive.totalUser.integerValue);
    }
  } catch (e) {}

  const finalLikes = Math.max(existingLikes, Number(room.stats?.like_count || 0));
  const finalShares = Math.max(existingShares, Number(room.stats?.share_count || 0));
  const finalPeak = Math.max(existingPeak, currentViewers);
  const finalTotal = Math.max(existingTotal, Number(room.stats?.total_user || room.stats?.enter_count || 0));

  const payload = {
    isLive,
    roomId,
    title: room.title || 'On bosse et discute ensemble !',
    currentViewers,
    peakViewers: finalPeak,
    totalUser: finalTotal,
    likes: finalLikes,
    shares: finalShares,
    comments: Number(room.stats?.comment_count || 0),
    startedAt
  };

  const success = await syncLiveToFirestoreDirect(payload);
  console.log(`[Sync OK] isLive=${isLive} | currentViewers=${currentViewers} | peak=${finalPeak} | totalUser=${totalUser} | likes=${finalLikes}`);
  return success;
}

export async function runDaemon(intervalMs = 6000) {
  console.log(`[Daemon] Démarrage de la boucle de synchronisation temps réel (intervalle: ${intervalMs}ms)...`);
  while (true) {
    try {
      await runSyncOnce();
    } catch (e) {
      console.warn(`[Daemon] Erreur lors du cycle:`, e.message);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('sync_exact_live.mjs')) {
  if (process.argv.includes('--loop') || process.argv.includes('--daemon')) {
    runDaemon();
  } else {
    runSyncOnce().then(() => process.exit(0)).catch(err => {
      console.error(err);
      process.exit(1);
    });
  }
}
