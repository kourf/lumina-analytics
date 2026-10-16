const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🚀 Démarrage de la vérification Puppeteer sur https://lumina-analytics-kd-2026.web.app/tiktok...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const launchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,1100']
  };
  if (fs.existsSync(chromePath)) launchOptions.executablePath = chromePath;

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });

  // Déverrouiller la session
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('isUnlocked', 'true');
    localStorage.setItem('theme', 'dark');
  });

  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  // Laisser charger les données
  await new Promise(r => setTimeout(r, 6000));

  const artifactDir = path.resolve('C:/Users/RO2TK/.gemini/antigravity/brain/3ba121a6-dbe2-414e-bdc6-adb460423cf1');

  // 1. Capture Dashboard épuré (haut & KPI)
  const dashPath = path.join(artifactDir, 'dashboard_epure_verified.png');
  await page.screenshot({ path: dashPath, fullPage: false });
  console.log('📸 Capture dashboard enregistrée :', dashPath);

  // 2. Extraire les textes des KPI et de la section stratégique
  const domInfo = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText?.trim());
    const kpiTexts = Array.from(document.querySelectorAll('.truncate')).map(el => el.innerText?.trim());
    return { buttons, kpiTexts };
  });
  console.log('Boutons trouvés :', domInfo.buttons);

  // 3. Cliquer sur le bouton "Origine des Données & Cadences"
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Origine des Données & Cadences'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Bouton cliqué avec succès :', clicked);

  await new Promise(r => setTimeout(r, 1500));

  // 4. Capture de la modale ouverte
  const modalPath = path.join(artifactDir, 'sources_legend_modal_verified.png');
  await page.screenshot({ path: modalPath, fullPage: false });
  console.log('📸 Capture modale enregistrée :', modalPath);

  // 5. Fermer la modale et scroller vers le catalogue
  await page.evaluate(() => {
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Fermer la légende'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    window.scrollTo({ top: 1800, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1500));

  // 6. Capture Catalogue Vidéos pour vérifier "(toutes les 30 min)"
  const cataloguePath = path.join(artifactDir, 'catalogue_cadence_verified.png');
  await page.screenshot({ path: cataloguePath, fullPage: false });
  console.log('📸 Capture catalogue enregistrée :', cataloguePath);

  await browser.close();
  console.log('✅ Vérifications terminées avec succès !');
})();
