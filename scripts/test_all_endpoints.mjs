const roomId = '7696214325131741974';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function testEndpoint(name, url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Referer': 'https://www.tiktok.com/@karam.drame/live'
      }
    });
    console.log(`\n=== [${name}] HTTP ${res.status} ===`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2).slice(0, 2000));
    return data;
  } catch (err) {
    console.error(`Error for [${name}]:`, err.message);
  }
}

async function main() {
  await testEndpoint('webcast_8311', `https://webcast.tiktok.com/webcast/room/info/?aid=8311&room_id=${roomId}`);
  await testEndpoint('webcast_1988', `https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=${roomId}`);
  await testEndpoint('live_detail_1988', `https://www.tiktok.com/api/live/detail/?aid=1988&roomID=${roomId}`);
  await testEndpoint('check_alive', `https://webcast.tiktok.com/webcast/room/check_alive/?aid=1988&room_ids=${roomId}`);
}

main();
