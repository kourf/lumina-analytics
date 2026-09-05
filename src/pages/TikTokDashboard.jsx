import React, { useState, useEffect } from 'react';
import { TikTokHeader } from '../components/tiktok/TikTokHeader';
import { TikTokKpiCards } from '../components/tiktok/TikTokKpiCards';
import { TikTokLiveAnalytics } from '../components/tiktok/TikTokLiveAnalytics';
import { TikTokVideoAnalytics } from '../components/tiktok/TikTokVideoAnalytics';
import { TikTokCompetitorAnalysis } from '../components/tiktok/TikTokCompetitorAnalysis';
import { TikTokRecentVideos } from '../components/tiktok/TikTokRecentVideos';
import { TikTokCreatorCard } from '../components/tiktok/TikTokCreatorCard';
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

      {/* BANNIÈRE D'ÉTAT SYSTÈME EN DIRECT / HORS LIGNE (Clarification visuelle immédiate) */}
      <div className="animate-fade-in-up -mt-2" style={{ animationDelay: '0.12s' }}>
        {verifiedLive.isLive ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#FE2C55]/15 border border-[#FE2C55]/30 text-xs text-white shadow-lg animate-pulse backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FE2C55] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FE2C55]"></span>
              </span>
              <span className="font-black uppercase tracking-wider text-sm text-[#FE2C55]">🔴 Karamokho DRAMÉ est EN DIRECT sur TikTok !</span>
              <span className="text-pink-200/90 font-mono hidden md:inline">• {verifiedLive.viewerCount} spectateurs connectés</span>
            </div>
            <a 
              href={`https://www.tiktok.com/@${verifiedLive.username}/live`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#FE2C55] hover:bg-[#E0264C] text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
            >
              <span>Accéder au Direct</span>
              <Radio size={13} className="animate-spin" />
            </a>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/40 text-xs text-slate-300 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0"></span>
              <div>
                <span className="font-bold text-slate-200">Karamokho DRAMÉ est actuellement hors ligne.</span>
                <span className="text-slate-400 ml-1.5 hidden md:inline">
                  Aucun direct n'est en cours sur TikTok. Les graphiques et métriques ci-dessous correspondent aux archives des diffusions passées.
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-black/30 px-3 py-1 rounded-full border border-white/5 shrink-0">
              Statut vérifié en temps réel
            </span>
          </div>
        )}
      </div>

      {/* SECTION 1 : CARTE CRÉATEUR DÉDIÉE (@karam.drame) */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.15s' }}>
        <div className="bg-white dark:bg-[#111827]/80 border border-slate-200 dark:border-[#1F2937] backdrop-blur-xl rounded-[24px] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Surveillance Live du Créateur</span>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300">
                    @karam.drame
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Détection dynamique rigoureuse pour le compte officiel @karam.drame (anti-faux positifs, SWR 60s).
                </p>
              </div>
            </div>
          </div>

          {/* Dedicated Creator Card for @karam.drame */}
          <div className="w-full">
            <TikTokCreatorCard 
              username="karam.drame"
              displayName="Karamokho Dramé"
              followersCount={unifiedData.followers}
              likesCount={unifiedData.likes}
              engagementRate={unifiedData.engagementRate}
            />
          </div>
        </div>
      </section>

      {/* SECTION 2 : KPI GLOBALS */}
      <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <TikTokKpiCards tiktokData={unifiedData} />
      </section>

      {/* SECTION 3 : MONITORING LIVE */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.25s' }}>
        <TikTokLiveAnalytics liveData={{
          ...(liveData || {}),
          isLive: verifiedLive.isLive,
          currentViewers: verifiedLive.viewerCount,
          peakViewers: Math.max(Number(liveData?.peakViewers || 0), verifiedLive.viewerCount),
          started_at: verifiedLive.startedAt || liveData?.started_at
        }} />
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


