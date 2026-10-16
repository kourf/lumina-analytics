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
    await page.setViewport({ width: 1440, height: 1400 });

    await page.evaluateOnNewDocument(() => {
        sessionStorage.setItem('isUnlocked', 'true');
    });

    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForFunction(() => {
        return document.body.innerText.includes('Karam') && document.body.innerText.includes('Abonnés');
    }, { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 4000));

    const artifactDir = 'C:\\Users\\RO2TK\\.gemini\\antigravity\\brain\\3ba121a6-dbe2-414e-bdc6-adb460423cf1';

    // 1. Capture Header & Top KPI cards
    const screenTopPath = path.join(artifactDir, 'dashboard_kpi_cards_certifications.png');
    await page.screenshot({ path: screenTopPath, fullPage: false });
    console.log('Top screenshot saved to:', screenTopPath);

    // 2. Scroll to Strategic Content Analysis
    await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Analyse Stratégique'));
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 1500));
    const screenStrategicPath = path.join(artifactDir, 'dashboard_strategic_analysis_transparency.png');
    await page.screenshot({ path: screenStrategicPath, fullPage: false });
    console.log('Strategic screenshot saved to:', screenStrategicPath);

    // 3. Open Cadence & Quotas modal
    try {
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const cadenceBtn = btns.find(b => b.innerText.includes('Cadences') || b.innerText.includes('Infos'));
            if (cadenceBtn) cadenceBtn.click();
        });
        await new Promise(r => setTimeout(r, 1500));
        const modalPath = path.join(artifactDir, 'cadence_modal_certifications_complete.png');
        await page.screenshot({ path: modalPath, fullPage: false });
        console.log('Modal screenshot saved to:', modalPath);
    } catch (e) {
        console.error('Error opening modal:', e.message);
    }

    // Validation checks
    const validation = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
            hasApiV2Certain: text.includes('API v2 Certain') || text.includes('API v2'),
            hasProfilDirect: text.includes('Profil Direct') || text.includes('Profil TikTok'),
            has17100Likes: text.includes('17 100'),
            hasAuto30m: text.includes('Auto 30m') || text.includes('30 min'),
            hasInstant50ms: text.includes('< 50ms') || text.includes('50ms'),
            hasTransparenceStrategique: text.includes('Transparence des Données Stratégiques'),
            hasCertifieApiV2: text.includes('Certifié API v2'),
            hasHybrideApiProfil: text.includes('Hybride API+Profil')
        };
    });

    console.log('Production Verification Results:', JSON.stringify(validation, null, 2));

    await browser.close();
}

test().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
