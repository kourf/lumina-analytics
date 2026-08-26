import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

// Configuration Firebase
const firebaseConfig = {
  projectId: "lumina-analytics-kd-2026",
  appId: "1:766102727241:web:670178653dfc59d24aad98",
  storageBucket: "lumina-analytics-kd-2026.firebasestorage.app",
  apiKey: "AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc",
  authDomain: "lumina-analytics-kd-2026.firebaseapp.com",
  messagingSenderId: "766102727241"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Import mock data directly (since it's a JS file, we'll import it dynamically)
import('./src/data/mockData.js').then(async (module) => {
  const MOCK_DATA = module.MOCK_DATA;
  
  console.log("Démarrage de l'envoi des données de Karamokho DRAMÉ vers Firestore...");
  
  try {
    for (const [platform, data] of Object.entries(MOCK_DATA)) {
      await setDoc(doc(db, "platforms", platform), data);
      console.log(`✅ Données de la plateforme ${platform} enregistrées.`);
    }
    console.log("🎉 Toutes les données de Karamokho DRAMÉ ont été synchronisées avec Firebase Firestore !");
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des données :", error);
    process.exit(1);
  }
}).catch(err => {
  console.error("Erreur d'importation des données :", err);
});
