import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataJsonPath = path.join(__dirname, '../public/api/data.json');

async function startLiveDaemon(username) {
  console.log(`[Daemon] Démarrage du monitoring continu pour @${username}...`);
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
  
  try {
    console.log("[Daemon] Connexion au Live...");
    await page.goto(`https://www.tiktok.com/@${username}/live`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Boucle infinie d'extraction (toutes les 15 secondes)
    while (true) {
      const liveData = await page.evaluate(() => {
        let isLive = false;
        let viewers = 0;
        
        const viewerElement = document.querySelector('[data-e2e="live-room-viewer-count"], .viewer-count');
        if (viewerElement) {
          isLive = true;
          const text = viewerElement.innerText.replace(/,/g, '').replace(/ /g, '');
          if (text.includes('K')) {
            viewers = parseFloat(text) * 1000;
          } else {
            viewers = parseInt(text, 10);
          }
        }

        return { isLive, viewers };
      });

      console.log(`[${new Date().toLocaleTimeString()}] Live: ${liveData.isLive} | Viewers: ${liveData.viewers}`);
      
      // Mise à jour de data.json
      if (fs.existsSync(dataJsonPath)) {
        const rawData = fs.readFileSync(dataJsonPath, 'utf8');
        const jsonData = JSON.parse(rawData);
        
        if (!jsonData.tiktokLiveAPI) jsonData.tiktokLiveAPI = {};
        if (!jsonData.tiktokLiveAPI.history) jsonData.tiktokLiveAPI.history = [];
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        // Ajouter à l'historique pour le graphique
        jsonData.tiktokLiveAPI.history.push({
          time: timeString,
          viewers: liveData.viewers
        });
        
        // Garder seulement les 20 derniers points pour ne pas saturer le fichier
        if (jsonData.tiktokLiveAPI.history.length > 20) {
          jsonData.tiktokLiveAPI.history.shift();
        }

        jsonData.tiktokLiveAPI.isLive = liveData.isLive;
        jsonData.tiktokLiveAPI.currentViewers = liveData.viewers;
        jsonData.tiktokLiveAPI.lastDetected = now.toISOString();
        jsonData.tiktokLiveAPI.peakViewers = Math.max(jsonData.tiktokLiveAPI.peakViewers || 0, liveData.viewers);
        
        fs.writeFileSync(dataJsonPath, JSON.stringify(jsonData, null, 2));
      }
      
      // Attendre 1 minute (60 000 ms) avant la prochaine lecture
      await new Promise(resolve => setTimeout(resolve, 60000));
    }

  } catch (error) {
    console.error('[Daemon] Erreur fatale :', error);
  } finally {
    console.log('[Daemon] Arrêt du processus.');
    await browser.close();
  }
}

startLiveDaemon('karam.drame');
