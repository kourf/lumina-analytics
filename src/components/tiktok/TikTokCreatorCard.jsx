import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Users, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Info, 
  WifiOff, 
  Sparkles,
  Heart,
  TrendingUp
} from 'lucide-react';
import { useTikTokLiveStatus } from '../../hooks/useTikTokLiveStatus';
import { LIVE_STATUS } from '../../services/tiktokLiveService';
import { cn } from '../../lib/utils';

const formatNumber = (num) => {
  if (!num || isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toLocaleString('fr-FR');
};

const formatRelativeTime = (isoString) => {
  if (!isoString) return null;
  try {
    const diff = Math.max(0, Date.now() - new Date(isoString).getTime());
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `il y a ${days}j`;
    if (hours > 0) return `il y a ${hours}h`;
    if (minutes > 0) return `il y a ${minutes}m`;
    return "à l'instant";
  } catch {
    return null;
  }
};

const formatTimeOnly = (isoString) => {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '';
  }
};

/**
 * Responsive TikTok Creator Card with resilient 3-state live detection,
 * throttle protection, and micro-animations.
 * 
 * Supports usernames like 'jkaram', 'karam.drame', etc.
 */
export const TikTokCreatorCard = ({ 
  username = 'jkaram',
  displayName: initialDisplayName,
  avatarUrl: initialAvatarUrl,
  followersCount = 0,
  likesCount = 0,
  engagementRate = '5.8%',
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [uptimeStr, setUptimeStr] = useState('00:00:00');

  const {
    status,
    isLive,
    displayName: verifiedDisplayName,
    avatarUrl: verifiedAvatarUrl,
    viewerCount,
    title,
    startedAt,
    lastActiveAt,
    lastChecked,
    liveUrl,
    error,
    fromCache,
    isRefreshing,
    isThrottled,
    cooldownRemaining,
    refresh
  } = useTikTokLiveStatus(username);

  // Live session duration timer (only runs when stream is confirmed LIVE)
  useEffect(() => {
    if (!isLive || !startedAt) {
      setUptimeStr('00:00:00');
      return;
    }

    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      const diff = Math.max(0, Date.now() - start);
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptimeStr(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, startedAt]);

  const resolvedName = verifiedDisplayName || initialDisplayName || username;
  const cleanHandle = username.startsWith('@') ? username : `@${username}`;
  const resolvedAvatar = verifiedAvatarUrl || initialAvatarUrl || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedName)}&background=FE2C55&color=fff&size=256`;

  return (
    <div className={cn(
      "w-full rounded-[24px] border p-5 sm:p-6 transition-all duration-300 relative overflow-hidden backdrop-blur-xl",
      // Visual theme adapts dynamically to verified state
      isLive 
        ? "bg-[#140812] dark:bg-[#160A14]/95 border-[#FE2C55]/40 shadow-[0_0_35px_rgba(254,44,85,0.18)]"
        : status === LIVE_STATUS.STATUS_UNKNOWN
          ? "bg-slate-900/90 dark:bg-[#111827]/90 border-amber-500/30 shadow-sm"
          : "bg-white dark:bg-[#111827]/80 border-slate-200 dark:border-white/10 shadow-sm",
      className
    )}>
      {/* Background ambient glow when live */}
      {isLive && (
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#FE2C55]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      )}

      {/* TOP BAR: Status Indicator & Refresh Action */}
      <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-white/5">
        
        {/* State 1: 🟢 LIVE NOW */}
        {status === LIVE_STATUS.LIVE && (
          <div className="flex items-center gap-2 bg-[#FE2C55] text-white px-3 py-1 rounded-full shadow-[0_0_15px_rgba(254,44,85,0.6)] animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1 font-mono">
              <Radio size={12} className="animate-spin" />
              LIVE NOW
            </span>
          </div>
        )}

        {/* State 2: ⚫ OFFLINE */}
        {status === LIVE_STATUS.OFFLINE && (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full text-slate-600 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-gray-500"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Hors Ligne
            </span>
            {lastActiveAt && (
              <span className="text-[10px] text-slate-500 dark:text-gray-400 font-mono">
                • {formatRelativeTime(lastActiveAt)}
              </span>
            )}
          </div>
        )}

        {/* State 3: ⚠️ UNKNOWN / SYNC ERROR */}
        {status === LIVE_STATUS.STATUS_UNKNOWN && (
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-1 rounded-full">
            <AlertTriangle size={12} className="shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Vérification Inaccessible
            </span>
            <button 
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-amber-400/80 hover:text-amber-300 ml-0.5"
              title="Plus d'informations"
            >
              <Info size={12} />
            </button>
          </div>
        )}

        {/* Loading placeholder */}
        {status === LIVE_STATUS.LOADING && (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full text-slate-500">
            <RefreshCw size={12} className="animate-spin text-[#25F4EE]" />
            <span className="text-[11px] font-semibold">Vérification en cours...</span>
          </div>
        )}

        {/* Interactive Refresh Button with Throttle & Debounce */}
        <div className="flex items-center gap-2">
          {lastChecked && (
            <span className="text-[10px] font-mono text-slate-600 hidden sm:inline-block">
              {formatTimeOnly(lastChecked)}
            </span>
          )}

          <button
            onClick={refresh}
            disabled={isRefreshing || isThrottled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
              isThrottled
                ? "bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent cursor-not-allowed"
                : "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-white/10 active:scale-95 shadow-sm"
            )}
            title={isThrottled ? `Protection anti-spam active. Patientez ${cooldownRemaining}s` : "Actualiser le statut du streamer"}
          >
            <RefreshCw 
              size={12} 
              className={cn(
                "transition-transform",
                isRefreshing ? "animate-spin text-[#FE2C55]" : "",
                !isRefreshing && !isThrottled ? "hover:rotate-180 duration-300" : ""
              )} 
            />
            <span className="text-[11px]">
              {isRefreshing 
                ? "Scan..." 
                : isThrottled 
                  ? `${cooldownRemaining}s` 
                  : "Actualiser"}
            </span>
          </button>
        </div>
      </div>

      {/* SYNC ERROR INFO BANNER (if status === STATUS_UNKNOWN and tooltip open or error exists) */}
      {(showTooltip || (status === LIVE_STATUS.STATUS_UNKNOWN && error)) && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2 animate-fade-in">
          <Info size={14} className="shrink-0 mt-0.5 text-amber-400" />
          <div className="flex-1">
            <p className="font-semibold text-amber-300">Statut de diffusion temporairement non confirmé :</p>
            <p className="text-amber-200/80 mt-0.5">{error || "TikTok a limité temporairement l'accès aux flux (429/403) ou la connexion est instable. Par précaution, aucun faux badge 'LIVE' n'est affiché."}</p>
            <button 
              onClick={refresh}
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 underline hover:text-amber-200"
            >
              <RefreshCw size={10} />
              Forcer une nouvelle vérification
            </button>
          </div>
        </div>
      )}

      {/* CREATOR BODY: Avatar + Info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
        
        {/* Avatar with dynamic live glow */}
        <div className="relative shrink-0">
          <div className={cn(
            "w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 transition-all duration-500 relative",
            isLive 
              ? "bg-gradient-to-tr from-[#FE2C55] via-[#FF007F] to-[#25F4EE] shadow-[0_0_20px_rgba(254,44,85,0.6)] animate-spin-slow"
              : "bg-slate-200 dark:bg-white/10"
          )}>
            <img 
              src={resolvedAvatar} 
              alt={resolvedName} 
              className="w-full h-full object-cover rounded-full bg-slate-800"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedName)}&background=1F2937&color=fff&size=128`;
              }}
            />
          </div>

          {isLive && (
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FE2C55] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FE2C55] border-2 border-slate-900"></span>
            </span>
          )}
        </div>

        {/* Creator Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {resolvedName}
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#FE2C55]/10 text-[#FE2C55] px-2 py-0.5 rounded-full border border-[#FE2C55]/20">
              <ShieldCheck size={11} />
              Créateur
            </span>
          </div>

          <p className="text-xs font-mono text-slate-500 dark:text-gray-400 mt-0.5">
            {cleanHandle}
          </p>

          {/* Metrics row */}
          <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 text-[11px] font-semibold flex-wrap">
            {followersCount > 0 && (
              <span className="text-slate-600 dark:text-gray-300 flex items-center gap-1">
                <Users size={12} className="text-[#25F4EE]" />
                <span className="font-bold text-slate-900 dark:text-white font-mono">{formatNumber(followersCount)}</span>
                <span className="text-slate-400">abonnés</span>
              </span>
            )}

            {likesCount > 0 && (
              <span className="text-slate-600 dark:text-gray-300 flex items-center gap-1">
                <Heart size={12} className="text-[#FE2C55]" />
                <span className="font-bold text-[#FE2C55] font-mono">{formatNumber(likesCount)}</span>
                <span className="text-slate-400">likes</span>
              </span>
            )}

            {engagementRate && (
              <span className="text-slate-600 dark:text-gray-300 flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-400" />
                <span className="font-bold text-emerald-400 font-mono">{engagementRate}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* LIVE DETAILS BOX (When Live is Confirmed) */}
      {isLive && (
        <div className="mt-4 p-3.5 bg-[#FE2C55]/10 rounded-2xl border border-[#FE2C55]/25 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#FE2C55]">
              <Users size={14} className="animate-pulse" />
              <span className="text-sm font-black text-white font-mono">{formatNumber(viewerCount)}</span>
              <span className="text-[11px] opacity-80">spectateurs</span>
            </div>

            <span className="text-slate-600 dark:text-gray-600">•</span>

            <div className="flex items-center gap-1.5 text-xs text-gray-300 font-mono">
              <Clock size={12} className="text-[#FE2C55]" />
              <span>{uptimeStr}</span>
            </div>
          </div>

          {title && (
            <p className="text-xs text-gray-300 italic truncate max-w-[200px]" title={title}>
              "{title}"
            </p>
          )}
        </div>
      )}

      {/* CTA BUTTON BAR */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500 dark:text-gray-400 text-center sm:text-left">
          {isLive ? (
            <span className="text-[#FE2C55] font-bold flex items-center gap-1.5 justify-center sm:justify-start">
              <span className="w-2 h-2 rounded-full bg-[#FE2C55] animate-ping"></span>
              Session TikTok Webcast en direct
            </span>
          ) : status === LIVE_STATUS.STATUS_UNKNOWN ? (
            <span className="text-amber-400/90 flex items-center gap-1 justify-center sm:justify-start">
              <AlertTriangle size={12} />
              Statut non confirmé (accès TikTok restreint)
            </span>
          ) : (
            <span className="flex items-center gap-1 justify-center sm:justify-start">
              <WifiOff size={12} className="text-slate-500" />
              Aucune session live en cours
            </span>
          )}
        </div>

        <a
          href={isLive ? `https://www.tiktok.com/@${username}/live` : `https://www.tiktok.com/@${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-md",
            isLive
              ? "bg-[#FE2C55] hover:bg-[#E0264C] text-white shadow-[0_0_20px_rgba(254,44,85,0.5)] animate-pulse"
              : "bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10"
          )}
        >
          {isLive ? (
            <>
              <Radio size={13} className="animate-spin text-white" />
              <span>Rejoindre le Live</span>
              <ExternalLink size={13} />
            </>
          ) : (
            <>
              <span>Voir le Profil</span>
              <ExternalLink size={12} />
            </>
          )}
        </a>
      </div>
    </div>
  );
};

export default TikTokCreatorCard;
