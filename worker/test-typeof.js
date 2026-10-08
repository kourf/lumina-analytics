const { TikTokLiveConnection } = require('tiktok-live-connector');

const connection = new TikTokLiveConnection('karam.drame', {});

connection.connect().then(state => {
    const ct = state.roomInfo?.data?.create_time;
    console.info("create_time:", ct);
    console.info("typeof create_time:", typeof ct);
    process.exit(0);
}).catch(err => {
    console.error("Failed to connect:", err.message);
    process.exit(1);
});
