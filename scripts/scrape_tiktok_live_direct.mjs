import puppeteer from 'puppeteer';

async function checkLiveOnTikTok() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Opening https://www.tiktok.com/@karam.drame/live ...');
  await page.goto('https://www.tiktok.com/@karam.drame/live', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  await new Promise(r => setTimeout(r, 6000));

  const data = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      title: document.title,
      textSample: text.slice(0, 1500)
    };
  });

  console.log('PAGE TITLE:', data.title);
  console.log('TEXT SAMPLE:\n', data.textSample);

  await page.screenshot({ path: 'C:/Users/RO2TK/.gemini/antigravity/brain/5f46e692-308f-4b39-a5fc-238b45e46b37/tiktok_live_screen.png' });
  console.log('Saved screenshot to tiktok_live_screen.png');

  await browser.close();
}

checkLiveOnTikTok().catch(err => {
  console.error(err);
  process.exit(1);
});
