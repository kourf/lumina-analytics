const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errorPromises = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const p = (async () => {
        const textParts = [];
        for (const arg of msg.args()) {
          try {
            const desc = await arg.evaluate(x => {
              if (x instanceof Error) return `ERROR: ${x.name}: ${x.message}\nSTACK: ${x.stack}`;
              if (x && x.componentStack) return `COMPONENT STACK: ${x.componentStack}`;
              return typeof x === 'object' ? JSON.stringify(x) : String(x);
            });
            textParts.push(desc);
          } catch (e) {
            textParts.push(`[eval failed: ${e.message}]`);
          }
        }
        return textParts.join(' | ');
      })();
      errorPromises.push(p);
    }
  });

  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => sessionStorage.setItem('isUnlocked', 'true'));
  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));

  const results = await Promise.all(errorPromises);
  console.log('--- RESULTATS DES ERREURS ---');
  results.forEach(r => console.log(r));

  await browser.close();
})();
