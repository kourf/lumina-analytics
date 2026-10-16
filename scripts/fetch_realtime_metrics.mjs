import { TikTokLiveConnection } from 'tiktok-live-connector';

async function main() {
  const username = 'karam.drame';
  console.log(`Connecting to TikTok Live for @${username}...`);

  const connection = new TikTokLiveConnection(username, {
    processInitialData: true,
    fetchRoomInfoOnConnect: true,
    enableExtendedGiftInfo: true
  });

  let metrics = {
    connected: false,
    roomId: null,
    title: '',
    create_time: null,
    viewerCount: 0,
    totalLikeCount: 0,
    totalUser: 0,
    topViewers: []
  };

  try {
    const state = await connection.connect();
    metrics.connected = true;
    metrics.roomId = state.roomId;
    metrics.roomInfo = state.roomInfo;
    console.log(`Successfully connected! Room ID: ${state.roomId}`);
    if (state.roomInfo) {
      console.log("Room title:", state.roomInfo.title);
      console.log("Create time:", state.roomInfo.create_time);
      console.log("User count:", state.roomInfo.user_count);
      console.log("Stats:", JSON.stringify(state.roomInfo.stats));
    }
  } catch (err) {
    console.error("Connection failed:", err.message);
  }

  connection.on('roomUser', (data) => {
    console.log("[roomUser event] viewerCount:", data.viewerCount);
    metrics.viewerCount = data.viewerCount;
  });

  connection.on('like', (data) => {
    const tot = data.totalLikeCount || data.total;
    console.log("[like event] totalLikeCount:", tot, "likeCount:", data.likeCount);
    if (tot) metrics.totalLikeCount = Math.max(metrics.totalLikeCount, tot);
  });

  connection.on('chat', (data) => {
    console.log(`[chat] ${data.nickname}: ${data.comment}`);
  });

  // Écouter pendant 12 secondes
  await new Promise(r => setTimeout(r, 12000));
  console.log("\nFinal captured metrics:", JSON.stringify(metrics, null, 2));

  try {
    connection.disconnect();
  } catch {}
  process.exit(0);
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
