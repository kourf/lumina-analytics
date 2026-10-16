const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const client = await page.target().createCDPSession();
  await client.send('Runtime.enable');
  client.on('Runtime.exceptionThrown', (params) => {
    console.log('--- CDP EXCEPTION THROWN ---');
    console.log(params.exceptionDetails.text);
    if (params.exceptionDetails.exception) {
      console.log('Description:', params.exceptionDetails.exception.description);
    }
    if (params.exceptionDetails.stackTrace) {
      console.log('CallFrames:');
      params.exceptionDetails.stackTrace.callFrames.forEach(f => {
        console.log(`  at ${f.functionName} (${f.url}:${f.lineNumber}:${f.columnNumber})`);
      });
    }
  });

  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => sessionStorage.setItem('isUnlocked', 'true'));
  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  await browser.close();
})();
