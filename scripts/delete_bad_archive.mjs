import fetch from 'node-fetch';

const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const PROJECT_ID = 'lumina-analytics-kd-2026';
const BAD_ARCHIVE_ID = 'live_karam_drame_20260912_7684785174780906262';

async function deletePermanently() {
  console.log(`🗑️ Début de la suppression définitive de l'archive : ${BAD_ARCHIVE_ID}`);

  // 1. Supprimer le document dans tiktokLiveSessions
  try {
    const sessionDocUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tiktokLiveSessions/${BAD_ARCHIVE_ID}?key=${API_KEY}`;
    const res1 = await fetch(sessionDocUrl, { method: 'DELETE' });
    console.log(`1. tiktokLiveSessions delete status: ${res1.status}`);
  } catch (err) {
    console.error("Erreur suppression tiktokLiveSessions:", err.message);
  }

  // 2. Supprimer aussi si présent dans tiktok_archives
  try {
    const archiveDocUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tiktok_archives/${BAD_ARCHIVE_ID}?key=${API_KEY}`;
    const res2 = await fetch(archiveDocUrl, { method: 'DELETE' });
    console.log(`2. tiktok_archives delete status: ${res2.status}`);
  } catch (err) {
    console.error("Erreur suppression tiktok_archives:", err.message);
  }

  // 3. Vider historyArchives dans users/karamokho
  try {
    const userUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?updateMask.fieldPaths=historyArchives&key=${API_KEY}`;
    const payload = {
      fields: {
        historyArchives: {
          arrayValue: {
            values: []
          }
        }
      }
    };
    const res3 = await fetch(userUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(`3. users/karamokho historyArchives cleared status: ${res3.status}`);
  } catch (err) {
    console.error("Erreur vidage historyArchives:", err.message);
  }

  // 4. Vider tiktokLiveAPI.historyArchives si existant
  try {
    const userUrl2 = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?updateMask.fieldPaths=tiktokLiveAPI.historyArchives&key=${API_KEY}`;
    const payload2 = {
      fields: {
        tiktokLiveAPI: {
          mapValue: {
            fields: {
              historyArchives: {
                arrayValue: {
                  values: []
                }
              }
            }
          }
        }
      }
    };
    const res4 = await fetch(userUrl2, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload2)
    });
    console.log(`4. tiktokLiveAPI.historyArchives cleared status: ${res4.status}`);
  } catch (err) {
    console.error("Erreur vidage tiktokLiveAPI.historyArchives:", err.message);
  }

  console.log("✅ Suppression terminée avec succès !");
}

deletePermanently();
