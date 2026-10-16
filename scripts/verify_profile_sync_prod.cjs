const puppeteer = require('puppeteer');
const fs = require('fs');

async function verify() {
  console.log('Testing live production at https://lumina-analytics-kd-2026.web.app/tiktok...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const launchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  };
  if (fs.existsSync(chromePath)) launchOptions.executablePath = chromePath;

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1080 });

  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('isUnlocked', 'true');
    localStorage.setItem('lumina_auth', 'true');
  });

  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  console.log('1. Evaluating initial page metrics...');
  const initialMetrics = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      headerFollowers: text.match(/(\d[\d\s ]*)\s*Abonnés/i)?.[1]?.trim(),
      headerLikes: text.match(/([\d,]+k?)\s*Likes/i)?.[1]?.trim(),
      syncBadge: text.match(/Synchronisé[^\n]*/i)?.[0],
      kpiCardAbonnes: text.match(/ABONNÉS[\s\S]{1,60}/i)?.[0]?.replace(/\n+/g, ' | '),
      kpiCardLikes: text.match(/LIKES[\s\S]{1,60}/i)?.[0]?.replace(/\n+/g, ' | '),
    };
  });
  console.log('Initial Metrics:', JSON.stringify(initialMetrics, null, 2));

  console.log('2. Clicking Actualiser button to test manual refresh...');
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const refreshBtn = buttons.find(b => b.innerText.includes('Actualiser'));
    if (refreshBtn) {
      refreshBtn.click();
      return true;
    }
    return false;
  });
  console.log('Actualiser button clicked:', clicked);

  await new Promise(r => setTimeout(r, 3500));

  const postRefreshMetrics = await page.evaluate(() => {
    const text = document.body.innerText;
    const notification = text.match(/Synchronisation réussie[^\n]*/i)?.[0];
    return {
      notification,
      headerFollowers: text.match(/(\d[\d\s ]*)\s*Abonnés/i)?.[1]?.trim(),
      headerLikes: text.match(/([\d,]+k?)\s*Likes/i)?.[1]?.trim(),
      syncBadge: text.match(/Synchronisé[^\n]*/i)?.[0],
      kpiCardAbonnes: text.match(/ABONNÉS[\s\S]{1,60}/i)?.[0]?.replace(/\n+/g, ' | '),
      kpiCardLikes: text.match(/LIKES[\s\S]{1,60}/i)?.[0]?.replace(/\n+/g, ' | '),
    };
  });
  console.log('Post Refresh Metrics:', JSON.stringify(postRefreshMetrics, null, 2));

  const ssPath = 'C:/Users/RO2TK/.gemini/antigravity/brain/3ba121a6-dbe2-414e-bdc6-adb460423cf1/production_verified_profile_sync.png';
  await page.screenshot({ path: ssPath, fullPage: false });
  console.log('✅ Screenshot saved to:', ssPath);

  await browser.close();
}

verify().catch(console.error);
