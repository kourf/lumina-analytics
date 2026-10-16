import puppeteer from 'puppeteer';

async function diagnose() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('Error') || text.includes('error') || text.includes('ErrorBoundary')) {
      console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]`, text);
    }
  });

  page.on('pageerror', err => {
    console.error(`[BROWSER PAGEERROR]`, err.message, err.stack);
  });

  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('isUnlocked', 'true');
  });

  console.log('Navigating to https://lumina-analytics-kd-2026.web.app/tiktok ...');
  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: 'C:/Users/RO2TK/.gemini/antigravity/brain/5f46e692-308f-4b39-a5fc-238b45e46b37/tiktok_page_now.png', fullPage: true });
  console.log('Screenshot saved to tiktok_page_now.png');

  const text = await page.evaluate(() => {
    return document.body.innerText;
  });

  console.log('--- Page loaded, checking for ErrorBoundary text ---');
  if (text.includes("Le direct est en cours d'analyse en arrière-plan")) {
    console.log("FOUND: 'Le direct est en cours d\\'analyse en arrière-plan' is present!");
  } else {
    console.log("NOT FOUND: 'Le direct est en cours d\\'analyse en arrière-plan' is NOT present!");
  }

  await browser.close();
}

diagnose().catch(err => {
  console.error('Fatal diagnosis error:', err);
  process.exit(1);
});
