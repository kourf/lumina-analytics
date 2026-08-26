const cheerio = require('cheerio');
async function test() {
  const url = 'https://www.tiktok.com/@karam.drame';
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    }
  });
  const html = await response.text();
  const $ = cheerio.load(html);
  const scriptContent = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
  if(!scriptContent) { return; }
  const parsed = JSON.parse(scriptContent);
  const user = parsed.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.user;
  console.log(JSON.stringify(user, null, 2));
}
test();
