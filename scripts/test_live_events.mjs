import { TikTokLiveConnection } from 'tiktok-live-connector';

async function testEvents() {
  console.log('Connecting to @karam.drame live stream...');
  const connection = new TikTokLiveConnection('karam.drame', {
    processInitialData: true,
    requestOptions: { timeout: 10000 }
  });

  connection.on('connected', (state) => {
    console.log('[EVENT connected] Room ID:', state.roomId);
    console.log('[EVENT connected] Room Info stats:', state.roomInfo?.data?.stats);
  });

  connection.on('roomUser', (data) => {
    console.log('[EVENT roomUser] viewers:', data?.viewerCount, 'total:', data?.total, 'anon:', data?.anonymous);
  });

  connection.on('like', (data) => {
    console.log('[EVENT like] total:', data?.total, 'totalLikeCount:', data?.totalLikeCount, 'count:', data?.count);
  });

  connection.on('share', (data) => {
    console.log('[EVENT share]', data);
  });

  connection.on('social', (data) => {
    console.log('[EVENT social]', data?.displayType, data?.label);
  });

  connection.on('chat', (data) => {
    console.log(`[EVENT chat] @${data.uniqueId}: ${data.comment}`);
  });

  try {
    const state = await connection.connect();
    console.log('Connected! Waiting 15 seconds for live events...');
    await new Promise(r => setTimeout(r, 15000));
    console.log('Disconnecting...');
    connection.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
}

testEvents();
