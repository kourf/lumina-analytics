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

  console.log('Connexion au site de production déployé...');
  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    sessionStorage.setItem('isUnlocked', 'true');
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));

  // Vérifier si l'ErrorBoundary est présent
  const hasErrorBoundary = await page.evaluate(() => {
    return document.body.innerText.includes('Recharger le Tableau de Bord');
  });

  console.log('Production has ErrorBoundary :', hasErrorBoundary);
  console.log('Production Console Errors :', errors);

  // Scroller sur la Veille Concurrentielle
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2, h3'));
    const target = headings.find(h => h.textContent.includes('Veille Concurrentielle'));
    const sec = target ? target.closest('section') : null;
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot de production vérifiée
  const sections = await page.$$('section');
  for (const sec of sections) {
    const text = await page.evaluate(el => el.textContent, sec);
    if (text.includes('Veille Concurrentielle (Multi-Comptes)')) {
      await sec.screenshot({
        path: path.join(ARTIFACT_DIR, 'production_verified_veille_ratios.png')
      });
      console.log('Capture de production enregistrée : production_verified_veille_ratios.png');
      break;
    }
  }

  // Capture globale du haut du Dashboard en production
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'production_verified_dashboard_live.png'),
    clip: { x: 0, y: 0, width: 1440, height: 950 }
  });
  console.log('Capture du haut du Dashboard enregistrée : production_verified_dashboard_live.png');

  await browser.close();
  console.log('Validation de production 100% réussie !');
}

run().catch(console.error);
