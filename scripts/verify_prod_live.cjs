const puppeteer = require('puppeteer');

(async () => {
  console.log("Démarrage du test de vérification sur https://lumina-analytics-kd-2026.web.app/tiktok...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));

    console.log("Navigation vers https://lumina-analytics-kd-2026.web.app/tiktok...");
    await page.evaluateOnNewDocument(() => {
      sessionStorage.setItem('isUnlocked', 'true');
      localStorage.setItem('lumina_auth', 'true');
    });

    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait 5 seconds for edge checker and Firestore to settle
    await new Promise(r => setTimeout(r, 5000));

    const pageContent = await page.evaluate(() => {
      const text = document.body.innerText;
      const liveBadge = document.querySelector('.live-badge, [class*="live"], [class*="badge"]') ? true : false;
      return {
        textSnippet: text.substring(0, 800),
        hasEnDirect: text.includes('EN DIRECT'),
        hasDirectTitle: text.includes('DURÉE DU DIRECT') || text.includes('AUDIENCE EN DIRECT'),
        hasSpectateurs: /spectateurs/i.test(text),
        hasHorsLigne: text.includes('Actuellement hors ligne')
      };
    });

    console.log("Résultat de l'analyse DOM sur la prod :", JSON.stringify(pageContent, null, 2));

    const edgeLogs = consoleLogs.filter(l => l.includes('[TikTokEdge]') || l.includes('LIVE') || l.includes('Firestore'));
    console.log("Logs pertinents du navigateur :", edgeLogs);

    if (pageContent.hasEnDirect) {
      console.log(">>> SUCCÈS : Le dashboard en production affiche bien 'EN DIRECT' !");
    } else {
      console.log(">>> ATTENTION : Le dashboard n'affiche pas encore 'EN DIRECT', statut hors ligne :", pageContent.hasHorsLigne);
    }
  } catch (err) {
    console.error("Erreur lors de la vérification :", err);
  } finally {
    await browser.close();
  }
})();
