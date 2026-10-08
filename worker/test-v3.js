const { TikTokLiveConnection } = require('tiktok-live-connector');

const connection = new TikTokLiveConnection('karam.drame', {});

connection.connect().then(state => {
    console.info("Connected to TikTokLiveConnection!");
    console.info("room status:", state.roomInfo?.data?.status);
    console.info("isLive?", state.roomInfo?.data?.status === 2);
    process.exit(0);
}).catch(err => {
    console.error("Failed to connect:", err.message);
    process.exit(1);
});
