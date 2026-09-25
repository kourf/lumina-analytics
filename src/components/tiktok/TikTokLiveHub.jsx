import { useState, useEffect } from 'react';
import {
  Radio,
  Users,
  Heart,
  Share2,
  Clock,
  Activity,
  Sparkles,
  MessageSquare,
  History,
  RefreshCw,
  ExternalLink, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export function TikTokLiveHub({ liveData, onRefresh, isRefreshing }) {
  const isLive = Boolean(liveData?.isLive);
  const [activeChatTab, setActiveChatTab] = useState('questions');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [showAllArchives, setShowAllArchives] = useState(false);

  // Chronomètre sécurisé calculé sur le startedAt réel
  useEffect(() => {
    if (!isLive || !liveData?.started_at) {
      setElapsedTime('00:00:00');
      return;
    }

    const startTimestamp = typeof liveData.started_at === 'number'
      ? liveData.started_at
      : new Date(liveData.started_at).getTime();

    if (isNaN(startTimestamp) || startTimestamp > Date.now()) {
      setElapsedTime('00:00:00');
      return;
    }

    const updateTimer = () => {
      const diffMs = Math.max(0, Date.now() - startTimestamp);
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      setElapsedTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isLive, liveData?.started_at]);

  const handleManualRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    }
  };

  const formatNumber = (num) => {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  };

  // Extraction des données réelles
  const currentViewers = isLive ? (liveData?.currentViewers || 0) : 0;
  const peakViewers = isLive ? (liveData?.peakViewers || currentViewers) : 0;
  const currentLikes = isLive ? (liveData?.likes || 0) : 0;
  const currentShares = isLive ? (liveData?.shares || 0) : 0;
  const newFollowers = isLive ? (liveData?.followers || 0) : 0;
  const retentionPoints = liveData?.liveTimeline || [];
  const chatQuestions = liveData?.topQuestions || [];
  const topChatters = liveData?.topContributor ? [liveData.topContributor] : [];
  const archives = liveData?.historyArchives || [];

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-zinc-800/80 bg-zinc-950 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">

      {/* 1. BARRE DE COMMANDE & ÉTAT BISTABLE */}
      <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3.5">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
            isLive
              ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
              : 'border-zinc-800 bg-zinc-900 text-zinc-500'
          }`}>
            <Radio className={`h-5 w-5 ${isLive ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                Centre de Contrôle Live
              </h2>
              <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                @karam.drame
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Monitoring en direct, rétention d'audience, IA de modération et archives réelles.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Badge Bistable */}
          {isLive ? (
            <div className="flex items-center gap-2 rounded-full border border-rose-500/50 bg-rose-500/15 px-3 py-1 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
              <span className="text-xs font-bold tracking-wider text-rose-300">EN DIRECT</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-zinc-600"></span>
              <span className="text-xs font-semibold tracking-wider text-zinc-400">HORS LIGNE</span>
            </div>
          )}

          {/* Synchronisation manuelle */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
            title="Vérifier l'état du live"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
            <span className="hidden sm:inline">Vérifier</span>
          </button>

          {/* Lien externe vers TikTok */}
          <a
            href="https://www.tiktok.com/@karam.drame/live"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              isLive
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500'
                : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white'
            }`}
          >
            <span>Rejoindre</span>
            <ExternalLink className="h-3 w-3"/>
          </a>
        </div>
      </div>

      {/* 2. GRILLE BENTO PRINCIPALE */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* KPI 1 : Durée */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-all hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Durée du Direct</span>
            <Clock className={`h-4 w-4 ${isLive ? 'text-rose-400' : 'text-zinc-600'}`} />
          </div>
          <div className="mt-2.5">
            <div className="font-mono text-2xl font-bold tracking-tight text-white">{elapsedTime}</div>
            <p className="mt-1 text-[11px] text-zinc-500">
              {isLive ? 'Chronomètre en cours' : 'Diffusion inactive'}
            </p>
          </div>
        </div>

        {/* KPI 2 : Audience & Pic */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-all hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Audience</span>
            <Users className={`h-4 w-4 ${isLive ? 'text-teal-400' : 'text-zinc-600'}`} />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold tracking-tight text-white">
              {formatNumber(currentViewers)}
              <span className="ml-2 text-xs font-normal text-zinc-400">
                (Pic : {formatNumber(peakViewers)})
              </span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              {isLive ? 'Spectateurs connectés' : 'Aucun spectateur'}
            </p>
          </div>
        </div>

        {/* KPI 3 : Likes */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-all hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Likes Session</span>
            <Heart className={`h-4 w-4 ${isLive ? 'text-pink-400' : 'text-zinc-600'}`} />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold tracking-tight text-white">
              {formatNumber(currentLikes)}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              {isLive ? 'Mentions J’aime reçues' : 'Compteur à zéro'}
            </p>
          </div>
        </div>

        {/* KPI 4 : Partages & Abonnés */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-all hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Partages & Abos</span>
            <Share2 className={`h-4 w-4 ${isLive ? 'text-indigo-400' : 'text-zinc-600'}`} />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold tracking-tight text-white">
              {isLive ? formatNumber(currentShares) : '--'}
              {isLive && newFollowers > 0 && (
                <span className="ml-2 text-xs font-semibold text-emerald-400">
                  +{newFollowers} abos
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              {isLive ? 'Interactions cumulées' : 'Réinitialisé'}
            </p>
          </div>
        </div>

        {/* BENTO LARGE : COURBE DE RÉTENTION (2 colonnes sur desktop) */}
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-400"/>
              <h3 className="text-sm font-semibold text-white">Monitoring & Rétention Live</h3>
            </div>
            <span className="text-[11px] text-zinc-500">
              {isLive ? 'Échantillonnage 60s' : 'En pause'}
            </span>
          </div>

          <div className="my-4 flex min-h-[170px] items-center justify-center rounded-xl border border-dashed border-zinc-800/70 bg-zinc-950/40 p-4 text-center">
            {!isLive ? (
              <div className="space-y-1.5">
                <Activity className="mx-auto h-7 w-7 text-zinc-700"/>
                <p className="text-xs font-medium text-zinc-300">Aucun enregistrement en cours</p>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                  La courbe d'audience se tracera minute par minute dès le lancement de la prochaine diffusion.
                </p>
              </div>
            ) : retentionPoints.length === 0 ? (
              <div className="space-y-2">
                <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"/>
                <p className="text-xs text-zinc-400">Acquisition du premier point de mesure en cours...</p>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex h-28 items-end gap-1 px-1">
                  {retentionPoints.map((pt, idx) => {
                    const maxVal = Math.max(...retentionPoints.map(p => p.viewers || 1), 1);
                    const heightPct = Math.max(12, Math.min(100, Math.round(((pt.viewers || 0) / maxVal) * 100)));
                    return (
                      <div key={idx} className="group relative flex-1 flex flex-col items-center">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full rounded-t-sm bg-gradient-to-t from-rose-500/30 to-rose-500 transition-all hover:brightness-125"
                        />
                        <span className="pointer-events-none absolute -top-6 rounded bg-zinc-800 px-1 py-0.5 text-[9px] font-bold text-white opacity-0 shadow group-hover:opacity-100">
                          {pt.viewers}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
                  <span>Début</span>
                  <span>Point le plus récent</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800/60 pt-3">
            <span>Stabilité d'audience</span>
            <span className="text-zinc-300 font-medium">
              {isLive && retentionPoints.length > 0 ? 'Flux actif' : 'En attente'}
            </span>
          </div>
        </div>

        {/* BENTO LARGE : ANALYSE AUDIENCE & TCHAT IA (2 colonnes sur desktop) */}
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400"/>
              <h3 className="text-sm font-semibold text-white">Intelligence Audience & Tchat</h3>
              <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-bold text-purple-300 border border-purple-500/30">
                0€ GEMINI
              </span>
            </div>

            <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/90 p-0.5 text-xs">
              <button
                onClick={() => setActiveChatTab('questions')}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                  activeChatTab === 'questions' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Questions Clés
              </button>
              <button
                onClick={() => setActiveChatTab('topChatters')}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                  activeChatTab === 'topChatters' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Top Actifs
              </button>
            </div>
          </div>

          <div className="my-4 flex min-h-[170px] flex-col justify-center rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4">
            {!isLive ? (
              <p className="text-center text-xs text-zinc-500">
                Tchat inactif — L'analyse automatique de l'audience et des questions débutera lors de la prochaine session en direct.
              </p>
            ) : activeChatTab === 'questions' ? (
              chatQuestions.length > 0 ? (
                <ul className="space-y-2">
                  {chatQuestions.slice(0, 3).map((q, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                      <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-purple-400 shrink-0"/>
                      <span className="line-clamp-2">{q.original || q.text || q}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-xs text-zinc-500">
                  Aucune question récurrente identifiée sur ce live pour l'instant.
                </p>
              )
            ) : (
              topChatters.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {topChatters.slice(0, 3).map((user, idx) => (
                    <div key={idx} className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-2 text-center">
                      <p className="text-[11px] font-semibold text-white truncate">@{user.username || user.name || 'Spectateur'}</p>
                      <p className="text-[10px] text-purple-400 mt-0.5 font-medium">{user.messageCount || user.comments || 0} msgs</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-zinc-500">
                  Identification des spectateurs les plus fidèles en cours...
                </p>
              )
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800/60 pt-3">
            <span>Synthèse du sentiment</span>
            <span className="text-purple-300 font-medium">
              {isLive ? 'Modération active' : 'Hors ligne'}
            </span>
          </div>
        </div>

        {/* 3. SECTION BASSE DU BENTO : HISTORIQUE DES LIVES (Pleine largeur 4 colonnes) */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 md:col-span-2 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-zinc-400"/>
              <h3 className="text-sm font-semibold text-white">Historique & Archives des Sessions</h3>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                {archives.length} {archives.length > 1 ? 'sessions' : 'session'}
              </span>
            </div>

            {archives.length > 3 && (
              <button
                onClick={() => setShowAllArchives(!showAllArchives)}
                className="text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors"
              >
                {showAllArchives ? 'Réduire' : 'Tout afficher'}
              </button>
            )}
          </div>

          <div className="mt-4">
            {archives.length === 0 ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800/60 bg-zinc-950/40 py-6 text-center text-xs text-zinc-500">
                <AlertCircle className="h-4 w-4 text-zinc-600"/>
                <span>Aucune archive disponible. Les bilans apparaîtront automatiquement à la clôture de vos lives réels.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {(showAllArchives ? archives : archives.slice(0, 3)).map((session, index) => (
                  <div 
                    key={session.id || index}
                    className="flex flex-col justify-between rounded-xl border border-zinc-800/70 bg-zinc-950/50 p-3.5 transition-all hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5 font-medium text-white">
                        <Calendar className="h-3 w-3 text-zinc-500"/>
                        {session.date || 'Session passée'}
                      </span>
                      <span className="font-mono text-zinc-400">{session.duration || '--:--'}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-zinc-800/60 pt-2.5 text-[11px]">
                      <span className="text-zinc-500">
                        Pic : <strong className="text-zinc-300">{formatNumber(session.peakViewers)}</strong>
                      </span>
                      <span className="text-zinc-500">
                        Likes : <strong className="text-zinc-300">{formatNumber(session.totalLikes)}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}

export default TikTokLiveHub;
