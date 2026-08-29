const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function inspectRoom() {
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
  const room = json.data;
  console.log('Room Title:', room?.title);
  console.log('Room Status:', room?.status);
  console.log('User Count (Viewers):', room?.user_count);
  console.log('Total User (Accumulated):', room?.total_user);
  console.log('Like Count:', room?.like_count);
  console.log('Owner Nickname:', room?.owner?.nickname);
  console.log('Owner Display ID:', room?.owner?.display_id);
  console.log('Owner Avatar:', room?.owner?.avatar_thumb?.url_list?.[0]);
  console.log('Cover:', room?.cover?.url_list?.[0]);
  console.log('Start Time:', room?.create_time ? new Date(room.create_time * 1000).toISOString() : 'N/A');
}

inspectRoom();
