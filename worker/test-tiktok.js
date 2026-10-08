const { WebcastPushConnection } = require('tiktok-live-connector/legacy');

const tiktokUsername = "karam.drame";
const connection = new WebcastPushConnection(tiktokUsername, {});

connection.connect().then(state => {
    console.info("roomInfo keys:", Object.keys(state.roomInfo || {}));
    console.info("create_time inside roomInfo:", state.roomInfo?.create_time);
    console.info("create_time inside roomInfo.data:", state.roomInfo?.data?.create_time);
    console.info("stats inside roomInfo:", state.roomInfo?.stats);
    console.info("stats inside roomInfo.data:", state.roomInfo?.data?.stats);
    process.exit(0);
}).catch(err => {
    console.error("Failed to connect", err);
    process.exit(1);
});
