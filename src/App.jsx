import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PlatformPage } from './pages/PlatformPage';
import { YouTubeDashboard } from './pages/YouTubeDashboard';
import { InstagramDashboard } from './pages/InstagramDashboard';
import { TikTokDashboard } from './pages/TikTokDashboard';
import { LinkedInDashboard } from './pages/LinkedInDashboard';
import { WebsiteDashboard } from './pages/WebsiteDashboard';
import { DiscordDashboard } from './pages/DiscordDashboard';
import { Insights } from './pages/Insights';
import { YoutubeIcon, InstagramIcon, LinkedinIcon, TikTokIcon, DiscordIcon } from './components/SocialIcons';
import { db } from './config/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const JARVIS_PHRASES = [
  "Bonjour Karamokho. Analyse de vos performances en cours...",
  "Initialisation des systèmes tactiques sociaux...",
  "Extraction des données d'engagement en temps réel...",
  "Compilation de vos métriques de croissance, veuillez patienter...",
  "Bonjour Monsieur. Synchronisation avec vos plateformes..."
];

import { ScrollToTop } from './components/layout/ScrollToTop';

import { ErrorBoundary } from './components/common/ErrorBoundary';

function App() {
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPhrase] = useState(() => JARVIS_PHRASES[Math.floor(Math.random() * JARVIS_PHRASES.length)]);

  useEffect(() => {
    let unsubscribe;

    async function initData() {
      try {
        let baseData = {};
        try {
          const response = await fetch('/api/data.json');
          baseData = await response.json();
        } catch (e) {
          console.error("Erreur mockData:", e);
        }

        const docRef = doc(db, 'users', 'karamokho');
        
        // Listener temps réel Firestore
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const firebaseData = docSnap.data();
            const historyArchivesList = firebaseData.historyArchives || firebaseData.tiktokLiveAPI?.historyArchives || baseData.tiktokLiveAPI?.historyArchives || [];
            
            // Sécuriser les vidéos TikTok réelles pour éviter tout clignotement ou disparition
            const realRecentVideos = (firebaseData.tiktokAPI?.recentVideos && firebaseData.tiktokAPI.recentVideos.length > 0)
              ? firebaseData.tiktokAPI.recentVideos
              : (firebaseData.recentVideos && firebaseData.recentVideos.length > 0)
                ? firebaseData.recentVideos
                : (baseData.tiktok?.recentVideos || []);

            const tiktokCombined = {
              ...(baseData.tiktok || {}),
              ...(firebaseData.tiktok || {}),
              ...(firebaseData.tiktokAPI || {}),
              recentVideos: realRecentVideos,
              followers: firebaseData.tiktokAPI?.followers || firebaseData.tiktok?.followers || baseData.tiktok?.followers || 6084,
              likes: firebaseData.tiktokAPI?.likes || firebaseData.tiktok?.likes || baseData.tiktok?.likes || 15779
            };

            const mergedData = {
              ...baseData,
              ...firebaseData,
              historyArchives: historyArchivesList,
              tiktok: tiktokCombined,
              tiktokAPI: tiktokCombined,
              tiktokLiveAPI: {
                ...(baseData.tiktokLiveAPI || {}),
                ...(firebaseData.tiktokLiveAPI || {}),
                historyArchives: historyArchivesList
              }
            };
            setAppData(mergedData);
          } else {
            setAppData(baseData);
          }
          setLoading(false);
        }, (error) => {
          console.error("Erreur onSnapshot:", error);
          setAppData(baseData);
          setLoading(false);
        });

      } catch (error) {
        console.error("Erreur d'initialisation:", error);
        setLoading(false);
      }
    }

    initData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (loading || !appData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-lumina-light dark:bg-lumina-dark transition-colors duration-300 px-6 text-center">
        <div className="w-16 h-16 border-4 border-lumina-primary/20 dark:border-lumina-primary/10 border-t-lumina-primary dark:border-t-lumina-primaryHover rounded-full animate-spin mb-8 shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
        <p className="text-[15px] font-medium text-gray-700 dark:text-gray-300 tracking-wide leading-relaxed animate-pulse">
          {loadingPhrase}
        </p>
      </div>
    );
  }

  const links = appData.user?.links || {};

  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard data={appData} />} />
          
          <Route path="youtube" element={<YouTubeDashboard data={appData.youtube} />} />
          <Route path="website" element={<WebsiteDashboard />} />
          
          <Route path="instagram" element={<InstagramDashboard />} />
          
          <Route path="tiktok" element={
            <TikTokDashboard 
              data={appData.tiktokAPI || appData.tiktok || { followers: 6084, likes: 15779, username: 'karam.drame' }} 
              auth={appData.tiktokAuth} 
              liveData={appData.tiktokLiveAPI || {}} 
            />
          } />
          
          <Route path="linkedin" element={<LinkedInDashboard />} />

          <Route path="discord" element={<DiscordDashboard data={appData.discordData || appData.discord} />} />
          
          <Route path="insights" element={<Insights data={appData} />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

