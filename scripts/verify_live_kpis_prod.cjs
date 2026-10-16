const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log("🚀 Lancement de la vérification Puppeteer sur https://lumina-analytics-kd-2026.web.app/tiktok...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1100 });

    await page.evaluateOnNewDocument(() => {
      sessionStorage.setItem('isUnlocked', 'true');
      localStorage.setItem('lumina_auth', 'true');
      localStorage.setItem('theme', 'dark');
    });

    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', {
      waitUntil: 'networkidle2',
      timeout: 35000
    });

    // Laisser 4 secondes pour que Firestore et les WebSockets/listeners s'initialisent
    await new Promise(r => setTimeout(r, 4000));

    // Évaluation des KPIs
    const kpis = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div')).filter(d => {
        const text = d.innerText || '';
        return text.includes('DURÉE DU DIRECT') || 
               text.includes('AUDIENCE EN DIRECT') || 
               text.includes('AUDIENCE CUMULÉE') || 
               text.includes('LIKES DE SESSION') ||
               text.includes('PARTAGES DU LIVE');
      });

      const bodyText = document.body.innerText;
      
      const durationMatch = bodyText.match(/\d{2}:\d{2}:\d{2}/);
      const isLiveHubPresent = bodyText.includes('Hub Live Streaming');
      const isLiveBadgePresent = bodyText.includes('EN DIRECT');

      return {
        isLiveHubPresent,
        isLiveBadgePresent,
        duration: durationMatch ? durationMatch[0] : 'non trouvé',
        sampleSnippet: bodyText.substring(0, 1000)
      };
    });

    console.log("📊 KPIs extraits :", JSON.stringify(kpis, null, 2));

    // Capture d'écran de vérification
    const screenshotPath = 'C:\\Users\\RO2TK\\.gemini\\antigravity\\brain\\3ba121a6-dbe2-414e-bdc6-adb460423cf1\\production_verified_live_hub_fixed.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log("📸 Screenshot enregistré à :", screenshotPath);

    // Attendre 3 secondes de plus pour vérifier l'incrémentation du chronomètre
    await new Promise(r => setTimeout(r, 3000));
    const durationAfter3s = await page.evaluate(() => {
      const match = document.body.innerText.match(/\d{2}:\d{2}:\d{2}/);
      return match ? match[0] : null;
    });
    console.log(`⏱️ Chrono initial: ${kpis.duration} -> Après 3s: ${durationAfter3s}`);

  } catch (err) {
    console.error("❌ Erreur pendant le test :", err);
  } finally {
    await browser.close();
  }
})();
