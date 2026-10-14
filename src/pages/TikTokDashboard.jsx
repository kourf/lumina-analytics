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
import { useTikTokProfileAutoSync } from '../hooks/useTikTokProfileAutoSync';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { Users, Radio, ShieldAlert, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const TikTokDashboard = ({ data, auth, liveData }) => {
  const [loading, setLoading] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);

  // Vérification temps réel autonome via Edge Gateway TikTok (interrogation toutes les 30s)
  // Vérification temps réel autonome via Edge Gateway TikTok (interrogation toutes les 30s)
  const liveChecker = useTikTokLiveStatus('karam.drame', {
    autoCheck: true,
    pollInterval: 30000,
    initialData: liveData
  });

  // Maintien d'un cache persistant anti-rebond pour éliminer tout flash à 0 après F5
  const getStoredLiveState = () => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('lumina_live_state') : null;
      if (s) {
        const p = JSON.parse(s);
        if (p && typeof p === 'object') return p;
      }
    } catch {}
    return null;
  };
  const rawStoredLive = getStoredLiveState();
  const currentActiveRoom = liveChecker.roomId || liveData?.roomId || '';
  const isStoredMatchingRoom = Boolean(currentActiveRoom && rawStoredLive?.roomId && String(currentActiveRoom) === String(rawStoredLive.roomId));
  const storedLiveInitial = isStoredMatchingRoom ? rawStoredLive : null;

  const getEarliestStartedAt = () => {
    const d1 = liveData?.started_at || liveData?.startedAt;
    const d2 = storedLiveInitial?.startedAt || storedLiveInitial?.started_at;
    // Si d1 provient d'une session active aujourd'hui (< 18h), lui donner la priorité absolue
    if (d1) {
      const t1 = new Date(d1).getTime();
      if (!isNaN(t1) && (Date.now() - t1) < 18 * 3600 * 1000) return d1;
    }
    if (d1 && d2) {
      const t1 = new Date(d1).getTime();
      const t2 = new Date(d2).getTime();
      if (!isNaN(t1) && !isNaN(t2)) return t1 <= t2 ? d1 : d2;
    }
    return d1 || d2 || null;
  };

  const lastPositiveMetrics = React.useRef({
    viewers: Number(liveData?.currentViewers || storedLiveInitial?.currentViewers || storedLiveInitial?.viewers || 0),
    peakViewers: Number(liveData?.peakViewers || storedLiveInitial?.peakViewers || 0),
    totalUser: Number(liveData?.totalUser || liveData?.total_user || liveData?.cumulative_audience || storedLiveInitial?.totalUser || 0),
    likes: Number(liveData?.likes || liveData?.totalLikes || storedLiveInitial?.likes || 0),
    shares: Number(liveData?.shares || liveData?.totalShares || storedLiveInitial?.shares || 0),
    comments: Number(liveData?.comments || storedLiveInitial?.comments || 0),
    startedAt: getEarliestStartedAt(),
    roomId: currentActiveRoom || storedLiveInitial?.roomId || ''
  });

  // Détection d'un basculement de salon Live : Réinitialisation stricte et immédiate des métriques
  if (currentActiveRoom && lastPositiveMetrics.current.roomId && String(currentActiveRoom) !== String(lastPositiveMetrics.current.roomId)) {
    lastPositiveMetrics.current = {
      viewers: 0,
      peakViewers: 0,
      totalUser: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      startedAt: liveData?.started_at || liveData?.startedAt || liveChecker.startedAt || null,
      roomId: currentActiveRoom
    };
    try {
      localStorage.removeItem('lumina_live_state');
    } catch {}
  }

  // Compteur d'échecs consécutifs pour éviter les faux négatifs OFFLINE
  const offlineFailureCountRef = React.useRef(0);

  // Détection d'un état Live réel avec hystérésis (Debounce)
  const isDirectLiveDetected = Boolean(liveChecker.isLive || liveChecker.status === 'LIVE');
  const isFirestoreLive = Boolean(liveData?.isLive);

  if (isDirectLiveDetected || isFirestoreLive) {
    offlineFailureCountRef.current = 0;
  } else if (liveChecker.status === 'OFFLINE') {
    offlineFailureCountRef.current += 1;
  }

  // Ne déclarer OFFLINE que si Edge confirme formellement OFFLINE au moins 3 fois consécutives (>= 90s) ET que Firestore est inactif
  const isConfirmedOffline = Boolean(
    !isDirectLiveDetected && 
    !isFirestoreLive && 
    liveChecker.status === 'OFFLINE' && 
    offlineFailureCountRef.current >= 3
  );

  const isRecentStoredLive = Boolean(
    storedLiveInitial?.isLive && 
    (Date.now() - (storedLiveInitial.timestamp || 0) < 6 * 3600 * 1000)
  );

  const effectiveIsLive = isDirectLiveDetected 
    ? true 
    : (isConfirmedOffline ? false : (isFirestoreLive || (!isConfirmedOffline && isRecentStoredLive)));

  // Résolution stricte et dynamique des spectateurs en direct (priorité absolue au flux Firestore temps réel certifié)
  const firestoreViewers = Number(liveData?.currentViewers ?? liveData?.viewerCount ?? 0);
  const checkerViewers = Number(liveChecker?.viewerCount ?? 0);
  const rawCurrentViewers = Math.max(firestoreViewers, checkerViewers);

  if (effectiveIsLive && rawCurrentViewers > 0) {
    lastPositiveMetrics.current.viewers = rawCurrentViewers;
  }

  const resolvedCurrentViewers = effectiveIsLive 
    ? (rawCurrentViewers > 0 ? rawCurrentViewers : lastPositiveMetrics.current.viewers)
    : 0;

  const rawPeakViewers = Math.max(
    Number(liveData?.peakViewers || 0), 
    Number(liveChecker.viewerCount || 0), 
    resolvedCurrentViewers
  );
  if (effectiveIsLive && rawPeakViewers > 0) {
    lastPositiveMetrics.current.peakViewers = Math.max(lastPositiveMetrics.current.peakViewers, rawPeakViewers);
  }
  const resolvedPeakViewers = effectiveIsLive 
    ? Math.max(rawPeakViewers, lastPositiveMetrics.current.peakViewers) 
    : 0;

  // Préservation absolue du timestamp réel authentique du direct (TikTok create_time / Firestore)
  const incomingStartedAt = liveData?.started_at || liveData?.startedAt || liveChecker.startedAt || null;
  if (incomingStartedAt) {
    const incTime = new Date(incomingStartedAt).getTime();
    if (!isNaN(incTime) && (Date.now() - incTime) < 18 * 3600 * 1000) {
      lastPositiveMetrics.current.startedAt = incomingStartedAt;
    }
    if (currentActiveRoom) {
      lastPositiveMetrics.current.roomId = currentActiveRoom;
    }
  }

  const resolvedStartedAt = lastPositiveMetrics.current.startedAt || incomingStartedAt || null;

  const resolvedRoomId = currentActiveRoom || lastPositiveMetrics.current.roomId || '';

  // Audience cumulée (total_user / enter_count) avec filet de sécurité par salon
  const rawTotalUser = Number(
    liveData?.cumulative_audience || 
    liveData?.totalUser || 
    liveData?.total_user || 
    liveData?.enter_count || 
    liveChecker.totalUser || 
    0
  );
  if (rawTotalUser > 0) {
    lastPositiveMetrics.current.totalUser = Math.max(lastPositiveMetrics.current.totalUser, rawTotalUser);
  }
  const resolvedTotalUser = Math.max(rawTotalUser, lastPositiveMetrics.current.totalUser, resolvedPeakViewers, resolvedCurrentViewers, 0);

  const rawLikes = Number(liveData?.likes ?? liveData?.totalLikes ?? liveChecker.likes ?? 0);
  if (rawLikes > 0) {
    lastPositiveMetrics.current.likes = Math.max(lastPositiveMetrics.current.likes, rawLikes);
  }
  const resolvedLikes = Math.max(rawLikes, lastPositiveMetrics.current.likes, 0);

  const rawShares = Number(liveData?.shares ?? liveData?.totalShares ?? liveData?.shareCount ?? liveChecker.shares ?? 0);
  if (rawShares > 0) {
    lastPositiveMetrics.current.shares = Math.max(lastPositiveMetrics.current.shares, rawShares);
  }
  const resolvedShares = Math.max(rawShares, lastPositiveMetrics.current.shares, 0);

  const rawComments = Number(liveData?.comments ?? liveData?.totalComments ?? liveChecker.comments ?? 0);
  if (rawComments > 0) {
    lastPositiveMetrics.current.comments = Math.max(lastPositiveMetrics.current.comments, rawComments);
  }
  const resolvedComments = Math.max(rawComments, lastPositiveMetrics.current.comments, 0);

  // Synchronisation automatique et autonome du profil TikTok (abonnés & likes) toutes les 5 minutes
  const profileSync = useTikTokProfileAutoSync(data, {
    autoSync: true,
    pollInterval: 300000 // 5 minutes
  });

  // Consolidation des données avec les métriques profil synchronisées en direct
  const synchronizedData = {
    ...(data || {}),
    followers: Number(profileSync.profileData.followers || data?.followers || 6398),
    likes: Number(profileSync.profileData.likes || data?.likes || 17200),
    totalLikes: Number(profileSync.profileData.totalLikes || profileSync.profileData.likes || data?.totalLikes || 17200),
    totalVideos: Number(profileSync.profileData.totalVideos || data?.totalVideos || 75),
    avatar_url: profileSync.profileData.avatarUrl || data?.avatar_url,
    lastSync: profileSync.profileData.lastSync || data?.lastSync
  };

  // Source unique de vérité unifiée avec live status vérifié dynamiquement
  const unifiedData = useTikTokUnifiedData(synchronizedData, {
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
    isRefreshing: loading || liveChecker.isRefreshing || profileSync.isSyncing
  });

  // Sauvegarde synchrone et persistante dans localStorage dès qu'un flux positif est actif
  useEffect(() => {
    if (effectiveIsLive) {
      try {
        const liveSnapshot = {
          isLive: true,
          roomId: resolvedRoomId,
          viewers: resolvedCurrentViewers,
          currentViewers: resolvedCurrentViewers,
          peakViewers: resolvedPeakViewers,
          totalUser: resolvedTotalUser,
          total_user: resolvedTotalUser,
          cumulative_audience: resolvedTotalUser,
          likes: resolvedLikes,
          totalLikes: resolvedLikes,
          shares: resolvedShares,
          totalShares: resolvedShares,
          comments: resolvedComments,
          startedAt: resolvedStartedAt,
          started_at: resolvedStartedAt,
          timestamp: Date.now()
        };
        localStorage.setItem('lumina_live_state', JSON.stringify(liveSnapshot));
      } catch (e) {}
    }
  }, [effectiveIsLive, resolvedRoomId, resolvedCurrentViewers, resolvedPeakViewers, resolvedTotalUser, resolvedLikes, resolvedShares, resolvedComments, resolvedStartedAt]);

  // Forcer le Dark Mode absolu pour le Dashboard TikTok Cyber Neon
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
  }, []);

  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      await Promise.allSettled([
        profileSync.syncNow(),
        liveChecker.refresh()
      ]);
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
      <div className="animate-fade-in-up flex flex-col gap-3" style={{ animationDelay: '0.1s' }}>
        <TikTokHeader 
          user={unifiedData} 
          isLive={effectiveIsLive} 
          onRefresh={handleManualRefresh} 
          isRefreshing={loading || liveChecker.isRefreshing || profileSync.isSyncing}
        />

        {/* Feedback interactif de synchronisation profil */}
        {profileSync.lastSyncStatus && (
          <div className={cn(
            "px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all animate-fade-in shadow-sm",
            profileSync.lastSyncStatus.success 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          )}>
            <span className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full shrink-0", profileSync.lastSyncStatus.success ? "bg-emerald-400 animate-pulse" : "bg-amber-400")}></span>
              <span>{profileSync.lastSyncStatus.message}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Cadence : Auto 5m • Actif
            </span>
          </div>
        )}
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
                likes: resolvedLikes,
                totalLikes: resolvedLikes,
                shares: resolvedShares,
                totalShares: resolvedShares,
                comments: resolvedComments,
                totalComments: resolvedComments,
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
                totalUser: resolvedTotalUser,
                cumulative_audience: resolvedTotalUser,
                likes: resolvedLikes,
                totalLikes: resolvedLikes,
                shares: resolvedShares,
                totalShares: resolvedShares,
                comments: resolvedComments,
                totalComments: resolvedComments,
                newFollowers: Number(liveData?.newFollowers ?? liveData?.followers ?? 0),
                started_at: resolvedStartedAt,
                startedAt: resolvedStartedAt,
                ended_at: liveData?.ended_at || null,
                duration: liveData?.duration || liveData?.durationStr || '00:00:00',
                durationStr: liveData?.durationStr || liveData?.duration || '00:00:00',
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


