const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('console', msg => {
    errors.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  page.on('pageerror', err => {
    errors.push({
      type: 'pageerror',
      text: err.toString(),
      stack: err.stack
    });
  });

  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => sessionStorage.setItem('isUnlocked', 'true'));
  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  fs.writeFileSync('C:\\Users\\RO2TK\\.gemini\\antigravity\\brain\\3ba121a6-dbe2-414e-bdc6-adb460423cf1\\prod_console_errors.json', JSON.stringify(errors, null, 2));

  await browser.close();
  console.log('Saved errors to prod_console_errors.json');
})();
