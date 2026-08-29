const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function inspectRoomRaw() {
  const roomId = '7679407957632633622';
  const url = 'https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=' + roomId;
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
      'Referer': 'https://www.tiktok.com/@karam.drame'
    }
  });

  const json = await res.json();
  const room = json.data || {};
  console.log('--- TOUS LES CHAMPS STATS DE LA ROOM ---');
  for (const key of Object.keys(room)) {
    if (key.includes('count') || key.includes('user') || key.includes('like') || key.includes('share') || key.includes('stat')) {
      console.log(key, ':', JSON.stringify(room[key]));
    }
  }
}

inspectRoomRaw();
