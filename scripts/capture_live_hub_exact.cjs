const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });

    await page.evaluateOnNewDocument(() => {
      sessionStorage.setItem('isUnlocked', 'true');
      localStorage.setItem('lumina_auth', 'true');
    });

    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'networkidle2' });
    
    // Attendre que le composant TikTokDashboard soit pleinement monté
    await page.waitForSelector('#dashboard-content', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Trouver l'élément du Live Hub et capturer son screenshot précis
    const liveHubElement = await page.evaluateHandle(() => {
      const headers = Array.from(document.querySelectorAll('h2, h3'));
      const found = headers.find(h => h.innerText.includes('Hub Live Streaming'));
      return found ? found.closest('div.bg-\\[\\#0B0F19\\]') || found.parentElement.parentElement.parentElement : null;
    });

    if (liveHubElement) {
      await liveHubElement.screenshot({ path: 'public/exact_live_hub.png' });
      console.log("✅ Screenshot du Live Hub capturé avec succès dans public/exact_live_hub.png !");
    } else {
      console.log("Élément introuvable via selector, capture globale...");
      await page.screenshot({ path: 'public/exact_live_hub.png', fullPage: true });
    }
  } catch (err) {
    console.error("Erreur capture:", err);
  } finally {
    await browser.close();
  }
})();
