async function checkLiveNow() {
  console.log('1. Checking TikTok profile for @karam.drame...');
  try {
    const res = await fetch('https://www.tiktok.com/@karam.drame', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });

    const html = await res.text();
    console.log('HTML status:', res.status, 'HTML length:', html.length);

    const idx = html.indexOf('__UNIVERSAL_DATA_FOR_REHYDRATION__');
    let roomId = null;
    let userDetail = null;

    if (idx !== -1) {
      const tagClose = html.indexOf('>', idx);
      const endTag = html.indexOf('</script>', tagClose);
      try {
        const json = JSON.parse(html.substring(tagClose + 1, endTag));
        userDetail = json.__DEFAULT_SCOPE__?.['webapp.user-detail'];
        roomId = userDetail?.userInfo?.user?.roomId;
        console.log('UserDetail roomId:', roomId);
        console.log('Stats:', userDetail?.userInfo?.stats);
      } catch (e) {
        console.error('JSON parse error:', e.message);
      }
    }

    if (!roomId) {
      const m = html.match(/"roomId"\s*:\s*"?(\d+)"?/);
      if (m) roomId = m[1];
      console.log('Regex roomId:', roomId);
    }

    // Also check Cloudflare Edge live status
    console.log('2. Checking Cloudflare Edge worker...');
    const edgeRes = await fetch('https://lumina-tiktok-webhook.kouroufia15.workers.dev/live-status?username=karam.drame&_t=' + Date.now());
    const edgeJson = await edgeRes.json();
    console.log('Edge Live Status:', JSON.stringify(edgeJson, null, 2));

    // If roomId exists, query webcast room info
    const activeRoomId = roomId || edgeJson.data?.roomId;
    if (activeRoomId && activeRoomId !== '0') {
      console.log('3. Querying Webcast API for room:', activeRoomId);
      const roomRes = await fetch('https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=' + activeRoomId, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.tiktok.com/@karam.drame'
        }
      });
      const roomJson = await roomRes.json();
      console.log('Webcast Room Details:');
      console.log('Status:', roomJson.data?.status);
      console.log('Title:', roomJson.data?.title);
      console.log('Create time:', roomJson.data?.create_time, roomJson.data?.create_time ? new Date(roomJson.data.create_time * 1000).toISOString() : 'N/A');
      console.log('Finish time:', roomJson.data?.finish_time, roomJson.data?.finish_time ? new Date(roomJson.data.finish_time * 1000).toISOString() : 'N/A');
      console.log('User count (viewers):', roomJson.data?.user_count);
      console.log('Stats:', JSON.stringify(roomJson.data?.stats, null, 2));
    }
  } catch (err) {
    console.error('Error in checkLiveNow:', err);
  }
}
checkLiveNow();
