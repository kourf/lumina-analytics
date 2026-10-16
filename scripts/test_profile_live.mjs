const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function check() {
  const res = await fetch('https://www.tiktok.com/@karam.drame', {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    }
  });
  const html = await res.text();
  const idx = html.indexOf('__UNIVERSAL_DATA_FOR_REHYDRATION__');
  if (idx !== -1) {
    const tagClose = html.indexOf('>', idx);
    const endTag = html.indexOf('</script>', tagClose);
    const json = JSON.parse(html.substring(tagClose + 1, endTag));
    const userInfo = json.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.user;
    console.log('User status:', {
      uniqueId: userInfo?.uniqueId,
      roomId: userInfo?.roomId,
      roomIdType: typeof userInfo?.roomId
    });
  } else {
    console.log('Universal data not found. Checking regex...');
    const m = html.match(/"roomId":"?(\d+)"?/);
    console.log('Regex roomId:', m ? m[1] : 'none');
  }
}

check();
