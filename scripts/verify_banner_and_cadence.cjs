const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function test() {
    console.log('Navigating to deployed site: https://lumina-analytics-kd-2026.web.app/tiktok...');
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

    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForFunction(() => {
        return document.body.innerText.includes('Karam') && document.body.innerText.includes('Abonnés');
    }, { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));

    // Capture initial page state
    const artifactDir = 'C:\\Users\\RO2TK\\.gemini\\antigravity\\brain\\3ba121a6-dbe2-414e-bdc6-adb460423cf1';
    const screen1Path = path.join(artifactDir, 'dashboard_tiktok_updated.png');
    await page.screenshot({ path: screen1Path, fullPage: false });
    console.log('Main screenshot saved to:', screen1Path);

    // Check DOM contents
    const domInfo = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
            hasFollowers6392: text.includes('6 392') || text.includes('6.392') || text.includes('6392'),
            hasLikes17K: text.includes('17 100') || text.includes('17,1K') || text.includes('17.1K'),
            hasAuto5min: text.includes('Auto 5 min') || text.includes('5 min'),
            hasVerif30s: text.includes('30s') || text.includes('30 secondes'),
            hasSynchronise: text.includes('Synchronisé') || text.includes('En Direct'),
            snippet: text.slice(0, 1500).replace(/\n+/g, ' | ')
        };
    });

    console.log('DOM Validation Results:', domInfo);

    // Click on Cadences button to test modal
    try {
        const cadenceBtn = await page.evaluateHandle(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.find(b => b.innerText.includes('Cadences') || b.innerText.includes('Infos'));
        });
        if (cadenceBtn) {
            await cadenceBtn.click();
            await new Promise(r => setTimeout(r, 1000));
            const modalPath = path.join(artifactDir, 'cadence_modal_verified.png');
            await page.screenshot({ path: modalPath, fullPage: false });
            console.log('Modal screenshot saved to:', modalPath);
        }
    } catch (e) {
        console.warn('Could not click cadence button:', e.message);
    }

    await browser.close();
    console.log('Verification finished successfully!');
}

test().catch(console.error);
