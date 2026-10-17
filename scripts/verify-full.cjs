const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  // Unlock PIN screen automatically in sessionStorage
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('isUnlocked', 'true');
  });

  console.log('Navigating to live production site...');
  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'networkidle2', timeout: 35000 });
  await new Promise(r => setTimeout(r, 4500));

  // Screenshot of Retention Curve
  console.log('Scrolling to Courbe de Rétention du Live...');
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3'));
    const h = headings.find(el => el.textContent.includes('Courbe de Rétention'));
    if (h) h.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'C:/Users/RO2TK/.gemini/antigravity/brain/a7d73871-3d32-4d39-94ec-b1f731786c52/verified-retention-curve.png' });
  console.log('Saved verified-retention-curve.png');

  // Screenshot of Competitor Section (Head-to-head + Matrix)
  console.log('Scrolling to Veille Concurrentielle...');
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2, h3'));
    const h = headings.find(el => el.textContent.includes('Veille Concurrentielle'));
    if (h) h.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'C:/Users/RO2TK/.gemini/antigravity/brain/a7d73871-3d32-4d39-94ec-b1f731786c52/verified-competitor-section.png' });
  console.log('Saved verified-competitor-section.png');

  // Test direct addition of a competitor via input without modal
  console.log('Testing direct addition of competitor @inuka...');
  const inputSelector = 'input[placeholder*="devtrotter"]';
  await page.waitForSelector(inputSelector);
  await page.type(inputSelector, 'https://www.tiktok.com/@tiktokcreators');
  await page.click('button[type="submit"]');

  // Wait for direct addition (no modal should appear, competitor should appear in list)
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'C:/Users/RO2TK/.gemini/antigravity/brain/a7d73871-3d32-4d39-94ec-b1f731786c52/verified-competitor-after-add.png' });
  console.log('Saved verified-competitor-after-add.png');

  // Mobile viewport test (iPhone 14: 390x844)
  console.log('Testing mobile viewport...');
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.evaluate(() => {
    const el = document.querySelector('input[placeholder*="devtrotter"]');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'C:/Users/RO2TK/.gemini/antigravity/brain/a7d73871-3d32-4d39-94ec-b1f731786c52/verified-mobile-competitor.png' });
  console.log('Saved verified-mobile-competitor.png');

  await browser.close();
  console.log('All verification complete!');
})();
