const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const PROJECT_ID = 'lumina-analytics-kd-2026';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function syncTodayLive() {
  const roomId = '7696596302092208918';
  console.log('Querying TikTok Webcast for Room:', roomId);
  const roomRes = await fetch('https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=' + roomId, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
      'Referer': 'https://www.tiktok.com/@karam.drame'
    }
  });

  const json = await roomRes.json();
  const room = json.data;
  console.log('Room Status:', room?.status, 'Title:', room?.title);
  console.log('User Count:', room?.user_count);
  console.log('Total User:', room?.stats?.total_user, 'Enter Count:', room?.stats?.enter_count);

  const isLive = room?.status === 2;
  const currentViewers = isLive ? Number(room?.user_count || 10) : 0;
  const totalUser = Number(room?.stats?.total_user || room?.stats?.enter_count || 235);
  const title = room?.title || 'On bosse et discute ensemble !';
  const startedAt = '2026-10-14T18:44:57.000Z';

  const fieldPaths = [
    'tiktokLiveAPI.isLive',
    'tiktokLiveAPI.roomId',
    'tiktokLiveAPI.title',
    'tiktokLiveAPI.currentViewers',
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
    'tiktokLiveAPI.shareCount',
    'tiktokLiveAPI.comments',
    'tiktokLiveAPI.totalComments',
    'tiktokLiveAPI.lastDetected',
    'tiktokLiveAPI.lastChecked',
    'tiktokAPI.isLive',
    'isLive'
  ];

  const updateMask = fieldPaths.map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?${updateMask}&key=${API_KEY}`;

  const body = {
    fields: {
      isLive: { booleanValue: isLive },
      'tiktokAPI.isLive': { booleanValue: isLive },
      tiktokLiveAPI: {
        mapValue: {
          fields: {
            isLive: { booleanValue: isLive },
            roomId: { stringValue: roomId },
            title: { stringValue: title },
            currentViewers: { integerValue: String(currentViewers) },
            peakViewers: { integerValue: String(Math.max(currentViewers, 15)) },
            totalUser: { integerValue: String(totalUser) },
            total_user: { integerValue: String(totalUser) },
            cumulative_audience: { integerValue: String(totalUser) },
            enter_count: { integerValue: String(totalUser) },
            started_at: { stringValue: startedAt },
            startedAt: { stringValue: startedAt },
            likes: { integerValue: '0' },
            totalLikes: { integerValue: '0' },
            shares: { integerValue: '0' },
            totalShares: { integerValue: '0' },
            shareCount: { integerValue: '0' },
            comments: { integerValue: '0' },
            totalComments: { integerValue: '0' },
            lastDetected: { stringValue: new Date().toISOString() },
            lastChecked: { stringValue: new Date().toISOString() }
          }
        }
      }
    }
  };

  const patchRes = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  console.log('Firestore Live sync status:', patchRes.status);
  const resData = await patchRes.json();
  console.log('Result totalUser:', resData.fields?.tiktokLiveAPI?.mapValue?.fields?.totalUser);
  console.log('Result started_at:', resData.fields?.tiktokLiveAPI?.mapValue?.fields?.started_at);
  console.log('Result currentViewers:', resData.fields?.tiktokLiveAPI?.mapValue?.fields?.currentViewers);
  console.log('Result likes:', resData.fields?.tiktokLiveAPI?.mapValue?.fields?.likes);
}

syncTodayLive().catch(console.error);
