import React, { useState, useEffect } from 'react';
import { TikTokHeader } from '../components/tiktok/TikTokHeader';
import { TikTokKpiCards } from '../components/tiktok/TikTokKpiCards';
import { TikTokLiveHub } from '../components/tiktok/TikTokLiveHub';
import { TikTokVideoAnalytics } from '../components/tiktok/TikTokVideoAnalytics';
import { TikTokCompetitorAnalysis } from '../components/tiktok/TikTokCompetitorAnalysis';
import { TikTokRecentVideos } from '../components/tiktok/TikTokRecentVideos';
import { useTikTokUnifiedData } from '../hooks/useTikTokUnifiedData';
import { useTikTokLiveStatus } from '../hooks/useTikTokLiveStatus';
import { Users, Radio, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

export const TikTokDashboard = ({ data, auth, liveData }) => {
  const [loading, setLoading] = useState(false);

  // Dynamic, verified live status check with SWR (Stale-While-Revalidate) 60s cache
  const verifiedLive = useTikTokLiveStatus('karam.drame', {
    autoCheck: true,
    pollInterval: 60000,
    initialData: liveData
  });

  // Source unique de vérité unifiée avec live status vérifié dynamiquement
  const unifiedData = useTikTokUnifiedData(data, {
    ...(liveData || {}),
    isLive: verifiedLive.isLive,
    roomId: verifiedLive.roomId,
    currentViewers: verifiedLive.viewerCount,
    started_at: verifiedLive.startedAt,
    lastDetected: verifiedLive.lastChecked,
    liveStatus: verifiedLive.status,
    isRefreshing: verifiedLive.isRefreshing
  });

  // Forcer le Dark Mode absolu pour le Dashboard TikTok Cyber Neon
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
  }, []);

  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      window.dispatchEvent(new CustomEvent('tiktok:refresh'));
      await verifiedLive.refresh();
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
      {/* En-tête TikTok (Profile) 100% dynamique & vérifié */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <TikTokHeader 
          user={unifiedData} 
          isLive={verifiedLive.isLive} 
          onRefresh={handleManualRefresh} 
        />
      </div>

      {/* SECTION 1 : HUB LIVE STREAMING UNIQUE (Centralisé, 100% Automatique, Zéro Doublon) */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.15s' }}>
        <TikTokLiveHub 
          liveData={{
            ...(liveData || {}),
            isLive: verifiedLive.isLive,
            currentViewers: verifiedLive.viewerCount,
            peakViewers: Math.max(Number(liveData?.peakViewers || 0), verifiedLive.viewerCount),
            started_at: verifiedLive.startedAt || liveData?.started_at,
            lastChecked: verifiedLive.lastChecked,
            status: verifiedLive.status,
            historyArchives: unifiedData?.historyArchives || liveData?.historyArchives
          }}
          onRefresh={handleManualRefresh}
          isRefreshing={verifiedLive.isRefreshing || loading}
        />
      </section>

      {/* SECTION 2 : KPI GLOBAUX DU COMPTE (@karam.drame) */}
      <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <TikTokKpiCards tiktokData={unifiedData} />
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

      {/* SECTION 6 : CATALOGUE VIDEO */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.4s' }}>
        <TikTokRecentVideos recentVideos={unifiedData.recentVideos} />
      </section>

    </div>
  );
};


