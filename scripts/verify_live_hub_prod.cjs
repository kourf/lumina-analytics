const puppeteer = require('puppeteer');

(async () => {
  console.log("Démarrage du test de vérification du Live Hub sur https://lumina-analytics-kd-2026.web.app/tiktok...");
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

    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Attendre 3 secondes pour la synchronisation Firestore
    await new Promise(r => setTimeout(r, 3000));

    // Extraire les textes exacts des cartes Live Hub
    const data = await page.evaluate(() => {
      const liveCards = Array.from(document.querySelectorAll('div')).filter(d => 
        d.innerText && (
          d.innerText.includes('DURÉE DU DIRECT') || 
          d.innerText.includes('AUDIENCE CUMULÉE') ||
          d.innerText.includes('LIKES DE SESSION')
        )
      );

      const kpis = {};
      const allText = document.body.innerText;
      
      const mDuree = allText.match(/DURÉE DU DIRECT\s*\n\s*([0-9:]+)/i);
      if (mDuree) kpis.duree = mDuree[1];

      const mAudience = allText.match(/AUDIENCE EN DIRECT\s*\n\s*([0-9kM,]+)/i);
      if (mAudience) kpis.audienceActive = mAudience[1];

      const mCumule = allText.match(/AUDIENCE CUMULÉE\s*\n\s*([0-9kM, ]+)/i);
      if (mCumule) kpis.audienceCumulee = mCumule[1];

      const mLikes = allText.match(/LIKES DE SESSION\s*\n\s*([0-9kM, ]+)/i);
      if (mLikes) kpis.likes = mLikes[1];

      const mPartages = allText.match(/PARTAGES DU LIVE\s*\n\s*([0-9kM, ]+)/i);
      if (mPartages) kpis.partages = mPartages[1];

      const mAbonnes = allText.match(/ABONNÉS DU COMPTE\s*\n\s*([0-9kM, ]+)/i);
      if (mAbonnes) kpis.abonnes = mAbonnes[1];

      return {
        kpis,
        hasSessionBadge: allText.includes('SESSION TERMINÉE') || allText.includes('EN DIRECT'),
        snippet: allText.substring(0, 1500)
      };
    });

    console.log("=== KPIS DÉTECTÉS SUR LE SITE EN PRODUCTION ===");
    console.log(JSON.stringify(data.kpis, null, 2));
    console.log("Badge détecté:", data.hasSessionBadge);

    // Capture d'écran de vérification
    await page.screenshot({ path: 'public/production_verified_live_session.png', fullPage: false });
    console.log("Capture d'écran enregistrée dans public/production_verified_live_session.png");

  } catch (err) {
    console.error("Erreur test :", err);
  } finally {
    await browser.close();
  }
})();
