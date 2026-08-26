const fs = require('fs');

let code = fs.readFileSync('index.js', 'utf8');

// Replace forceSyncTikTok logic
const forceSyncRegex = /    try \{\s*const \{ WebcastPushConnection \} = require\('tiktok-live-connector'\);\s*const connection = new WebcastPushConnection\('karam\.drame'\);\s*const roomInfo = await connection\.getRoomInfo\(\);\s*if \(roomInfo && roomInfo\.status === 2\) \{\s*isLive = true;\s*roomId = roomInfo\.id_str \|\| roomInfo\.roomId \|\| '';\s*currentViewers = roomInfo\.user_count \|\| roomInfo\.viewerCount \|\| null;\s*\}\s*\} catch\(e\) \{\s*console\.error\('Erreur tiktok-live-connector:', e\);\s*\}/;

const forceSyncReplacement = `    try {
      const { TikTokLiveConnection } = require('tiktok-live-connector');
      const connection = new TikTokLiveConnection('karam.drame', { processInitialData: false });
      const state = await connection.connect();
      const roomInfo = state.roomInfo;
      
      if (roomInfo && roomInfo.status === 2) {
        isLive = true;
        roomId = roomInfo.id_str || roomInfo.roomId || '';
        currentViewers = roomInfo.user_count || roomInfo.viewerCount || null;
      }
      connection.disconnect();
    } catch(e) {
      console.error('Erreur tiktok-live-connector:', e);
    }`;

code = code.replace(forceSyncRegex, forceSyncReplacement);

// Replace startLiveMonitor logic
// Find the initialization in startLiveMonitor
const startMonitorRegex = /const \{ WebcastPushConnection \} = require\('tiktok-live-connector'\);\s*let connection = new WebcastPushConnection\(tiktokUsername\);/;
const startMonitorReplacement = `const { TikTokLiveConnection } = require('tiktok-live-connector');
      let connection = new TikTokLiveConnection('karam.drame', { processInitialData: false });`;

code = code.replace(startMonitorRegex, startMonitorReplacement);

fs.writeFileSync('index.js', code);
console.log('Update complete');
