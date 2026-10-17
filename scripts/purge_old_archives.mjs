import fs from 'fs';
import path from 'path';

const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const PROJECT_ID = 'lumina-analytics-kd-2026';
const BASE_FIRESTORE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function main() {
  console.log('🚀 Début de la procédure de purge et sauvegarde des archives TikTok Live...');

  // 1. Sauvegarde locale de sécurité (Zéro perte de données)
  const backup = {
    backupDate: new Date().toISOString(),
    reason: 'Purge des archives corrompues/anciennes demandée par l\'utilisateur',
    tiktok_archives: [],
    tiktokLiveSessions: [],
    userHistoryArchives: null,
    userTiktokLiveApiHistoryArchives: null
  };

  // Récupération tiktok_archives
  const r1 = await fetch(`${BASE_FIRESTORE}/tiktok_archives?key=${API_KEY}`);
  const d1 = await r1.json();
  if (d1.documents) {
    backup.tiktok_archives = d1.documents;
    console.log(`📦 ${d1.documents.length} document(s) trouvés dans 'tiktok_archives' pour sauvegarde.`);
  }

  // Récupération tiktokLiveSessions
  const r2 = await fetch(`${BASE_FIRESTORE}/tiktokLiveSessions?key=${API_KEY}`);
  const d2 = await r2.json();
  if (d2.documents) {
    backup.tiktokLiveSessions = d2.documents;
    console.log(`📦 ${d2.documents.length} document(s) trouvés dans 'tiktokLiveSessions' pour sauvegarde.`);
  }

  // Récupération users/karamokho
  const r3 = await fetch(`${BASE_FIRESTORE}/users/karamokho?key=${API_KEY}`);
  const d3 = await r3.json();
  if (d3.fields?.historyArchives) {
    backup.userHistoryArchives = d3.fields.historyArchives;
  }
  if (d3.fields?.tiktokLiveAPI?.mapValue?.fields?.historyArchives) {
    backup.userTiktokLiveApiHistoryArchives = d3.fields.tiktokLiveAPI.mapValue.fields.historyArchives;
  }

  const backupPath = path.resolve('backup_archives_before_purge.json');
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`✅ Sauvegarde de sécurité réussie dans : ${backupPath}`);

  // 2. Suppression de tous les documents dans 'tiktok_archives'
  if (backup.tiktok_archives.length > 0) {
    console.log(`\n🗑️ Suppression des documents dans 'tiktok_archives'...`);
    for (const doc of backup.tiktok_archives) {
      const docName = doc.name; // projects/.../documents/tiktok_archives/{docId}
      const docId = docName.split('/').pop();
      const delUrl = `https://firestore.googleapis.com/v1/${docName}?key=${API_KEY}`;
      const delRes = await fetch(delUrl, { method: 'DELETE' });
      console.log(` - Supprimé [tiktok_archives] ${docId} (HTTP ${delRes.status})`);
    }
  } else {
    console.log(`ℹ️ Aucun document à supprimer dans 'tiktok_archives'.`);
  }

  // 3. Suppression de tous les documents dans 'tiktokLiveSessions'
  if (backup.tiktokLiveSessions.length > 0) {
    console.log(`\n🗑️ Suppression des documents dans 'tiktokLiveSessions'...`);
    for (const doc of backup.tiktokLiveSessions) {
      const docName = doc.name;
      const docId = docName.split('/').pop();
      const delUrl = `https://firestore.googleapis.com/v1/${docName}?key=${API_KEY}`;
      const delRes = await fetch(delUrl, { method: 'DELETE' });
      console.log(` - Supprimé [tiktokLiveSessions] ${docId} (HTTP ${delRes.status})`);
    }
  } else {
    console.log(`ℹ️ Aucun document à supprimer dans 'tiktokLiveSessions'.`);
  }

  // 4. Vidage de historyArchives dans users/karamokho
  console.log(`\n🧹 Nettoyage des tableaux d'archives dans 'users/karamokho'...`);
  const patchUrl = `${BASE_FIRESTORE}/users/karamokho?updateMask.fieldPaths=historyArchives&updateMask.fieldPaths=tiktokLiveAPI.historyArchives&key=${API_KEY}`;
  const patchPayload = {
    fields: {
      historyArchives: {
        arrayValue: {
          values: []
        }
      },
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

  const patchRes = await fetch(patchUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patchPayload)
  });
  console.log(` - Nettoyage users/karamokho : HTTP ${patchRes.status}`);

  console.log(`\n🎉 Purge complète terminée avec succès ! La section des archives est désormais propre et prête pour les vrais directs.`);
}

main().catch(err => {
  console.error('❌ Erreur lors de la purge :', err);
  process.exit(1);
});
