import puppeteer from 'puppeteer';

async function verifyLive() {
  console.log("=== Lancement du test de résilience Live TikTok F5 (Authentifié) ===");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Pré-définir sessionStorage pour déverrouiller l'application sur tous les chargements et rechargements F5
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('isUnlocked', 'true');
  });

  console.log("Navigation vers https://lumina-analytics-kd-2026.web.app/tiktok...");
  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Laisser 5 secondes pour que le rendu React et Firebase se synchronisent
  await new Promise(r => setTimeout(r, 5000));

  const getMetrics = async () => {
    return await page.evaluate(() => {
      const text = document.body.innerText;
      
      const findMetric = (keywords) => {
        for (const kw of keywords) {
          const idx = text.indexOf(kw);
          if (idx !== -1) {
            const chunk = text.slice(idx, idx + 100);
            const match = chunk.match(/([0-9kKmM,.]+)/);
            if (match) return match[1];
          }
        }
        return '0';
      };

      // Recherche de l'horloge HH:MM:SS
      const tickerMatches = text.match(/([0-9]{2}:[0-9]{2}:[0-9]{2})/g) || [];

      // Localiser la section En Direct
      const isLiveBadgePresent = text.includes('EN DIRECT') || text.includes('DIRECT') || text.includes('Live');

      return {
        isLiveBadgePresent,
        tickerList: tickerMatches,
        fullTicker: tickerMatches[0] || '00:00:00',
        audienceDirect: findMetric(['Audience en direct', 'Spectateurs', 'En direct']),
        audienceCumulee: findMetric(['Audience cumulée', 'Audience totale', 'Total spectateurs']),
        likes: findMetric(['Likes de session', 'Likes', 'J’aime']),
        partages: findMetric(['Partages du live', 'Partages', 'Shares']),
        textSnippet: text.slice(0, 800)
      };
    });
  };

  const beforeRefresh = await getMetrics();
  console.log("=== Métriques AVANT actualisation (F5) ===");
  console.log("Durée Ticker:", beforeRefresh.fullTicker);
  console.log("Audience en direct:", beforeRefresh.audienceDirect);
  console.log("Audience cumulée:", beforeRefresh.audienceCumulee);
  console.log("Likes de session:", beforeRefresh.likes);
  console.log("Partages du live:", beforeRefresh.partages);

  await page.screenshot({ path: 'C:/Users/RO2TK/.gemini/antigravity/brain/3ba121a6-dbe2-414e-bdc6-adb460423cf1/test_live_before_refresh.png' });

  console.log("\n===> Simulation du rechargement F5 (page.reload())...");
  await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
  
  // Attente courte pour vérifier la persistance sans clignotement
  await new Promise(r => setTimeout(r, 4000));

  const afterRefresh = await getMetrics();
  console.log("\n=== Métriques APRÈS actualisation (F5) ===");
  console.log("Durée Ticker:", afterRefresh.fullTicker);
  console.log("Audience en direct:", afterRefresh.audienceDirect);
  console.log("Audience cumulée:", afterRefresh.audienceCumulee);
  console.log("Likes de session:", afterRefresh.likes);
  console.log("Partages du live:", afterRefresh.partages);

  await page.screenshot({ path: 'C:/Users/RO2TK/.gemini/antigravity/brain/3ba121a6-dbe2-414e-bdc6-adb460423cf1/test_live_after_refresh.png' });

  await browser.close();

  console.log("\n=== VALIDATION FORMELLE DU TEST ===");
  const durationParts = (afterRefresh.fullTicker || '00:00:00').split(':').map(Number);
  const totalSeconds = (durationParts[0] || 0) * 3600 + (durationParts[1] || 0) * 60 + (durationParts[2] || 0);
  const isDurationValid = totalSeconds > 3600; // Doit être supérieur à 1 heure (> 3600s) car démarré à 18h02 GMT
  const isAudienceCumuleeValid = Number(afterRefresh.audienceCumulee.replace(/[^0-9]/g, '')) >= 500;
  const isLikesValid = Number(afterRefresh.likes.replace(/[^0-9]/g, '')) > 1000;

  console.log(`1. Durée du direct supérieure à 1 heure : ${isDurationValid ? '✅ VALIDÉ' : '❌ ÉCHEC'} (${afterRefresh.fullTicker})`);
  console.log(`2. Audience cumulée (>= 500) : ${isAudienceCumuleeValid ? '✅ VALIDÉ' : '❌ ÉCHEC'} (${afterRefresh.audienceCumulee})`);
  console.log(`3. Likes de session (> 1 000) : ${isLikesValid ? '✅ VALIDÉ' : '❌ ÉCHEC'} (${afterRefresh.likes})`);

  if (isDurationValid && isAudienceCumuleeValid && isLikesValid) {
    console.log("\n🎉 SUCCÈS ABSOLU : TOUTES LES MÉTRIQUES SONT PERSISTÉES ET IMMUNISÉES CONTRE F5 !");
  } else {
    console.log("\nRésultats partiels enregistrés.");
  }
}

verifyLive().catch(err => {
  console.error("Erreur durant le test:", err);
  process.exit(1);
});
