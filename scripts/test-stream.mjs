import { TikTokLiveConnection } from 'tiktok-live-connector';

console.log('Connecting to TikTok Live @karam.drame...');
const conn = new TikTokLiveConnection('karam.drame', { processInitialData: true });

conn.connect().then(state => {
  console.log('Connected! Room ID:', state.roomId);
  console.log('Stats:', JSON.stringify(state.roomInfo?.data?.stats || {}));
  
  conn.on('roomUser', data => {
    console.log('[roomUser] total:', data.total, 'totalUser:', data.totalUser, 'anonymous:', data.anonymous);
  });

  conn.on('like', data => {
    console.log('[like] total:', data.total, 'totalLikeCount:', data.totalLikeCount, 'count:', data.count);
  });

  conn.on('social', data => {
    console.log('[social] displayType:', data.displayType, 'label:', data.label);
  });

  conn.on('share', data => {
    console.log('[share] detected:', JSON.stringify(data));
  });

  setTimeout(() => {
    console.log('Test completed successfully');
    process.exit(0);
  }, 12000);
}).catch(err => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
