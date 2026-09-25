const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });

  await page.goto('http://localhost:5175/');
  await page.waitForLoadState('networkidle');

  const outDir = '/home/jules/verification';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const screenshotPath = path.join(outDir, 'tiktok_dashboard_final2.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(`Screenshot saved to ${screenshotPath}`);

  await browser.close();
})();
