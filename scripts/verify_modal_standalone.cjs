const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testModal() {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const launchOptions = {
        headless: 'new',
        args: ['--no-sandbox', '--disable-gpu']
    };
    if (fs.existsSync(chromePath)) launchOptions.executablePath = chromePath;

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });

    await page.evaluateOnNewDocument(() => {
        sessionStorage.setItem('isUnlocked', 'true');
    });

    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 4000));

    // Scroll to top just in case
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 500));

    // Click Cadences button
    const clickSuccess = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.innerText.includes('Cadences'));
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    });
    console.log('Clicked Cadences button:', clickSuccess);

    await new Promise(r => setTimeout(r, 1500));

    const artifactDir = 'C:\\Users\\RO2TK\\.gemini\\antigravity\\brain\\3ba121a6-dbe2-414e-bdc6-adb460423cf1';
    const modalPath = path.join(artifactDir, 'cadence_modal_standalone.png');
    await page.screenshot({ path: modalPath, fullPage: false });
    console.log('Modal saved to:', modalPath);

    await browser.close();
}

testModal().catch(e => {
    console.error(e);
    process.exit(1);
});
