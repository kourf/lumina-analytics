const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\RO2TK\\.gemini\\antigravity\\brain\\3ba121a6-dbe2-414e-bdc6-adb460423cf1';

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1800 });

  // Unlock PIN
  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    sessionStorage.setItem('isUnlocked', 'true');
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.goto('https://lumina-analytics-kd-2026.web.app/tiktok', { waitUntil: 'networkidle2' });

  // Wait for content
  await page.waitForSelector('h3', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 4000));

  const getChartSection = async () => {
    return page.evaluateHandle(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      const target = headings.find(h => h.textContent.includes('Évolution des performances') || h.textContent.includes('ÉVOLUTION DES PERFORMANCES'));
      return target ? target.closest('.flex.flex-col.lg\\:flex-row.gap-6') : null;
    });
  };

  // 1. Screenshot Vue Temporelle par défaut (Mois / Bâtons)
  let section = await getChartSection();
  await section.screenshot({
    path: path.join(ARTIFACT_DIR, 'charts_vue_temporelle_mois.png')
  });
  console.log('Saved charts_vue_temporelle_mois.png');

  // 2. Click Courbe sur le graphique de gauche
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const lineBtn = buttons.find(b => b.title && b.title.includes('Courbe linéaire'));
    if (lineBtn) lineBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  section = await getChartSection();
  await section.screenshot({
    path: path.join(ARTIFACT_DIR, 'charts_vue_temporelle_courbe.png')
  });
  console.log('Saved charts_vue_temporelle_courbe.png');

  // 3. Click "Par Vidéo (74)"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const vidBtn = buttons.find(b => b.textContent && b.textContent.includes('Par Vidéo'));
    if (vidBtn) vidBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  section = await getChartSection();
  await section.screenshot({
    path: path.join(ARTIFACT_DIR, 'charts_vue_par_video_74.png')
  });
  console.log('Saved charts_vue_par_video_74.png');

  // 4. Switch back to Vue Temporelle, switch cadence to Semaines
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tempBtn = buttons.find(b => b.textContent && b.textContent.includes('Vue Temporelle'));
    if (tempBtn) tempBtn.click();
    const semBtns = buttons.filter(b => b.textContent && b.textContent.trim() === 'Semaines');
    if (semBtns.length > 0) semBtns[semBtns.length - 1].click(); // right chart granularity
  });
  await new Promise(r => setTimeout(r, 1000));

  section = await getChartSection();
  await section.screenshot({
    path: path.join(ARTIFACT_DIR, 'charts_cadence_semaines.png')
  });
  console.log('Saved charts_cadence_semaines.png');

  await browser.close();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
