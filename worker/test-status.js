const { WebcastPushConnection } = require('tiktok-live-connector/legacy');

const connection = new WebcastPushConnection('karam.drame', {});

connection.connect().then(state => {
    console.info("room status:", state.roomInfo?.data?.status);
    console.info("isLive?", state.roomInfo?.data?.status === 2);
    process.exit(0);
}).catch(err => {
    console.error("Failed to connect:", err.message);
    process.exit(1);
});
