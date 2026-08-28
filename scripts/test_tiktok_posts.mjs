import fs from 'fs';

async function fetchPosts() {
  const secUid = 'MS4wLjABAAAAfHus2HWjFMzC67ZxOmIYL0-O-mUknmGCMBGV_sPqnR6VEXoHooXgl2ElIyTb4rKl';
  const url = 'https://www.tiktok.com/api/post/item_list/?aid=1988&app_language=fr-FR&app_name=tiktok_web&count=35&secUid=' + secUid + '&cursor=0';
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.tiktok.com/@karam.drame'
    }
  });

  console.log('Post API Status:', res.status);
  const data = await res.json();
  console.log('API keys:', Object.keys(data));
  console.log('statusCode:', data.statusCode, 'hasMore:', data.hasMore);
  if (data.itemList) {
    console.log('Found itemList count:', data.itemList.length);
    console.log('First video sample:', {
      id: data.itemList[0].id,
      desc: data.itemList[0].desc,
      stats: data.itemList[0].stats,
      createTime: data.itemList[0].createTime
    });
    fs.writeFileSync('tiktok_web_posts.json', JSON.stringify(data, null, 2), 'utf8');
  }
}

fetchPosts();
