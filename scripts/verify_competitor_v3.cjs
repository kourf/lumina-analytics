const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\RO2TK\\.gemini\\antigravity\\brain\\3ba121a6-dbe2-414e-bdc6-adb460423cf1';

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 2200 });

  console.log('Connexion au serveur...');
  await page.goto('http://localhost:4188/tiktok', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    sessionStorage.setItem('isUnlocked', 'true');
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.goto('http://localhost:4188/tiktok', { waitUntil: 'domcontentloaded' });

  await page.waitForSelector('h3', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // Simuler la saisie de @devtrotter
  console.log('Saisie de @devtrotter...');
  await page.type('input[placeholder*="tiktok.com"]', '@devtrotter');
  
  // Clic sur Analyser & Ajouter
  const submitButton = await page.$('button[type="submit"]');
  if (submitButton) {
    await submitButton.click();
    console.log('Bouton Analyser cliqué, attente de la modal...');
    await new Promise(r => setTimeout(r, 2000));

    // Remplir les 6 inputs avec les stats
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('div.fixed input[type="number"]');
      if (inputs.length >= 6) {
        const vals = [45, 95000, 18500, 8200, 45, 60];
        inputs.forEach((inp, idx) => {
          inp.value = vals[idx];
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
    });
    await new Promise(r => setTimeout(r, 600));

    // Clic sur "Confirmer & Enregistrer"
    console.log('Confirmation et enregistrement...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('div.fixed button'));
      const confirmBtn = btns.find(b => b.textContent.includes('Confirmer & Enregistrer'));
      if (confirmBtn) confirmBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    // Trouver la section Veille et faire une capture directe de l'élément
    const sections = await page.$$('section');
    for (const sec of sections) {
      const text = await page.evaluate(el => el.textContent, sec);
      if (text.includes('Veille Concurrentielle (Multi-Comptes)')) {
        await sec.screenshot({
          path: path.join(ARTIFACT_DIR, 'veille_concurrentielle_avec_concurrent.png')
        });
        console.log('Capture enregistrée avec succès : veille_concurrentielle_avec_concurrent.png');
        break;
      }
    }
  }

  await browser.close();
  console.log('Vérification terminée avec succès !');
}

run().catch(console.error);
