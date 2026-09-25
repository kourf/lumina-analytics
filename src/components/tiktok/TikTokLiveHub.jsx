import React, { useState } from 'react';
import { Radio, Users, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import TikTokLiveCards from './TikTokLiveCards';
import TikTokLiveAnalytics from './TikTokLiveAnalytics';
import TikTokLiveHistory from './TikTokLiveHistory';
import useTikTokUnifiedData from '../../hooks/useTikTokUnifiedData';

export function TikTokLiveHub({ liveData: propLiveData, isLive: propIsLive, onRefresh, isRefreshing = false }) {
  // If unified hook is needed or props are passed
  const unified = useTikTokUnifiedData();
  const liveData = propLiveData || unified?.liveData || {};
  
  // Résolution stricte de l'état Live (Bistable : En Direct vs Hors Ligne)
  const isLive = Boolean(propIsLive !== undefined ? propIsLive : (liveData?.isLive === true));
  
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const loading = isRefreshing || internalRefreshing;

  const handleManualCheck = async () => {
    setInternalRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        window.dispatchEvent(new CustomEvent('tiktok:refresh'));
      }
    } catch (e) {
      console.error('Erreur lors du rafraîchissement du statut live:', e);
    } finally {
      setTimeout(() => setInternalRefreshing(false), 800);
    }
  };

  const channelUrl = 'https://www.tiktok.com/@karam.drame/live';

  return (
    <div className="space-y-6">
      {/* En-tête principal du Hub Live */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-all">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Identité créateur et statut */}
          <div className="flex items-start gap-4">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl border transition-all shrink-0",
              isLive 
                ? "border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]" 
                : "border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400"
            )}>
              <Radio className={cn("h-6 w-6", isLive ? "animate-pulse text-rose-500" : "opacity-60")} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Hub Live Streaming</h2>
                <span className="rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900/90 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-zinc-400 font-mono">
                  @karam.drame
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Supervision temps réel sans latence • Architecture 0€ automatisée
              </p>
            </div>
          </div>

          {/* Badges d'état et actions rapides */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Badge Bistable : EN DIRECT ou HORS LIGNE */}
            {isLive ? (
              <div className="flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/15 px-3.5 py-1.5 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                </span>
                <span className="text-xs font-bold tracking-wider text-rose-300 font-mono">EN DIRECT</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900/80 px-3.5 py-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-zinc-500"></span>
                <span className="text-xs font-semibold tracking-wider text-slate-600 dark:text-zinc-400 font-mono">HORS LIGNE</span>
              </div>
            )}

            {/* Compteur spectateurs actif : strictement 0 si hors ligne */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 px-3.5 py-1.5 text-xs text-slate-700 dark:text-zinc-300 font-mono">
              <Users className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-400"/>
              <span>
                <strong className="text-slate-900 dark:text-white font-bold">{isLive ? Number(liveData?.currentViewers || liveData?.viewerCount || 0) : 0}</strong> spectateurs
              </span>
            </div>

            {/* Bouton de vérification manuelle */}
            <button
              onClick={handleManualCheck}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 transition-all hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-rose-400")} />
              <span>{loading ? "Vérification..." : "Vérifier"}</span>
            </button>

            {/* Accès au Live TikTok */}
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-semibold transition-all",
                isLive
                  ? "border border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500"
                  : "border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <span>Rejoindre le Live</span>
              <ExternalLink className="h-3.5 w-3.5"/>
            </a>
          </div>

        </div>
      </div>

      {/* Cartes KPI Temps Réel */}
      <TikTokLiveCards isLive={isLive} liveData={liveData} />

      {/* Rétention et Analyse IA */}
      <TikTokLiveAnalytics isLive={isLive} liveData={liveData} />

      {/* Archives et Historique Réel */}
      <TikTokLiveHistory historyArchives={liveData?.historyArchives || []} />
    </div>
  );
}

export default TikTokLiveHub;
