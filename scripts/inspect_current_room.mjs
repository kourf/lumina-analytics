async function main() {
  const res = await fetch('https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=7691767893498907414', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.tiktok.com/@karam.drame'
    }
  });
  const data = await res.json();
  console.log('Room data:', JSON.stringify({
    status: data.data?.status,
    owner: data.data?.owner?.display_id,
    title: data.data?.title,
    user_count: data.data?.user_count,
    create_time: data.data?.create_time,
    finish_time: data.data?.finish_time,
    stats: data.data?.stats,
    live_room_mode: data.data?.live_room_mode,
    stream_url: data.data?.stream_url ? 'PRESENT' : 'NONE'
  }, null, 2));
}

main();
