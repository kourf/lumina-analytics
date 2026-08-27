import React, { useState, useEffect } from 'react';
import { TikTokHeader } from '../components/tiktok/TikTokHeader';
import { TikTokKpiCards } from '../components/tiktok/TikTokKpiCards';
import { TikTokLiveAnalytics } from '../components/tiktok/TikTokLiveAnalytics';
import { TikTokVideoAnalytics } from '../components/tiktok/TikTokVideoAnalytics';
import { TikTokCompetitorAnalysis } from '../components/tiktok/TikTokCompetitorAnalysis';
import { TikTokRecentVideos } from '../components/tiktok/TikTokRecentVideos';
import { useTikTokUnifiedData } from '../hooks/useTikTokUnifiedData';
import { cn } from '../lib/utils';

export const TikTokDashboard = ({ data, auth, liveData }) => {
  const [loading, setLoading] = useState(false);

  // Source unique de vérité unifiée
  const unifiedData = useTikTokUnifiedData(data, liveData);

  // Forcer le Dark Mode absolu pour le Dashboard TikTok Cyber Neon & Synchronisation Réactive à l'Ouverture
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';

    // Option 3 : Synchronisation Réactive automatique à l'ouverture du Dashboard
    handleManualRefresh();
  }, []);

  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      await fetch('https://us-central1-lumina-analytics-kd-2026.cloudfunctions.net/forceSyncTikTok', {
        method: 'POST'
      });
    } catch (e) {
      console.error("Erreur de synchronisation TikTok :", e);
    } finally {
      setLoading(false);
    }
  };

  if (!data && !auth?.accessToken) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-fade-in">
        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,0,0,0.3)] dark:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.63-.33 3.29-1.22 4.67-1.12 1.72-3 2.94-5.06 3.2-1.95.24-4.01-.06-5.63-1.17-1.6-1.09-2.73-2.8-3.08-4.71-.35-1.93.02-4 1.11-5.6 1.11-1.62 2.82-2.74 4.74-3.1 1.76-.32 3.61-.06 5.16.89V12.2c-1.1-.53-2.39-.73-3.61-.53-1.18.19-2.3.8-3.09 1.7-1.1 1.25-1.55 3.01-1.22 4.68.3 1.54 1.34 2.88 2.74 3.51 1.5.67 3.27.67 4.77 0 1.55-.7 2.65-2.12 2.96-3.8.06-.32.08-.66.08-.99V.02z"/>
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">Connexion TikTok Requise</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-8 text-lg">
          Pour afficher vos données en temps réel, vous devez autoriser Lumina Analytics à lire vos statistiques.
        </p>
        <a 
          href="https://us-central1-lumina-analytics-kd-2026.cloudfunctions.net/tiktokAuth"
          className="bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg flex items-center gap-3"
        >
          Lier mon compte TikTok
        </a>
      </div>
    );
  }

  if (!data) {
    return <div className="flex justify-center p-12 text-gray-500">Aucune donnée TikTok disponible.</div>;
  }

  return (
    <div id="dashboard-content" className="flex flex-col gap-8 pb-24 animate-fade-in max-w-[1600px] mx-auto w-full min-h-screen px-4 md:px-8">
      {/* En-tête TikTok (Profile) 100% automatique */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <TikTokHeader 
          user={unifiedData} 
          isLive={unifiedData.isLive} 
          onRefresh={handleManualRefresh} 
        />
      </div>

      {/* SECTION 1 : KPI GLOBALS */}
      <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <TikTokKpiCards tiktokData={unifiedData} />
      </section>

      {/* SECTION 2 : MONITORING LIVE */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.2s' }}>
        <TikTokLiveAnalytics liveData={liveData || {}} />
      </section>

      {/* SECTION 4 : GRAPHIQUES & PERFORMANCE */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.3s' }}>
        <div className="bg-white dark:bg-[#111827]/80 border border-slate-200 dark:border-[#1F2937] backdrop-blur-xl rounded-[24px] p-6 shadow-sm dark:shadow-none">
          <TikTokVideoAnalytics 
            videoAnalytics={unifiedData.videoAnalytics} 
            recentVideos={unifiedData.recentVideos} 
            followers={unifiedData.followers} 
          />
        </div>
      </section>

      {/* SECTION 5 : VEILLE CONCURRENTIELLE */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.35s' }}>
        <TikTokCompetitorAnalysis myData={unifiedData} />
      </section>

      {/* SECTION 3 : CATALOGUE VIDEO */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.4s' }}>
        <TikTokRecentVideos recentVideos={unifiedData.recentVideos} />
      </section>

    </div>
  );
};

