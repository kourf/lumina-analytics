import React from 'react';
import { Radio, ExternalLink, ShieldCheck, Users, Heart, TrendingUp } from 'lucide-react';
import { TikTokIcon } from '../SocialIcons';
import { cn } from '../../lib/utils';

export const TikTokHeader = ({ user, isLive, onRefresh }) => {
  const followersCount = user?.followers || 6084;
  const likesCount = user?.likes || 15779;
  const displayName = user?.display_name || user?.username || 'Karam';
  const cleanUsername = user?.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : '@karam.drame';
  const avatarUrl = user?.avatar_url || user?.profilePic || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";

  return (
    <div className={cn(
      "w-full rounded-[28px] border shadow-[0_12px_40px_rgba(0,0,0,0.12)] relative overflow-hidden backdrop-blur-2xl transition-all duration-500",
      isLive 
        ? "bg-[#140812] dark:bg-[#160A14]/95 border-[#FE2C55]/40 shadow-[0_0_45px_rgba(254,44,85,0.2)]" 
        : "bg-[#0F172A] dark:bg-[#111827]/90 border-slate-700/50 dark:border-white/10"
    )}>
      
      {/* Bannière Mesh Cyber Glow (Dynamique en Live) */}
      <div className={cn(
        "h-32 md:h-44 w-full relative overflow-hidden transition-all duration-500",
        isLive 
          ? "bg-gradient-to-r from-[#3B0715] via-[#4C0519] to-[#160B28]" 
          : "bg-gradient-to-r from-[#0D1527] via-[#111C38] to-[#1E1026]"
      )}>
        
        {/* Glows d'ambiance */}
        {isLive ? (
          <>
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FE2C55]/25 rounded-full blur-3xl pointer-events-none -translate-y-1/2 animate-pulse"></div>
            <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-[#25F4EE]/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
          </>
        ) : (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#25F4EE]/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
            <div className="absolute top-0 right-10 w-96 h-96 bg-[#FE2C55]/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
          </>
        )}
        
        {/* Motif de grille high-tech subtil */}
        <div 
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Statut Système : EN DIRECT vs FLUX CONNECTÉ */}
        <div className="absolute top-4 right-6 flex items-center gap-3">
          {isLive ? (
            <div className="flex items-center gap-2.5 bg-[#FE2C55] text-white border border-white/20 px-4 py-1.5 rounded-full shadow-[0_0_25px_rgba(254,44,85,0.6)] animate-pulse">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Radio size={13} className="animate-spin" />
                EN LIVE SUR TIKTOK
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-gray-300 text-xs font-medium">Flux Connecté</span>
            </div>
          )}
        </div>

      </div>

      {/* Contenu Profil Inférieur */}
      <div className="px-6 md:px-10 pb-8 pt-0 relative flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6 -mt-16 md:-mt-20">
        
        {/* Avatar + Infos créateur */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-7 text-center md:text-left z-10">
          
          <div className="relative group shrink-0">
            <div className={cn(
              "w-28 h-28 md:w-36 md:h-36 rounded-full p-1.5 transition-all duration-500 shadow-2xl relative",
              isLive 
                ? "bg-gradient-to-tr from-[#FE2C55] via-[#FF007F] to-[#25F4EE] shadow-[0_0_35px_rgba(254,44,85,0.6)] animate-spin-slow" 
                : "bg-gradient-to-tr from-slate-700 to-slate-800 border-2 border-white/10"
            )}>
              <img 
                src={avatarUrl} 
                alt={displayName} 
                className="w-full h-full object-cover rounded-full bg-slate-900 border-2 border-black/40"
              />
            </div>

            <div className="absolute -bottom-1 -right-1 bg-black text-white p-2 rounded-full border-2 border-slate-800 shadow-lg group-hover:scale-110 transition-transform">
              <TikTokIcon className="w-4 h-4 fill-current" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pb-2">
            <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {displayName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FE2C55]/15 text-[#FE2C55] border border-[#FE2C55]/30">
                <ShieldCheck size={13} className="text-[#FE2C55]" />
                Créateur Certifié
              </span>
            </div>

            <p className="text-sm font-medium text-gray-400 font-mono flex items-center justify-center md:justify-start gap-2">
              <span>{cleanUsername}</span>
              <span className="w-1 h-1 rounded-full bg-gray-500" />
              <span className="text-gray-400">TikTok Live Creator</span>
            </p>

            <div className="flex items-center justify-center md:justify-start gap-3 pt-2 text-xs font-semibold">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl text-gray-300">
                <Users size={13} className="text-cyan-400" />
                <span className="font-bold text-white font-mono">{new Intl.NumberFormat('fr-FR').format(followersCount)}</span>
                <span className="text-gray-400 text-[11px]">Abonnés</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl text-gray-300">
                <Heart size={13} className="text-[#FE2C55]" />
                <span className="font-bold text-[#FE2C55] font-mono">{new Intl.NumberFormat('fr-FR').format(likesCount)}</span>
                <span className="text-gray-400 text-[11px]">Likes</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl text-gray-300">
                <TrendingUp size={13} className="text-emerald-400" />
                <span className="font-bold text-emerald-400 font-mono">5.8%</span>
                <span className="text-gray-400 text-[11px]">Engagement</span>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-wrap items-center justify-center md:justify-end gap-3 pt-2 lg:pt-0">
          <a 
            href={isLive ? `https://tiktok.com/@${cleanUsername.replace('@', '')}/live` : (user?.links?.tiktok || `https://tiktok.com/@${cleanUsername.replace('@', '')}`)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 group shadow-lg",
              isLive
                ? "bg-[#FE2C55] hover:bg-[#E0264C] text-white shadow-[0_0_30px_rgba(254,44,85,0.5)] hover:shadow-[0_0_40px_rgba(254,44,85,0.7)] animate-pulse"
                : "bg-gradient-to-r from-[#FE2C55] to-[#FF416C] hover:from-[#E0264C] hover:to-[#FE2C55] text-white shadow-[0_4px_16px_rgba(254,44,85,0.25)] hover:shadow-[0_6px_20px_rgba(254,44,85,0.4)]"
            )}
          >
            {isLive ? (
              <>
                <Radio className="w-4 h-4 animate-spin text-white" />
                <span>Rejoindre le Live</span>
                <ExternalLink size={14} className="opacity-90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </>
            ) : (
              <>
                <TikTokIcon className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                <span>Ouvrir TikTok</span>
                <ExternalLink size={13} className="opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </>
            )}
          </a>
        </div>
      </div>
    </div>
  );
};

export default TikTokHeader;
