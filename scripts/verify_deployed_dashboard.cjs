const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function test() {
    console.log('Navigating to deployed dashboard https://lumina-analytics-kd-2026.web.app/tiktok...');
    const outputPath = path.resolve('public', 'dashboard_verified.png');
    
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const launchOptions = {
        headless: 'new',
        args: ['--no-sandbox', '--disable-gpu']
    };
    if (fs.existsSync(chromePath)) launchOptions.executablePath = chromePath;

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1080 });

    // Pre-set session storage before navigation
    await page.evaluateOnNewDocument(() => {
        sessionStorage.setItem('isUnlocked', 'true');
    });

    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for the lazy component and Firebase data to resolve
    try {
        await page.waitForFunction(() => document.body.innerText.includes('DURÉE DU DIRECT') || document.body.innerText.includes('Hub Live Streaming'), { timeout: 15000 });
        console.log('Hub Live Streaming detected in DOM!');
    } catch (e) {
        console.warn('Timeout waiting for live hub text:', e.message);
    }
    await new Promise(r => setTimeout(r, 4000));

    // Extract live hub stats from DOM
    const liveStats = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
            title: document.title,
            snippet: text.slice(0, 1500).replace(/\n+/g, ' | ')
        };
    });
    console.log('Page Title:', liveStats.title);
    console.log('Text Snippet:', liveStats.snippet);

    await page.screenshot({ path: outputPath, fullPage: false });
    console.log('Screenshot saved to:', outputPath);

    await browser.close();
}

test().catch(console.error);
