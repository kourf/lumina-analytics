import React from 'react';
import { Radio, ExternalLink, ShieldCheck, Users, Heart, TrendingUp, Flame } from 'lucide-react';
import { TikTokIcon } from '../SocialIcons';
import { cn } from '../../lib/utils';

export const TikTokHeader = ({ user, isLive, onToggleLive, onRefresh }) => {
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

        {/* Equalizer audio animé en mode Live */}
        {isLive && (
          <div className="absolute bottom-3 right-6 hidden sm:flex items-end gap-1 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
            <span className="w-1 h-3 bg-[#FE2C55] rounded-full animate-bounce"></span>
            <span className="w-1 h-5 bg-[#25F4EE] rounded-full animate-bounce [animation-delay:0.15s]"></span>
            <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:0.3s]"></span>
            <span className="w-1 h-6 bg-[#FE2C55] rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1 h-4 bg-[#25F4EE] rounded-full animate-bounce [animation-delay:0.35s]"></span>
            <span className="text-[10px] font-bold text-gray-300 ml-1.5 font-mono">STREAM ACTIF</span>
          </div>
        )}
      </div>

      {/* Contenu Profil & Actions */}
      <div className="px-6 md:px-8 pb-7 flex flex-col lg:flex-row lg:items-end justify-between relative mt-[-45px] md:mt-[-55px] gap-6">
        
        {/* Profil Gauche : Avatar + Badges + Bio */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
          
          {/* Avatar Container avec Glow dynamique en Live */}
          <div className="relative shrink-0 group">
            <div className={cn(
              "w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden bg-slate-800 relative z-10 transition-transform duration-300 group-hover:scale-[1.02]",
              isLive 
                ? "border-4 border-[#FE2C55] shadow-[0_0_30px_rgba(254,44,85,0.6)] ring-4 ring-[#FE2C55]/30" 
                : "border-4 border-[#0F172A] dark:border-[#111827] shadow-2xl"
            )}>
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.target.src = "https://ui-avatars.com/api/?name=Karam&background=FE2C55&color=fff&size=200";
                }}
              />
            </div>
            
            {/* Badge Live Pulsant sous l'Avatar */}
            {isLive && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FE2C55] text-white text-[10px] font-black px-3 py-0.5 rounded-full border-2 border-[#111827] flex items-center gap-1.5 shadow-[0_0_15px_rgba(254,44,85,0.8)] z-20 uppercase tracking-wider animate-pulse">
                <Radio size={11} />
                LIVE
              </div>
            )}
          </div>
          
          {/* Infos Textuelles & Mini-KPIs */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                {displayName}
                <span className="text-sm font-semibold text-gray-400 font-mono">{cleanUsername}</span>
              </h1>
              
              <span className="inline-flex items-center gap-1 bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                <ShieldCheck size={13} />
                Vérifié
              </span>

              {isLive && (
                <span className="inline-flex items-center gap-1 bg-[#FE2C55]/20 text-[#FE2C55] border border-[#FE2C55]/30 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono animate-pulse">
                  <Flame size={12} />
                  En Direct
                </span>
              )}
            </div>

            <p className="text-xs md:text-sm text-gray-300 max-w-xl leading-relaxed">
              {isLive 
                ? "🎙️ Karamokho est actuellement en Live sur TikTok ! Rejoignez le live pour poser vos questions en direct."
                : (user?.bio_description || "Créateur de contenu & Stratège Freelance | Analyses en direct, webdesign & automatisation.")
              }
            </p>

            {/* Quick Metrics Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1 text-xs">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl text-gray-300">
                <Users size={13} className="text-[#25F4EE]" />
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

        {/* Actions Droite : Commutateur Live Créateur + Bouton TikTok */}
        <div className="shrink-0 flex flex-wrap items-center justify-center md:justify-end gap-3 pt-2 lg:pt-0">
          
          {/* Bouton Commutateur Direct Créateur */}
          <button
            onClick={onToggleLive}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-lg border",
              isLive
                ? "bg-slate-900/90 hover:bg-slate-800 text-white border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                : "bg-[#FE2C55]/15 hover:bg-[#FE2C55]/25 text-[#FE2C55] border-[#FE2C55]/40 shadow-[0_0_20px_rgba(254,44,85,0.2)]"
            )}
            title={isLive ? "Cliquez pour terminer et archiver la session live" : "Cliquez pour activer immédiatement le live sur le dashboard"}
          >
            <span className={cn(
              "w-2.5 h-2.5 rounded-full",
              isLive ? "bg-white animate-ping" : "bg-[#FE2C55] animate-pulse"
            )}></span>
            <span>{isLive ? "⚪ Terminer le Live" : "🔴 Activer le Live"}</span>
          </button>

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
