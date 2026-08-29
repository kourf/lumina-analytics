const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function checkRoom() {
  const roomId = '7679407957632633622';
  console.log('Testing Room ID details for:', roomId);
  
  const endpoints = [
    'https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=' + roomId,
    'https://www.tiktok.com/api/live/detail/?aid=1988&roomID=' + roomId,
    'https://webcast.tiktok.com/webcast/room/check_alive/?aid=1988&room_ids=' + roomId
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
          'Referer': 'https://www.tiktok.com/@karam.drame'
        }
      });
      console.log(url, 'Status:', res.status);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        console.log('Data:', JSON.stringify(json).substring(0, 400));
      } catch {
        console.log('HTML preview:', text.substring(0, 300));
      }
    } catch (e) {
      console.error('Error fetching', url, e.message);
    }
  }
}

checkRoom();
