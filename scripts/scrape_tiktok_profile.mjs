import fs from 'fs';

async function testScrape() {
  const res = await fetch('https://www.tiktok.com/@karam.drame', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache'
    }
  });

  const html = await res.text();
  console.log('HTML Status:', res.status, 'HTML Length:', html.length);

  const startMarker = '<script id=" __UNIVERSAL_DATA_FOR_REHYDRATION__\ type=\application/json\>';
 const endMarker = '</script>';
 const startIndex = html.indexOf(startMarker);
 if (startIndex !== -1) {
 const jsonStart = startIndex + startMarker.length;
 const jsonEnd = html.indexOf(endMarker, jsonStart);
 const rawJson = html.substring(jsonStart, jsonEnd);
 const json = JSON.parse(rawJson);
 fs.writeFileSync('tiktok_universal_data.json', JSON.stringify(json, null, 2), 'utf8');
 console.log('Saved tiktok_universal_data.json successfully!');
 
 const userDetail = json.__DEFAULT_SCOPE__?.['webapp.user-detail'];
 console.log('User stats:', userDetail?.userInfo?.stats);
 console.log('ItemList length:', userDetail?.itemList?.length);
 console.log('UserDetail keys:', Object.keys(userDetail || {}));
 } else {
 console.log('Start marker not found');
 }
}

testScrape();
