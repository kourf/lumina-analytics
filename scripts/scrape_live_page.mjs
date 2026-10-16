import puppeteer from 'puppeteer';

async function scrapeLivePage() {
  console.log("Scraping https://www.tiktok.com/@karam.drame/live...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  try {
    await page.goto('https://www.tiktok.com/@karam.drame/live', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(r => setTimeout(r, 5000));

    const data = await page.evaluate(() => {
      const text = document.body.innerText;
      // Extract SIGI_STATE or __UNIVERSAL_DATA_FOR_REHYDRATION__
      const sigiScript = document.getElementById('SIGI_STATE') || document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
      let sigi = null;
      if (sigiScript) {
        try {
          sigi = JSON.parse(sigiScript.textContent);
        } catch {}
      }

      // Look for like elements or numbers
      const likeElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const t = (el.innerText || '').trim();
        return t.includes('J’aime') || t.includes('j\'aime') || t.includes('Likes') || t.includes('likes');
      }).map(el => el.innerText.slice(0, 100));

      return {
        title: document.title,
        textExcerpt: text.slice(0, 2000),
        likeElements: likeElements.slice(0, 5),
        hasSigi: Boolean(sigi)
      };
    });

    console.log("Data extracted from TikTok live page:", JSON.stringify(data, null, 2));

    await page.screenshot({ path: 'C:/Users/RO2TK/.gemini/antigravity/brain/3ba121a6-dbe2-414e-bdc6-adb460423cf1/tiktok_live_actual_page.png' });
  } catch (e) {
    console.error("Scrape error:", e.message);
  } finally {
    await browser.close();
  }
}

scrapeLivePage();
