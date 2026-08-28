async function checkYouTubeLive() {
  console.log('Checking YouTube Live status for @karamdrm...');
  try {
    const res = await fetch('https://www.youtube.com/@karamdrm/live', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });

    const html = await res.text();
    const isLive = html.includes('" isLive\:true') || html.includes('\style\:\LIVE\');
 console.log('YouTube Live detected:', isLive);
 } catch (e) {
 console.error('Erreur detection YT Live:', e.message);
 }
}

checkYouTubeLive();
