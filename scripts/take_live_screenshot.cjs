const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });

    await page.evaluateOnNewDocument(() => {
      sessionStorage.setItem('isUnlocked', 'true');
      localStorage.setItem('lumina_auth', 'true');
    });

    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    // Scroll to the Live Hub
    await page.evaluate(() => {
      const liveHub = Array.from(document.querySelectorAll('h2, h3')).find(el => el.innerText.includes('Hub Live Streaming'));
      if (liveHub) {
        liveHub.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });

    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: 'public/production_live_hub_view.png' });
    console.log("Screenshot taken!");
  } finally {
    await browser.close();
  }
})();
