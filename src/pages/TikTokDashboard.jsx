import { useState, useEffect } from 'react';
import { TikTokHeader } from '../components/tiktok/TikTokHeader';
import { TikTokKpiCards } from '../components/tiktok/TikTokKpiCards';
import { TikTokLiveHub } from '../components/tiktok/TikTokLiveHub';
import { TikTokVideoAnalytics } from '../components/tiktok/TikTokVideoAnalytics';
import { TikTokCompetitorAnalysis } from '../components/tiktok/TikTokCompetitorAnalysis';
import { TikTokRecentVideos } from '../components/tiktok/TikTokRecentVideos';
import { useTikTokUnifiedData } from '../hooks/useTikTokUnifiedData';
import { useTikTokLiveStatus } from '../hooks/useTikTokLiveStatus';
import { useTikTokLiveSocket } from '../hooks/useTikTokLiveSocket';
import { ShieldAlert } from 'lucide-react';

export const TikTokDashboard = ({ data, liveData }) => {
  const [loading, setLoading] = useState(false);

  // Dynamic, verified live status check with SWR (Stale-While-Revalidate) 60s cache
  const verifiedLive = useTikTokLiveStatus('karam.drame', {
    autoCheck: true,
    pollInterval: 60000,
    initialData: liveData
  });

  // Connexion WebSocket sub-seconde avec le Worker Backend (Socket.io)
  const socketLive = useTikTokLiveSocket(undefined, liveData);

  // Détermination de l'état Live : priorité au flux WebSocket s'il est connecté, sinon Firestore / SWR
  const effectiveIsLive = socketLive.isSocketConnected 
    ? socketLive.isLive 
    : Boolean(liveData?.isLive || verifiedLive.isLive);

  // Résolution stricte des métriques en direct (source de vérité : Firestore en temps réel)
  const resolvedCurrentViewers = socketLive.isSocketConnected 
    ? socketLive.metrics.viewers 
    : (effectiveIsLive ? Number(liveData?.currentViewers || verifiedLive.viewerCount || 0) : 0);

  const resolvedPeakViewers = socketLive.isSocketConnected 
    ? socketLive.metrics.peakViewers 
    : Math.max(Number(liveData?.peakViewers || 0), Number(liveData?.currentViewers || 0), Number(verifiedLive.viewerCount || 0));

  const resolvedStartedAt = (socketLive.isSocketConnected ? socketLive.startedAt : null) 
    || liveData?.started_at 
    || liveData?.startedAt 
    || (effectiveIsLive ? verifiedLive.startedAt : null) 
    || null;

  const resolvedRoomId = socketLive.sessionId 
    || liveData?.roomId 
    || verifiedLive.roomId 
    || '';

  // Source unique de vérité unifiée avec live status vérifié dynamiquement
  const unifiedData = useTikTokUnifiedData(data, {
    ...(liveData || {}),
    isLive: effectiveIsLive,
    roomId: resolvedRoomId,
    currentViewers: resolvedCurrentViewers,
    peakViewers: resolvedPeakViewers,
    started_at: resolvedStartedAt,
    lastDetected: liveData?.lastDetected || verifiedLive.lastChecked,
    liveStatus: effectiveIsLive ? 'LIVE' : (verifiedLive.status || 'OFFLINE'),
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
      if (socketLive.isSocketConnected) {
        socketLive.requestSync();
      }
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
        <TikTokLiveHub 
          liveData={{
            ...(liveData || {}),
            isLive: effectiveIsLive,
            roomId: resolvedRoomId,
            currentViewers: resolvedCurrentViewers,
            peakViewers: resolvedPeakViewers,
            likes: socketLive.isSocketConnected ? (socketLive.metrics.likes ?? socketLive.metrics.totalLikes ?? 0) : Number(liveData?.likes ?? liveData?.totalLikes ?? liveData?.likeCount ?? 0),
            totalLikes: socketLive.isSocketConnected ? (socketLive.metrics.totalLikes ?? socketLive.metrics.likes ?? 0) : Number(liveData?.totalLikes ?? liveData?.likes ?? liveData?.likeCount ?? 0),
            shares: socketLive.isSocketConnected ? (socketLive.metrics.shares ?? socketLive.metrics.totalShares ?? 0) : Number(liveData?.shares ?? liveData?.totalShares ?? liveData?.shareCount ?? 0),
            totalShares: socketLive.isSocketConnected ? (socketLive.metrics.totalShares ?? socketLive.metrics.shares ?? 0) : Number(liveData?.totalShares ?? liveData?.shares ?? liveData?.shareCount ?? 0),
            followers: socketLive.isSocketConnected ? (socketLive.metrics.followers ?? socketLive.metrics.newFollowers ?? 0) : Number(liveData?.followers ?? liveData?.newFollowers ?? liveData?.followCount ?? 0),
            newFollowers: socketLive.isSocketConnected ? (socketLive.metrics.newFollowers ?? socketLive.metrics.followers ?? 0) : Number(liveData?.newFollowers ?? liveData?.followers ?? liveData?.followCount ?? 0),
            diamonds: socketLive.isSocketConnected ? (socketLive.metrics.diamonds ?? socketLive.metrics.totalDiamonds ?? 0) : Number(liveData?.diamonds ?? liveData?.totalDiamonds ?? 0),
            comments: socketLive.isSocketConnected ? (socketLive.metrics.comments ?? socketLive.metrics.totalComments ?? 0) : Number(liveData?.comments ?? liveData?.totalComments ?? 0),
            started_at: resolvedStartedAt,
            title: socketLive.isSocketConnected 
              ? (socketLive.metrics?.title || liveData?.title || 'Live TikTok en direct') 
              : (liveData?.title || 'Live TikTok en direct'),
            lastChecked: liveData?.lastDetected || verifiedLive.lastChecked,
            status: effectiveIsLive ? 'LIVE' : (verifiedLive.status || 'OFFLINE'),
            historyArchives: socketLive.lastArchivedSession
              ? [socketLive.lastArchivedSession, ...(unifiedData?.historyArchives || liveData?.historyArchives || [])]
              : (unifiedData?.historyArchives || liveData?.historyArchives),
            liveTimeline: socketLive.liveTimeline?.length > 0 ? socketLive.liveTimeline : (liveData?.history || liveData?.timeline || []),
            chatMessages: socketLive.chatMessages?.length > 0 ? socketLive.chatMessages : (liveData?.recentComments || []),
            topQuestions: socketLive.isSocketConnected && socketLive.metrics.topQuestions?.length > 0
              ? socketLive.metrics.topQuestions
              : (liveData?.topQuestions || []),
            topContributor: socketLive.isSocketConnected 
              ? socketLive.metrics.topContributor 
              : (liveData?.topContributor || liveData?.topContributors?.[0] || null),
            isSocketConnected: socketLive.isSocketConnected
          }}
          onRefresh={handleManualRefresh}
          isRefreshing={verifiedLive.isRefreshing || loading}
        />
      </section>

      {/* SECTION 4 : CATALOGUE VIDEO */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.4s' }}>
        <TikTokRecentVideos recentVideos={unifiedData.recentVideos} />
      </section>

    </div>
  );
};


