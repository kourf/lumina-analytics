const { TikTokLiveConnection } = require('tiktok-live-connector');

const connection = new TikTokLiveConnection('karam.drame', {});

connection.connect().then(state => {
    console.info("roomId:", state.roomId);
    process.exit(0);
}).catch(err => {
    console.error("Failed to connect:", err.message);
    process.exit(1);
});
