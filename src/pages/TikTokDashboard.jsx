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

    // Synchronisation Réactive automatique à l'ouverture du Dashboard
    handleManualRefresh();

    // Actualisation dynamique en temps réel du live via notre passerelle Cloudflare Edge toutes les 15 secondes
    const fetchLiveEdge = async () => {
      try {
        await fetch('https://lumina-tiktok-webhook.kouroufia15.workers.dev/live-status');
      } catch (err) {
        // En cas d'indisponibilité temporaire, Firestore conserve la dernière valeur
      }
    };

    fetchLiveEdge();
    const interval = setInterval(fetchLiveEdge, 15000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      // Synchronisation directe des métriques réactives
      window.dispatchEvent(new CustomEvent('tiktok:refresh'));
      await fetch('https://lumina-tiktok-webhook.kouroufia15.workers.dev/live-status').catch(() => {});
    } catch (e) {
      console.error("Erreur de synchronisation TikTok :", e);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

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

