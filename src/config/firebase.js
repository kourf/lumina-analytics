import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "lumina-analytics-kd-2026",
  appId: "1:766102727241:web:670178653dfc59d24aad98",
  storageBucket: "lumina-analytics-kd-2026.firebasestorage.app",
  apiKey: "AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc",
  authDomain: "lumina-analytics-kd-2026.firebaseapp.com",
  messagingSenderId: "766102727241"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
