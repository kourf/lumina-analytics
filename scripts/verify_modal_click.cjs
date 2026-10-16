const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testModalOpen() {
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

    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'load', timeout: 40000 });
    await new Promise(r => setTimeout(r, 3000));

    // Find button by title or text
    const clicked = await page.evaluate(() => {
        const btn = document.querySelector('button[title*="délais"]') || 
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cadences') || b.textContent.includes('Infos'));
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    });

    console.log('Button clicked:', clicked);
    await new Promise(r => setTimeout(r, 1500));

    const artifactDir = 'C:\\Users\\RO2TK\\.gemini\\antigravity\\brain\\3ba121a6-dbe2-414e-bdc6-adb460423cf1';
    const modalPath = path.join(artifactDir, 'cadence_modal_standalone_verified.png');
    await page.screenshot({ path: modalPath, fullPage: false });
    console.log('Screenshot saved to:', modalPath);

    const hasModalTitle = await page.evaluate(() => {
        return document.body.innerText.includes('Tableau de Bord des Cadences & Quotas');
    });
    console.log('Modal is open in DOM:', hasModalTitle);

    await browser.close();
}

testModalOpen().catch(e => {
    console.error(e);
    process.exit(1);
});
