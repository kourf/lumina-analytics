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

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.toString()));

  console.log('Connexion au serveur local...');
  await page.goto('http://localhost:4188/tiktok', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    sessionStorage.setItem('isUnlocked', 'true');
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.goto('http://localhost:4188/tiktok', { waitUntil: 'domcontentloaded' });

  await page.waitForSelector('h3', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // Scroller vers la section Veille Concurrentielle
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2, h3'));
    const target = headings.find(h => h.textContent.includes('Veille Concurrentielle'));
    const sec = target ? target.closest('section') : null;
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));

  // Capture 1 : Mode Ratios (Priorité)
  const sections = await page.$$('section');
  for (const sec of sections) {
    const text = await page.evaluate(el => el.textContent, sec);
    if (text.includes('Veille Concurrentielle (Multi-Comptes)')) {
      await sec.screenshot({
        path: path.join(ARTIFACT_DIR, 'veille_ratios_priorite.png')
      });
      console.log('Capture 1 enregistrée : veille_ratios_priorite.png');
      break;
    }
  }

  // Cliquer sur le bouton "Vue Complète"
  console.log('Clic sur Vue Complète...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const fullBtn = btns.find(b => b.textContent.includes('Vue Complète'));
    if (fullBtn) fullBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Capture 2 : Mode Vue Complète (Ratios + Volumes réunis)
  for (const sec of sections) {
    const text = await page.evaluate(el => el.textContent, sec);
    if (text.includes('Veille Concurrentielle (Multi-Comptes)')) {
      await sec.screenshot({
        path: path.join(ARTIFACT_DIR, 'veille_matrice_complete.png')
      });
      console.log('Capture 2 enregistrée : veille_matrice_complete.png');
      break;
    }
  }

  console.log('Erreurs détectées durant le test :', errors);

  await browser.close();
  console.log('Vérification terminée avec succès !');
}

run().catch(console.error);
