const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function testEndpoints() {
  const roomId = '7679407957632633622';
  const endpoints = [
    'https://webcast.tiktok.com/webcast/ranklist/audience/?aid=1988&room_id=' + roomId + '&anchor_id=7030929632657638405',
    'https://webcast.tiktok.com/webcast/im/fetch/?aid=1988&room_id=' + roomId,
    'https://webcast.tiktok.com/webcast/room/enter/?aid=1988&room_id=' + roomId
  ];

  for (const url of endpoints) {
    try {
      console.log('\n--- Fetching:', url);
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
          'Referer': 'https://www.tiktok.com/@karam.drame/live'
        }
      });
      console.log('Status:', res.status);
      const json = await res.json();
      console.log('Data sample:', JSON.stringify(json).substring(0, 300));
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

testEndpoints();
