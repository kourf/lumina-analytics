import React, { useState, useEffect } from 'react';
import { TikTokHeader } from '../components/tiktok/TikTokHeader';
import { TikTokKpiCards } from '../components/tiktok/TikTokKpiCards';
import { TikTokLiveHub } from '../components/tiktok/TikTokLiveHub';
import { TikTokVideoAnalytics } from '../components/tiktok/TikTokVideoAnalytics';
import { TikTokCompetitorAnalysis } from '../components/tiktok/TikTokCompetitorAnalysis';
import { TikTokRecentVideos } from '../components/tiktok/TikTokRecentVideos';
import { TikTokSourcesLegendModal } from '../components/tiktok/TikTokSourcesLegendModal';
import { useTikTokUnifiedData } from '../hooks/useTikTokUnifiedData';
import { useTikTokLiveStatus } from '../hooks/useTikTokLiveStatus';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { Users, Radio, ShieldAlert, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const TikTokDashboard = ({ data, auth, liveData }) => {
  const [loading, setLoading] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);

  // Vérification temps réel autonome via Edge Gateway TikTok (interrogation toutes les 30s)
  const liveChecker = useTikTokLiveStatus('karam.drame', {
    autoCheck: true,
    pollInterval: 30000,
    initialData: liveData
  });

  // Détection d'un état Live réel via la source faisant autorité : l'Edge Gateway TikTok
  const isCheckerDone = Boolean(liveChecker.lastChecked);
  const isConfirmedLive = Boolean(liveChecker.isLive || liveChecker.status === 'LIVE');
  const isConfirmedOffline = Boolean(liveChecker.status === 'OFFLINE' || (isCheckerDone && !liveChecker.isLive));

  // Détermination de l'état Live réel et vérifié :
  // Si le checker Edge confirme OFFLINE -> l'état est obligatoirement OFFLINE (aucun état zombie permis).
  // Si le checker Edge confirme LIVE -> l'état est LIVE.
  // En phase transitoire initiale uniquement, si Firestore est déjà marqué isLive, on temporise.
  const effectiveIsLive = isConfirmedLive ? true : (isConfirmedOffline ? false : Boolean(liveData?.isLive));

  // Auto-réparation Firestore : si le Edge Gateway confirme que le live est terminé mais que Firestore était resté sur isLive: true
  useEffect(() => {
    if (isConfirmedOffline && liveData?.isLive) {
      import('firebase/firestore').then(({ doc, updateDoc }) => {
        import('../config/firebase').then(({ db }) => {
          updateDoc(doc(db, 'users', 'karamokho'), {
            'tiktokLiveAPI.isLive': false,
            'tiktokLiveAPI.status': 'OFFLINE',
            'tiktokLiveAPI.currentViewers': 0,
            'tiktokLiveAPI.viewerCount': 0,
            'tiktokLiveAPI.roomId': '',
            'tiktokAPI.isLive': false,
            'isLive': false
          }).catch(() => {});
        });
      }).catch(() => {});
    }
  }, [isConfirmedOffline, liveData?.isLive]);

  // Résolution stricte des métriques en direct (source de vérité : Edge Gateway & Firestore)
  const resolvedCurrentViewers = effectiveIsLive 
    ? (liveChecker.viewerCount > 0 ? liveChecker.viewerCount : Number(liveData?.currentViewers || liveData?.viewerCount || 0))
    : 0;

  const resolvedPeakViewers = effectiveIsLive 
    ? Math.max(Number(liveData?.peakViewers || 0), Number(liveChecker.viewerCount || 0), resolvedCurrentViewers)
    : 0;

  // Préservation absolue du timestamp réel de début du direct
  const resolvedStartedAt = effectiveIsLive 
    ? (liveData?.started_at || liveData?.startedAt || liveChecker.startedAt || null) 
    : null;

  const resolvedRoomId = effectiveIsLive 
    ? (liveChecker.roomId || liveData?.roomId || '') 
    : '';

  const resolvedTotalUser = effectiveIsLive 
    ? Number(liveData?.cumulative_audience || liveData?.totalUser || liveData?.total_user || 0) 
    : 0;

  // Source unique de vérité unifiée avec live status vérifié dynamiquement
  const unifiedData = useTikTokUnifiedData(data, {
    ...(liveData || {}),
    isLive: effectiveIsLive,
    roomId: resolvedRoomId,
    currentViewers: resolvedCurrentViewers,
    peakViewers: resolvedPeakViewers,
    totalUser: resolvedTotalUser,
    cumulative_audience: resolvedTotalUser,
    started_at: resolvedStartedAt,
    startedAt: resolvedStartedAt,
    lastDetected: liveData?.lastDetected || liveChecker.lastChecked,
    liveStatus: effectiveIsLive ? 'LIVE' : 'OFFLINE',
    isRefreshing: loading || liveChecker.isRefreshing
  });

  // Forcer le Dark Mode absolu pour le Dashboard TikTok Cyber Neon
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
  }, []);

  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      await liveChecker.refresh();
      window.dispatchEvent(new CustomEvent('tiktok:refresh'));
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
          isRefreshing={loading || liveChecker.isRefreshing}
        />
      </div>

      {/* SECTION LIVE ACTIVE : Placé IMMÉDIATEMENT TOUT EN HAUT sous la bannière quand le Live est actif */}
      {effectiveIsLive && (
        <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.12s' }}>
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
                totalUser: resolvedTotalUser,
                cumulative_audience: resolvedTotalUser,
                likes: Number(liveData?.likes ?? liveData?.totalLikes ?? 0),
                totalLikes: Number(liveData?.totalLikes ?? liveData?.likes ?? 0),
                shares: Number(liveData?.shares ?? liveData?.totalShares ?? liveData?.shareCount ?? 0),
                totalShares: Number(liveData?.totalShares ?? liveData?.shares ?? liveData?.shareCount ?? 0),
                comments: Number(liveData?.comments ?? liveData?.totalComments ?? 0),
                totalComments: Number(liveData?.totalComments ?? liveData?.comments ?? 0),
                newFollowers: Number(liveData?.newFollowers ?? liveData?.followers ?? 0),
                followers: Number(liveData?.followers ?? liveData?.newFollowers ?? 0),
                profileFollowers: Number(unifiedData?.followers || data?.followers || 6392),
                totalSubscribers: Number(unifiedData?.followers || data?.followers || 6392),
                diamonds: Number(liveData?.diamonds ?? liveData?.totalDiamonds ?? 0),
                totalDiamonds: Number(liveData?.totalDiamonds ?? liveData?.diamonds ?? 0),
                started_at: resolvedStartedAt,
                startedAt: resolvedStartedAt,
                lastChecked: liveData?.lastDetected || liveChecker.lastChecked,
                status: 'LIVE'
              }}
              onRefresh={handleManualRefresh}
              isRefreshing={loading || liveChecker.isRefreshing}
            />
          </ErrorBoundary>
        </section>
      )}

      {/* SECTION 1 : BLOC UNIFIÉ (KPI & ANALYSE STRATÉGIQUE) */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.15s' }}>
        <div className="bg-white dark:bg-[#111827]/80 border border-slate-200 dark:border-[#1F2937] backdrop-blur-xl rounded-[24px] p-6 md:p-8 shadow-sm dark:shadow-none relative overflow-hidden group">
          {/* Subtle Glow Background */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#25F4EE]/5 via-blue-500/5 to-purple-500/5 blur-3xl -mr-32 -mt-32 rounded-full pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-700"></div>

          <div className="relative z-10">
            {/* Unified Header */}
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

              {/* Bouton Légende des Données & Cadences */}
              <button
                type="button"
                onClick={() => setShowLegendModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-cyan-500/40 transition-all text-xs font-semibold shadow-sm shrink-0 self-start md:self-center group"
                title="Consulter l'origine de chaque donnée et sa cadence d'actualisation"
              >
                <HelpCircle className="w-4 h-4 text-[#25F4EE] group-hover:scale-110 transition-transform" />
                <span>Origine des Données & Cadences</span>
              </button>
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

      {/* SECTION 3 : HUB LIVE STREAMING (affiché ici hors ligne pour archives et historique) */}
      {!effectiveIsLive && (
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
                isLive: false,
                roomId: resolvedRoomId,
                currentViewers: 0,
                peakViewers: resolvedPeakViewers,
                started_at: null,
                lastChecked: liveData?.lastDetected || liveChecker.lastChecked,
                status: 'OFFLINE'
              }}
              onRefresh={handleManualRefresh}
              isRefreshing={loading || liveChecker.isRefreshing}
            />
          </ErrorBoundary>
        </section>
      )}

      {/* SECTION 4 : CATALOGUE VIDEO */}
      <section className="animate-fade-in-up w-full" style={{ animationDelay: '0.4s' }}>
        <TikTokRecentVideos recentVideos={unifiedData.recentVideos} />
      </section>

      {/* Modal Pédagogique des Sources & Cadences */}
      <TikTokSourcesLegendModal
        isOpen={showLegendModal}
        onClose={() => setShowLegendModal(false)}
      />

    </div>
  );
};


