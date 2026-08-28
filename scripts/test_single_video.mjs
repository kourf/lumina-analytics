import fs from 'fs';

async function testVideoPage() {
  const videoId = '7674710003072257312';
  const url = 'https://www.tiktok.com/@karam.drame/video/' + videoId;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache'
    }
  });

  console.log('Video Page Status:', res.status);
  const html = await res.text();
  console.log('HTML size:', html.length);
  
  const idStr = '__UNIVERSAL_DATA_FOR_REHYDRATION__';
  const idx = html.indexOf(idStr);
  if (idx !== -1) {
    const tagClose = html.indexOf('>', idx);
    const endTag = html.indexOf('</script>', tagClose);
    const content = html.substring(tagClose + 1, endTag);
    const json = JSON.parse(content);
    const itemInfo = json.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
    console.log('ITEM_STRUCT found:', !!itemInfo);
    if (itemInfo) {
      console.log('VIDEO LIVE STATS:', {
        id: itemInfo.id,
        desc: itemInfo.desc,
        createTime: new Date(itemInfo.createTime * 1000).toISOString(),
        stats: itemInfo.stats,
        statsV2: itemInfo.statsV2,
        cover: itemInfo.video?.cover
      });
    }
  }
}

testVideoPage();
