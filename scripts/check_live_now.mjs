const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function checkLive() {
  console.log('--- 1. Vérification URL @karam.drame/live ---');
  try {
    const res = await fetch('https://www.tiktok.com/@karam.drame/live', {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      }
    });

    console.log('Live URL Status:', res.status);
    const html = await res.text();
    console.log('HTML length:', html.length);
    
    // Check signs of live
    const hasRoomId = html.includes('roomId') || html.includes('room_id');
    const hasLiveRoom = html.includes('webapp.live-detail') || html.includes('liveRoom');
    const hasOffline = html.includes('offline') || html.includes('room_status') || html.includes('isOffline');
    
    console.log('Contains roomId/room_id:', hasRoomId);
    console.log('Contains live-detail/liveRoom:', hasLiveRoom);
    
    const idx = html.indexOf('__UNIVERSAL_DATA_FOR_REHYDRATION__');
    if (idx !== -1) {
      const tagClose = html.indexOf('>', idx);
      const endTag = html.indexOf('</script>', tagClose);
      const json = JSON.parse(html.substring(tagClose + 1, endTag));
      const defaultScope = json.__DEFAULT_SCOPE__;
      console.log('Scopes in /live:', Object.keys(defaultScope || {}));
      
      const liveDetail = defaultScope?.['webapp.live-detail'];
      if (liveDetail) {
        console.log('Live detail keys:', Object.keys(liveDetail));
        console.log('Live Room Info:', JSON.stringify(liveDetail.liveRoomInfo || liveDetail.roomInfo || liveDetail).substring(0, 500));
      }
    }
  } catch (e) {
    console.error('Erreur checkLive URL:', e.message);
  }

  console.log('\n--- 2. Vérification Profil @karam.drame ---');
  try {
    const res2 = await fetch('https://www.tiktok.com/@karam.drame', {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      }
    });
    const html2 = await res2.text();
    const idx2 = html2.indexOf('__UNIVERSAL_DATA_FOR_REHYDRATION__');
    if (idx2 !== -1) {
      const tagClose = html2.indexOf('>', idx2);
      const endTag = html2.indexOf('</script>', tagClose);
      const json2 = JSON.parse(html2.substring(tagClose + 1, endTag));
      const userDetail = json2.__DEFAULT_SCOPE__?.['webapp.user-detail'];
      const userInfo = userDetail?.userInfo?.user;
      console.log('User status field:', userInfo?.status);
      console.log('User roomId field:', userInfo?.roomId);
      console.log('User secUid:', userInfo?.secUid);
      console.log('User liveInfo:', JSON.stringify(userInfo?.liveInfo || {}));
    }
  } catch (e) {
    console.error('Erreur checkProfil URL:', e.message);
  }
}

checkLive();
