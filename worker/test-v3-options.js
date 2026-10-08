const { TikTokLiveConnection } = require('tiktok-live-connector');

const connection = new TikTokLiveConnection('karam.drame', {
    enableExtendedGiftInfo: true
});

connection.connect().then(state => {
    console.info("Connected to TikTokLiveConnection!");
    process.exit(0);
}).catch(err => {
    console.error("Failed to connect:", err.message);
    process.exit(1);
});
