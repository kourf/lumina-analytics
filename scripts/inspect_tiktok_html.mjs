import fs from 'fs';

async function inspectScripts() {
  const res = await fetch('https://www.tiktok.com/@karam.drame', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache'
    }
  });

  const html = await res.text();
  fs.writeFileSync('tiktok_page.html', html, 'utf8');
  console.log('Saved tiktok_page.html, size:', html.length);

  // Find all script tags with id
  const matches = [...html.matchAll(/<script\s+([^>]*?)>/gi)];
  console.log('Total script tags:', matches.length);
  matches.forEach((m, idx) => {
    if (m[1].includes('id=') || m[1].includes('json')) {
      console.log('Script ' + idx + ':', m[1]);
    }
  });
}

inspectScripts();
