const puppeteer = require('puppeteer');

(async () => {
  console.log("Test de résistance au rafraîchissement (F5) sur https://lumina-analytics-kd-2026.web.app/tiktok...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.evaluateOnNewDocument(() => {
      sessionStorage.setItem('isUnlocked', 'true');
      localStorage.setItem('lumina_auth', 'true');
    });

    await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    for (let i = 1; i <= 3; i++) {
      console.log(`\n--- Test F5 (Rafraîchissement #${i}) ---`);
      await page.reload({ waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1500));

      const res = await page.evaluate(() => {
        const text = document.body.innerText;
        const mDuree = text.match(/DURÉE DU DIRECT\s*\n\s*([0-9:]+)/i);
        const mCumule = text.match(/AUDIENCE CUMULÉE\s*\n\s*([0-9kM, ]+)/i);
        const mLikes = text.match(/LIKES DE SESSION\s*\n\s*([0-9kM, ]+)/i);

        return {
          duree: mDuree ? mDuree[1] : 'NOT_FOUND',
          cumule: mCumule ? mCumule[1] : 'NOT_FOUND',
          likes: mLikes ? mLikes[1] : 'NOT_FOUND'
        };
      });

      console.log(`Résultats après F5 #${i}:`, res);
      if (res.duree === '00:00:00' || res.cumule === '0' || res.likes === '0') {
        console.error(`❌ ÉCHEC : Un KPI a clignoté à zéro lors du F5 #${i} !`);
      } else {
        console.log(`✅ SUCCÈS : Tous les KPIs sont stables et préservés lors du F5 #${i} !`);
      }
    }
  } catch (e) {
    console.error("Erreur test F5:", e);
  } finally {
    await browser.close();
  }
})();
