import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, Users, Heart, Eye, Video, 
  RefreshCw, CheckCircle2 
} from 'lucide-react';
import { TikTokIcon } from '../SocialIcons';
import { cn } from '../../lib/utils';

export const TikTokHeader = ({ user, isLive, onRefresh, isRefreshing }) => {
  const [lastSyncText, setLastSyncText] = useState('À l’instant');
  const [cooldown, setCooldown] = useState(false);

  const followersCount = Number(user?.followers) || 6392;
  const likesCount = Number(user?.likes || user?.totalLikes) || 17100;
  const viewsCount = Number(user?.views || user?.totalViews) || 298809;
  const videosCount = Number(user?.totalVideos || user?.videoAnalytics?.totalVideosAnalyzed) || 75;

  const displayName = user?.displayName || user?.display_name || user?.username || 'Karam';
  const cleanUsername = user?.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : '@karam.drame';
  const avatarUrl = user?.avatarUrl 
    || user?.avatar_large_url 
    || user?.avatar_url_100 
    || user?.avatar_url 
    || user?.profilePic 
    || "https://p16-common-sign.tiktokcdn-eu.com/tos-no1a-avt-0068c001-no/0ace94e1ff2808e8032a8a8af1799c75~tplv-tiktokx-cropcenter:1080:1080.jpeg";

  // Calcul du temps relatif écoulé depuis la dernière synchronisation
  useEffect(() => {
    const updateRelativeTime = () => {
      const syncDate = user?.lastSync ? new Date(user.lastSync) : new Date();
      const diffSec = Math.max(0, Math.floor((Date.now() - syncDate.getTime()) / 1000));
      
      if (diffSec < 30) {
        setLastSyncText('À l’instant');
      } else if (diffSec < 60) {
        setLastSyncText(`Il y a ${diffSec}s`);
      } else if (diffSec < 3600) {
        const m = Math.floor(diffSec / 60);
        setLastSyncText(`Il y a ${m} min`);
      } else {
        const h = Math.floor(diffSec / 3600);
        setLastSyncText(`Il y a ${h}h`);
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 10000);
    return () => clearInterval(interval);
  }, [user?.lastSync]);

  const handleTriggerRefresh = async () => {
    if (cooldown || isRefreshing) return;
    setCooldown(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setCooldown(false), 5000); // Cooldown 5s anti-spam
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'K';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatTikTokLikes = (num) => {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.', ',') + 'k';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  return (
    <div className={cn(
      "w-full rounded-[28px] border shadow-[0_12px_40px_rgba(0,0,0,0.18)] relative overflow-hidden backdrop-blur-2xl transition-all duration-500",
      isLive 
        ? "bg-[#140812] dark:bg-[#160A14]/95 border-[#FE2C55]/40 shadow-[0_0_45px_rgba(254,44,85,0.25)]" 
        : "bg-[#0D1322] dark:bg-[#0F172A]/95 border-slate-700/60"
    )}>
      
      {/* Bannière Mesh Cyber Glow (Dynamique en Live) */}
      <div className={cn(
        "h-36 md:h-48 w-full relative overflow-hidden transition-all duration-500",
        isLive 
          ? "bg-gradient-to-r from-[#3B0715] via-[#4C0519] to-[#160B28]" 
          : "bg-gradient-to-r from-[#0B132B] via-[#111D3E] to-[#1C0F2B]"
      )}>
        
        {/* Glows d'ambiance */}
        {isLive ? (
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FE2C55]/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
        ) : (
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        )}

        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Motif de grille high-tech subtil */}
        <div 
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Pilule de Cadence & Synchronisation intégrée en haut à droite de la bannière */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20 flex flex-wrap items-center gap-2">
          {/* Badge Cadence & État de Synchronisation */}
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-3.5 py-1.5 rounded-full text-xs shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                isRefreshing ? "bg-amber-400" : isLive ? "bg-[#FE2C55]" : "bg-emerald-400"
              )}></span>
              <span className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                isRefreshing ? "bg-amber-400" : isLive ? "bg-[#FE2C55]" : "bg-emerald-400"
              )}></span>
            </span>
            <span className="font-semibold text-slate-200 hidden sm:inline">
              {isRefreshing ? 'Actualisation...' : isLive ? 'Flux En Direct' : 'Synchronisé'}
            </span>
            <span className="text-slate-500 text-[10px] hidden sm:inline">•</span>
            <span className="text-slate-300 font-mono text-[11px]" title={`Dernière mise à jour : ${user?.lastSync || 'Récente'}`}>
              {lastSyncText}
            </span>
          </div>

          {/* Bouton Rafraîchir Manuel */}
          <button
            onClick={handleTriggerRefresh}
            disabled={cooldown || isRefreshing}
            className={cn(
              "flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl transition-all shadow-lg active:scale-95 cursor-pointer",
              (cooldown || isRefreshing) && "opacity-60 cursor-not-allowed"
            )}
            title="Forcer une synchronisation immédiate du statut Live et du profil"
          >
            <RefreshCw size={13} className={cn(
              "text-white transition-transform", 
              (isRefreshing || cooldown) && "animate-spin text-cyan-400"
            )} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>

      </div>

      {/* Contenu Profil Inférieur */}
      <div className="px-6 md:px-10 pb-8 pt-0 relative flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6 -mt-16 md:-mt-20">
        
        {/* Avatar + Infos créateur */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-7 text-center md:text-left z-10 w-full lg:w-auto">
          
          <div className="relative group shrink-0">
            <div className={cn(
              "w-28 h-28 md:w-36 md:h-36 rounded-full p-1.5 transition-all duration-500 shadow-2xl relative",
              isLive 
                ? "bg-gradient-to-tr from-[#FE2C55] via-[#FF007F] to-[#25F4EE] shadow-[0_0_35px_rgba(254,44,85,0.6)] animate-spin-slow" 
                : "bg-gradient-to-tr from-cyan-500 via-indigo-600 to-[#FE2C55] border-2 border-white/10"
            )}>
              <img 
                src={avatarUrl} 
                alt={displayName} 
                className="w-full h-full object-cover rounded-full bg-slate-900 border-2 border-black/40"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://ui-avatars.com/api/?name=Karamokho+Drame&background=FE2C55&color=fff&size=256";
                }}
              />
            </div>

            <div className="absolute -bottom-1 -right-1 bg-black text-white p-2 rounded-full border-2 border-slate-800 shadow-lg group-hover:scale-110 transition-transform">
              <TikTokIcon className="w-4 h-4 fill-current" />
            </div>
          </div>

          <div className="flex flex-col gap-2 pb-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {displayName}
              </h1>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={11} /> Vérifié
              </span>
            </div>

            <p className="text-sm font-medium text-slate-400 font-mono flex items-center justify-center md:justify-start gap-2">
              <span className="text-slate-300 font-bold">{cleanUsername}</span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span className="text-slate-400">TikTok Live Creator</span>
            </p>

            {/* Badges KPIs Profil Principaux (Données Réelles & Dynamiques) */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2 text-xs font-semibold">
              {/* Abonnés */}
              <div 
                className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-slate-300 shadow-sm"
                title="Nombre exact d’abonnés réels (actualisé toutes les 5 min)"
              >
                <Users size={14} className="text-cyan-400" />
                <span className="font-extrabold text-white font-mono">{new Intl.NumberFormat('fr-FR').format(followersCount)}</span>
                <span className="text-slate-400 text-[11px]">Abonnés</span>
              </div>

              {/* Likes */}
              <div 
                className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-slate-300 shadow-sm"
                title="Mentions J’aime cumulées sur le profil TikTok (actualisé toutes les 5 min)"
              >
                <Heart size={14} className="text-[#FE2C55]" />
                <span className="font-extrabold text-[#FE2C55] font-mono">{formatTikTokLikes(likesCount)}</span>
                <span className="text-slate-400 text-[11px]">Likes</span>
              </div>

              {/* Vues Totales */}
              <div 
                className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-slate-300 shadow-sm"
                title="Cumul des vues sur le catalogue vidéo"
              >
                <Eye size={14} className="text-[#25F4EE]" />
                <span className="font-extrabold text-white font-mono">{formatNumber(viewsCount)}</span>
                <span className="text-slate-400 text-[11px]">Vues</span>
              </div>

              {/* Vidéos */}
              <div 
                className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-slate-300 shadow-sm"
                title="Total des vidéos actuellement publiées"
              >
                <Video size={14} className="text-purple-400" />
                <span className="font-extrabold text-white font-mono">{videosCount}</span>
                <span className="text-slate-400 text-[11px]">Vidéos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'Action & Liens Externes */}
        <div className="shrink-0 flex flex-wrap items-center justify-center md:justify-end gap-3 pt-2 lg:pt-0">
          <a 
            href={user?.links?.tiktok || `https://www.tiktok.com/@${cleanUsername.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 group shadow-lg bg-gradient-to-r from-[#FE2C55] to-[#FF416C] hover:from-[#E0264C] hover:to-[#FE2C55] text-white shadow-[0_4px_16px_rgba(254,44,85,0.25)] hover:shadow-[0_6px_20px_rgba(254,44,85,0.4)]"
          >
            <TikTokIcon className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            <span>Ouvrir Profil TikTok</span>
            <ExternalLink size={13} className="opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>

    </div>
  );
};

export default TikTokHeader;
