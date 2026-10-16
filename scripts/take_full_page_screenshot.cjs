const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.evaluateOnNewDocument(() => {
      sessionStorage.setItem('isUnlocked', 'true');
      localStorage.setItem('lumina_auth', 'true');
    });

    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));

    await page.screenshot({ path: 'public/production_full_page.png', fullPage: true });
    console.log("Full page screenshot saved!");
  } finally {
    await browser.close();
  }
})();
