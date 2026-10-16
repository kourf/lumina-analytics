const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\RO2TK\\.gemini\\antigravity\\brain\\3ba121a6-dbe2-414e-bdc6-adb460423cf1';

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1600 });

  console.log('Connexion au serveur local...');
  await page.goto('http://localhost:4188/tiktok', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    sessionStorage.setItem('isUnlocked', 'true');
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.goto('http://localhost:4188/tiktok', { waitUntil: 'networkidle2' });

  // Attendre le chargement
  await page.waitForSelector('h2', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // Trouver la section Veille Concurrentielle
  const getCompetitorSection = async () => {
    return page.evaluateHandle(() => {
      const headings = Array.from(document.querySelectorAll('h2'));
      const target = headings.find(h => h.textContent.includes('Veille Concurrentielle'));
      return target ? target.closest('section') : null;
    });
  };

  const sectionHandle = await getCompetitorSection();
  if (sectionHandle) {
    const box = await sectionHandle.boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'veille_concurrentielle_default.png'),
        clip: {
          x: Math.max(0, box.x - 10),
          y: Math.max(0, box.y - 10),
          width: Math.min(1440, box.width + 20),
          height: box.height + 20
        }
      });
      console.log('Capture 1 enregistrée : veille_concurrentielle_default.png');
    }
  }

  // Simuler la saisie de @devtrotter
  console.log('Saisie de @devtrotter...');
  await page.type('input[placeholder*="tiktok.com"]', '@devtrotter');
  
  // Clic sur Analyser & Ajouter
  const submitButton = await page.$('button[type="submit"]');
  if (submitButton) {
    await submitButton.click();
    console.log('Bouton Analyser cliqué, attente de la modal...');
    await new Promise(r => setTimeout(r, 2500));

    // Capture de la modal interactive de confirmation
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'veille_concurrentielle_modal_validation.png')
    });
    console.log('Capture 2 enregistrée : veille_concurrentielle_modal_validation.png');
  }

  await browser.close();
  console.log('Vérification terminée avec succès !');
}

run().catch(console.error);
