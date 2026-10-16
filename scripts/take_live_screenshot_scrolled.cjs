const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1100 });

    await page.evaluateOnNewDocument(() => {
      sessionStorage.setItem('isUnlocked', 'true');
      localStorage.setItem('lumina_auth', 'true');
    });

    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));

    await page.evaluate(() => {
      window.scrollTo(0, 1600);
    });

    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: 'public/production_live_hub_scrolled.png' });
    console.log("Screenshot taken at 1600px!");
  } finally {
    await browser.close();
  }
})();
