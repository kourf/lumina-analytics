const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const block = `    // --- CHECK LIVE STATUS VIA TIKTOK LIVE CONNECTOR ---
    let isLive = false;
    let roomId = null;
    let currentViewers = null;
    
    try {
      const { WebcastPushConnection } = require('tiktok-live-connector');
      const connection = new WebcastPushConnection('karam.drame');
      const roomInfo = await connection.getRoomInfo();
      
      if (roomInfo && roomInfo.status === 2) {
        isLive = true;
        roomId = roomInfo.id_str || roomInfo.roomId || '';
        currentViewers = roomInfo.user_count || roomInfo.viewerCount || null;
      }
    } catch(e) {
      console.error('Erreur tiktok-live-connector:', e);
    }`;

code = code.replace('const existingData = docSnap.data().tiktokLiveAPI || {};', block + '\n    const existingData = docSnap.data().tiktokLiveAPI || {};');
fs.writeFileSync('index.js', code);
