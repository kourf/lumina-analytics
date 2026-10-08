const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

fetch('https://www.tiktok.com/@karam.drame', { headers: { 'User-Agent': USER_AGENT } })
.then(res => res.text())
.then(html => {
    let roomId = html.match(/"roomId"\s*:\s*"?(\d+)"?/);
    if(roomId && roomId[1]) {
        fetch('https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=' + roomId[1], { headers: { 'User-Agent': USER_AGENT } })
        .then(res => res.json())
        .then(json => {
             console.log("Room payload:", Object.keys(json.data));
             console.log("Stats:", json.data.stats);
             console.log("Create Time:", json.data.create_time);
        });
    } else { console.log('no room id'); }
});
