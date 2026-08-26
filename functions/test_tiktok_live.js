const { TikTokLiveConnection } = require('tiktok-live-connector');

const tiktokUsername = "karam.drame";
const tiktokLiveConnection = new TikTokLiveConnection(tiktokUsername, {});

tiktokLiveConnection.fetchRoomInfo().then(roomInfo => {
    console.log("Full room info:", Object.keys(roomInfo || {}), roomInfo);
}).catch(err => {
    console.error("FAILED to get room info", err);
});
