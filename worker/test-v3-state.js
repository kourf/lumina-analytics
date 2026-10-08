const { TikTokLiveConnection } = require('tiktok-live-connector');

const connection = new TikTokLiveConnection('karam.drame', {});

connection.connect().then(state => {
    console.info("title:", state.roomInfo?.data?.title);
    console.info("create_time:", state.roomInfo?.data?.create_time);
    console.info("stats:", state.roomInfo?.data?.stats);
    process.exit(0);
}).catch(err => {
    console.error("Failed to connect:", err.message);
    process.exit(1);
});
