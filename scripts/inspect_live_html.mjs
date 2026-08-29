const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function inspectLiveHtml() {
  const res = await fetch('https://www.tiktok.com/@karam.drame/live', {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html',
      'Accept-Language': 'fr-FR,fr;q=0.9',
      'Cache-Control': 'no-cache'
    }
  });

  const html = await res.text();
  const idx = html.indexOf('__UNIVERSAL_DATA_FOR_REHYDRATION__');
  if (idx !== -1) {
    const tagClose = html.indexOf('>', idx);
    const endTag = html.indexOf('</script>', tagClose);
    const json = JSON.parse(html.substring(tagClose + 1, endTag));
    const defaultScope = json.__DEFAULT_SCOPE__;
    console.log('Scopes on /live page:', Object.keys(defaultScope || {}));
    
    // Check if there are stats inside any scope
    for (const key of Object.keys(defaultScope || {})) {
      if (key.includes('live') || key.includes('room') || key.includes('video')) {
        console.log('Found scope:', key);
        console.log(JSON.stringify(defaultScope[key]).substring(0, 400));
      }
    }
  }
}

inspectLiveHtml();
