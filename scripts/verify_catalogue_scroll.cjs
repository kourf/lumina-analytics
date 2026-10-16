const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const launchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,1100']
  };
  if (fs.existsSync(chromePath)) launchOptions.executablePath = chromePath;

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });

  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('isUnlocked', 'true');
    localStorage.setItem('theme', 'dark');
  });

  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(r => setTimeout(r, 5000));

  // Scroller directement vers l'élément catalogue
  await page.evaluate(() => {
    const el = document.querySelector('#catalogue-videos') || Array.from(document.querySelectorAll('h2, h3')).find(h => h.innerText && h.innerText.includes('Catalogue'));
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo({ top: 2600, behavior: 'instant' });
  });

  await new Promise(r => setTimeout(r, 1200));

  const artifactDir = path.resolve('C:/Users/RO2TK/.gemini/antigravity/brain/3ba121a6-dbe2-414e-bdc6-adb460423cf1');
  const cataloguePath = path.join(artifactDir, 'catalogue_videos_header_verified.png');
  await page.screenshot({ path: cataloguePath, fullPage: false });
  console.log('📸 Capture catalogue header enregistrée :', cataloguePath);

  await browser.close();
})();
