# Lumina Analytics 🚀

Application d''analyse avancée et de suivi en temps réel pour YouTube et TikTok.

---

## 🏛 Architecture Globale

- **Frontend** : React + Vite + TailwindCSS (Hébergé sur Firebase Hosting)
- **Base de données** : Google Cloud Firestore
- **Backend Serverless** : Firebase Cloud Functions v1/v2 (Node.js 20/22)
- **Live Stream Tracking** : Cloud Run Worker (live-metrics-runner) avec cache optionnel Redis Memorystore
- **Sécurité** : Google Cloud Secret Manager (YOUTUBE_API_KEY, TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET)
- **Messagerie temps réel** : Google Cloud Pub/Sub (youtube-live-events)
- **CI/CD** : GitHub Actions (.github/workflows/deploy.yml)

---

## 🔐 Gestion des Secrets (Secret Manager)

Les clés et identifiants API sont stockés de manière sécurisée dans **Google Cloud Secret Manager** :
1. YOUTUBE_API_KEY : Clé API Google YouTube Data v3.
2. TIKTOK_CLIENT_KEY : Client Key de l''application TikTok Developer.
3. TIKTOK_CLIENT_SECRET : Client Secret de l''application TikTok Developer.

Le code backend consomme ces secrets via le module unctions/secrets.js avec mise en cache mémoire.

---

## 📦 Déploiement

### 1. Pré-requis
- Google Cloud SDK (gcloud) configuré sur le projet lumina-analytics-kd-2026
- Node.js 20+ et npm
- Firebase CLI (irebase-tools)

### 2. Déploiement des Cloud Functions
`ash
cd functions
npm install
firebase deploy --only functions
`

### 3. Déploiement du Worker Live (Cloud Run)
`ash
cd worker
gcloud run deploy live-metrics-runner \
  --source . \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets YOUTUBE_API_KEY=YOUTUBE_API_KEY:latest,TIKTOK_CLIENT_KEY=TIKTOK_CLIENT_KEY:latest,TIKTOK_CLIENT_SECRET=TIKTOK_CLIENT_SECRET:latest
`

---

## 🔄 Pipeline CI/CD GitHub Actions

Le workflow automatique est situé dans .github/workflows/deploy.yml.
Il assure :
1. Les vérifications de syntaxe et les tests frontend/backend
2. Le build et push de l''image Docker du worker sur Google Container Registry
3. Le déploiement continu sur Cloud Run avec liaison automatique des secrets
