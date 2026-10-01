import React, { useState, useEffect } from 'react';
import { TikTokHeader } from '../components/tiktok/TikTokHeader';
import { TikTokKpiCards } from '../components/tiktok/TikTokKpiCards';
import { TikTokLiveHub } from '../components/tiktok/TikTokLiveHub';
import { TikTokVideoAnalytics } from '../components/tiktok/TikTokVideoAnalytics';
import { TikTokCompetitorAnalysis } from '../components/tiktok/TikTokCompetitorAnalysis';
import { TikTokRecentVideos } from '../components/tiktok/TikTokRecentVideos';
import { useTikTokUnifiedData } from '../hooks/useTikTokUnifiedData';
import { useTikTokLiveStatus } from '../hooks/useTikTokLiveStatus';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
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
  // Détection d'un état "zombie" (ex: session abandonnée il y a des heures avec 0 spectateurs)
  const rawStartedAt = liveData?.started_at || liveData?.startedAt;
  const startedAtMs = rawStartedAt ? new Date(rawStartedAt).getTime() : 0;
  const isZombieSession = Boolean(
    liveData?.isLive && 
    (
      (startedAtMs > 0 && (Date.now() - startedAtMs) > 18 * 3600 * 1000) ||
      (Number(liveData?.currentViewers || 0) === 0 && verifiedLive.status === 'OFFLINE')
    )
  );

  // Détermination de l'état Live réel et vérifié
  const effectiveIsLive = Boolean(
    !isZombieSession && (liveData?.isLive || verifiedLive.isLive)
  );

  // Nettoyage automatique en arrière-plan si une session zombie est détectée
  useEffect(() => {
    if (isZombieSession) {
      import('firebase/firestore').then(({ doc, updateDoc }) => {
        const { db } = import('../config/firebase');
        // Import db dynamic
        import('../config/firebase').then(({ db }) => {
          updateDoc(doc(db, 'users', 'karamokho'), {
            'tiktokLiveAPI.isLive': false,
            'tiktokLiveAPI.currentViewers': 0,
            'tiktokLiveAPI.started_at': null,
            'tiktokLiveAPI.startedAt': null,
            'tiktokLiveAPI.roomId': '',
            'tiktokLiveAPI.durationStr': '00:00:00'
          }).catch(() => {});
        });
      }).catch(() => {});
    }
  }, [isZombieSession]);

  // Résolution stricte des métriques en direct (source de vérité : Firestore en temps réel)
  const resolvedCurrentViewers = effectiveIsLive ? Number(liveData?.currentViewers || verifiedLive.viewerCount || 0) : 0;

  const resolvedPeakViewers = effectiveIsLive ? Math.max(Number(liveData?.peakViewers || 0), Number(liveData?.currentViewers || 0), Number(verifiedLive.viewerCount || 0)) : 0;

  const resolvedStartedAt = effectiveIsLive ? (rawStartedAt || verifiedLive.startedAt || null) : null;

  const resolvedRoomId = effectiveIsLive ? (liveData?.roomId || verifiedLive.roomId || '') : '';

  // Source unique de vérité unifiée avec live status vérifié dynamiquement
  const unifiedData = useTikTokUnifiedData(data, {
    ...(liveData || {}),
    isLive: effectiveIsLive,
    roomId: resolvedRoomId,
    currentViewers: resolvedCurrentViewers,
    peakViewers: resolvedPeakViewers,
    started_at: resolvedStartedAt,
    lastDetected: liveData?.lastDetected || verifiedLive.lastChecked,
    liveStatus: effectiveIsLive ? 'LIVE' : 'OFFLINE',
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
          isLive={effectiveIsLive} 
          onRefresh={handleManualRefresh} 
        />
      </div>

      {/* SECTION 1 : BLOC UNIFIÉ (KPI & ANALYSE STRATÉGIQUE) */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.15s' }}>
        <div className="bg-white dark:bg-[#111827]/80 border border-slate-200 dark:border-[#1F2937] backdrop-blur-xl rounded-[24px] p-6 md:p-8 shadow-sm dark:shadow-none relative overflow-hidden group">
          {/* Subtle Glow Background */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#25F4EE]/5 via-blue-500/5 to-purple-500/5 blur-3xl -mr-32 -mt-32 rounded-full pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-700"></div>

          <div className="relative z-10">
            {/* Unifed Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#111827] to-slate-900 border border-slate-700 dark:border-white/10 flex items-center justify-center shadow-lg">
                  <ShieldAlert className="w-7 h-7 text-[#25F4EE]" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    Pilotage Stratégique & KPI
                    <span className="bg-emerald-100 dark:bg-[#10B981]/15 text-emerald-800 dark:text-[#10B981] px-3 py-1 rounded-full text-[11px] font-bold border border-emerald-300 dark:border-[#10B981]/30 tracking-widest uppercase">
                      API Connectée
                    </span>
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1.5 max-w-2xl leading-relaxed">
                    Les métriques globales (haut) proviennent directement de l'API officielle TikTok. Les taux de performance et graphiques (bas) sont calculés dynamiquement à partir des vidéos de votre catalogue.
                  </p>
                </div>
              </div>
            </div>

            <TikTokKpiCards tiktokData={unifiedData} />

            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent my-8"></div>

            <TikTokVideoAnalytics
              videoAnalytics={unifiedData.videoAnalytics}
              recentVideos={unifiedData.recentVideos}
              followers={unifiedData.followers}
            />
          </div>
        </div>
      </section>

      {/* SECTION 2 : VEILLE CONCURRENTIELLE */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.25s' }}>
        <TikTokCompetitorAnalysis myData={unifiedData} />
      </section>

      {/* SECTION 3 : HUB LIVE STREAMING (Bannière Dynamique / Hub) */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.3s' }}>
        <ErrorBoundary
          fallback={
            <div className="w-full bg-[#0B0F19] border border-slate-800 rounded-[32px] p-6 text-center">
              <p className="text-sm font-bold text-white mb-1">Hub Live Streaming en cours de synchronisation</p>
              <p className="text-xs text-slate-400">Le direct est en cours d'analyse en arrière-plan.</p>
            </div>
          }
        >
          <TikTokLiveHub 
            liveData={{
              ...(liveData || {}),
              isLive: effectiveIsLive,
              roomId: resolvedRoomId,
              currentViewers: resolvedCurrentViewers,
              peakViewers: resolvedPeakViewers,
              started_at: resolvedStartedAt,
              lastChecked: liveData?.lastDetected || verifiedLive.lastChecked,
              status: effectiveIsLive ? 'LIVE' : (verifiedLive.status || 'OFFLINE')
            }}
            onRefresh={handleManualRefresh}
            isRefreshing={verifiedLive.isRefreshing || loading}
          />
        </ErrorBoundary>
      </section>

      {/* SECTION 4 : CATALOGUE VIDEO */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.4s' }}>
        <TikTokRecentVideos recentVideos={unifiedData.recentVideos} />
      </section>

    </div>
  );
};


