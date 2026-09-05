import puppeteer from 'puppeteer';

async function main() {
  console.log('Launching browser to check https://lumina-analytics-kd-2026.web.app/tiktok...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setCacheEnabled(false);
    
    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(r => setTimeout(r, 4000));

    const textContent = await page.evaluate(() => document.body.innerText);
    const hasLiveBadge = textContent.includes('EN LIVE SUR TIKTOK') || textContent.includes('LIVE NOW');
    const hasHorsLigne = textContent.includes('HORS LIGNE') || textContent.includes('OFFLINE');

    console.log('--- PAGE TEXT INSPECTION ---');
    console.log('Contains EN LIVE / LIVE NOW badge:', hasLiveBadge);
    console.log('Contains HORS LIGNE / OFFLINE:', hasHorsLigne);

    const screenshotPath = 'C:\\Users\\RO2TK\\.gemini\\antigravity\\brain\\e615edbf-4eb6-46b7-80f9-100c9bbe037d\\deployed_verified.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Screenshot saved to:', screenshotPath);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Error verifying deployed site:', err);
  process.exit(1);
});
