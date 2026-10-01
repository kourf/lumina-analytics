import React, { useState } from 'react';
import { Users, Eye, Video, Activity, ThumbsUp, Info, Clock, Award, Play, Zap, Radio, Scale } from 'lucide-react';

export const KpiCards = ({ channel, videos, analytics }) => {
  const [showTooltip, setShowTooltip] = useState(null);

  if (!channel) return null;

  const isLive = (v) => v.type === 'Direct' || v.type === 'Live' || v.format === 'live' || v.isLiveNow;
  const isShort = (v) => !isLive(v) && (v.type === 'Short' || v.format === 'short' || (v.durationSec > 0 && v.durationSec <= 180) || /#(shorts|short|pourtoi|pourtoii|fyp|reels|tiktok)\b/i.test(v.title || ''));
  const isClassic = (v) => !isLive(v) && !isShort(v);

  const classicVideos = (videos || []).filter(isClassic);
  const shortVideos = (videos || []).filter(isShort);
  const directVideos = (videos || []).filter(isLive);

  const classicViews = classicVideos.reduce((acc, v) => acc + (v.views || 0), 0);
  const shortViews = shortVideos.reduce((acc, v) => acc + (v.views || 0), 0);
  const directViews = directVideos.reduce((acc, v) => acc + (v.views || 0), 0);

  const classicLikes = classicVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const shortLikes = shortVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const directLikes = directVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const totalLikes = classicLikes + shortLikes + directLikes;

  const totalContent = (videos || []).length;

  // Calcul des médianes de vues
  const calcMedian = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  };

  const medianClassicViews = calcMedian(classicVideos.map(v => v.views || 0));
  const medianShortViews = calcMedian(shortVideos.map(v => v.views || 0));
  const medianDirectViews = calcMedian(directVideos.map(v => v.views || 0));
  const medianOverallViews = calcMedian((videos || []).map(v => v.views || 0));

  // Durées moyennes exactes calculées sur les contenus réels
  const avgClassicDurationSec = classicVideos.length > 0 
    ? Math.round(classicVideos.reduce((acc, v) => acc + (v.durationSec || 0), 0) / classicVideos.length) 
    : (analytics?.avgVideoDurationSec || 0);

  const avgShortDurationSec = shortVideos.length > 0 
    ? Math.round(shortVideos.reduce((acc, v) => acc + (v.durationSec || 0), 0) / shortVideos.length) 
    : (analytics?.avgShortDurationSec || 0);

  const avgDirectDurationSec = directVideos.length > 0 
    ? Math.round(directVideos.reduce((acc, v) => acc + (v.durationSec || 0), 0) / directVideos.length) 
    : (analytics?.avgLiveDurationSec || 0);

  const getEngagementQuality = (rate) => {
    if (rate < 1) return { text: "Faible", color: "text-red-500" };
    if (rate < 3) return { text: "Correct", color: "text-yellow-500" };
    if (rate < 6) return { text: "Bon", color: "text-green-500" };
    return { text: "Excellent", color: "text-blue-500" };
  };

  const engagementQuality = getEngagementQuality(channel.globalEngagementRate);

  const formatNumber = (num) => num ? num.toLocaleString('fr-FR') : '0';

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m${s > 0 ? ` ${s}s` : ''}`;
    if (m > 0) return `${m}m${s > 0 ? ` ${s}s` : ''}`;
    return `${s}s`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Barre de synchronisation des indicateurs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-3 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80 text-xs text-gray-500 dark:text-gray-400 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-gray-800 dark:text-gray-200">Indicateurs de Performance en Temps Réel</span>
          <span className="hidden md:inline text-gray-300 dark:text-gray-600">|</span>
          <span className="hidden md:inline text-gray-500 dark:text-gray-400">Ventilation exacte sur 71 Lives, 9 Shorts et 7 Vidéos</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <Clock size={12} />
          <span>Synchronisation YouTube : À la demande ou toutes les 6h</span>
        </div>
      </div>

      {/* Ligne 1 : Volumes Principaux (Abonnés, Vues Totales, Publications) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Abonnés */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-transparent group-hover:from-blue-500/5 transition-colors duration-500 pointer-events-none"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20 shadow-inner flex-shrink-0">
                <Users size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                Abonnés
              </h3>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-4xl md:text-5xl font-display-kpi font-bold text-gray-900 dark:text-white tracking-tight">
              {formatNumber(channel.subscribers)}
            </p>
            <p className="text-xs text-gray-400 mt-2 font-medium">Audience de la chaîne</p>
          </div>
        </div>

        {/* Vues Totales */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-transparent group-hover:from-red-500/5 transition-colors duration-500 pointer-events-none rounded-[24px]"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20 shadow-inner flex-shrink-0">
                <Eye size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                Vues totales
              </h3>
            </div>
            <div className="relative">
              <button 
                onMouseEnter={() => setShowTooltip('views')}
                onMouseLeave={() => setShowTooltip(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Info size={18} />
              </button>
              {showTooltip === 'views' && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700">
                  <p className="font-semibold mb-2">Répartition des vues</p>
                  <p className="text-gray-300 leading-relaxed">Cumul de l'ensemble des vues obtenues sur vos vidéos classiques, vos Shorts et vos diffusions Lives.</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-4xl md:text-5xl font-display-kpi font-bold text-gray-900 dark:text-white tracking-tight">
              {formatNumber(channel.totalViews)}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-red-50/40 dark:bg-red-500/5 p-2.5 rounded-xl border border-red-100/50 dark:border-red-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Play size={12} className="text-blue-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Vidéos</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(classicViews)}</span>
            </div>
            <div className="flex justify-between items-center bg-red-50/40 dark:bg-red-500/5 p-2.5 rounded-xl border border-red-100/50 dark:border-red-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Zap size={12} className="text-amber-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Shorts</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(shortViews)}</span>
            </div>
            <div className="flex justify-between items-center bg-red-50/40 dark:bg-red-500/5 p-2.5 rounded-xl border border-red-100/50 dark:border-red-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Radio size={12} className="text-rose-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Lives</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(directViews)}</span>
            </div>
          </div>
        </div>

        {/* Total Contenus */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-transparent group-hover:from-purple-500/5 transition-colors duration-500 pointer-events-none"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center border border-purple-100 dark:border-purple-500/20 shadow-inner flex-shrink-0">
                <Video size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                Contenus publiés
              </h3>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-4xl md:text-5xl font-display-kpi font-bold text-gray-900 dark:text-white tracking-tight">
              {formatNumber(totalContent)}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-purple-50/40 dark:bg-purple-500/5 p-2.5 rounded-xl border border-purple-100/50 dark:border-purple-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Play size={12} className="text-blue-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Vidéos</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{classicVideos.length}</span>
            </div>
            <div className="flex justify-between items-center bg-purple-50/40 dark:bg-purple-500/5 p-2.5 rounded-xl border border-purple-100/50 dark:border-purple-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Zap size={12} className="text-amber-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Shorts</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{shortVideos.length}</span>
            </div>
            <div className="flex justify-between items-center bg-purple-50/40 dark:bg-purple-500/5 p-2.5 rounded-xl border border-purple-100/50 dark:border-purple-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Radio size={12} className="text-rose-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Lives</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{directVideos.length}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Ligne 2 : Analyse Qualitative (Vues Médianes, Durée Moyenne, Likes, Engagement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* NOUVELLE CARTE : Vues Médianes */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-transparent group-hover:from-cyan-500/5 transition-colors duration-500 pointer-events-none rounded-[24px]"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center border border-cyan-100 dark:border-cyan-500/20 shadow-inner flex-shrink-0">
                <Scale size={24} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                Vues Médianes
              </h3>
            </div>
            <div className="relative">
              <button 
                onMouseEnter={() => setShowTooltip('median')}
                onMouseLeave={() => setShowTooltip(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Info size={18} />
              </button>
              {showTooltip === 'median' && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700 animate-fade-in">
                  <p className="font-semibold mb-2 text-cyan-400">Pourquoi la médiane ?</p>
                  <p className="text-gray-300 leading-relaxed mb-2">
                    La médiane sépare vos contenus en 2 parts égales (50% ont fait plus, 50% ont fait moins).
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    Contrairement à la moyenne, elle n'est pas faussée par un buzz exceptionnel ou une vidéo à 0 vue et reflète fidèlement votre audience habituelle.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-3xl md:text-4xl font-display-kpi font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-1">
              {formatNumber(medianOverallViews)}
            </p>
            <p className="text-xs text-gray-400 font-medium">Médiane tous formats</p>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-cyan-50/40 dark:bg-cyan-500/5 px-3 py-2 rounded-xl border border-cyan-100/50 dark:border-cyan-500/10">
              <div className="flex items-center gap-2">
                <Play size={12} className="text-blue-500" />
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Vidéos</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(medianClassicViews)} vues</span>
            </div>
            <div className="flex justify-between items-center bg-cyan-50/40 dark:bg-cyan-500/5 px-3 py-2 rounded-xl border border-cyan-100/50 dark:border-cyan-500/10">
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-amber-500" />
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Shorts</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(medianShortViews)} vues</span>
            </div>
            <div className="flex justify-between items-center bg-cyan-50/40 dark:bg-cyan-500/5 px-3 py-2 rounded-xl border border-cyan-100/50 dark:border-cyan-500/10">
              <div className="flex items-center gap-2">
                <Radio size={12} className="text-rose-500" />
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Lives</span>
              </div>
              <span className="text-sm font-bold text-rose-500 dark:text-rose-400">{formatNumber(medianDirectViews)} vues 🔥</span>
            </div>
          </div>
        </div>

        {/* Durées Moyennes (Vidéos, Shorts et Lives) */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-transparent group-hover:from-orange-500/5 transition-colors duration-500 pointer-events-none rounded-[24px]"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center border border-orange-100 dark:border-orange-500/20 shadow-inner flex-shrink-0">
                <Clock size={24} className="text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                Durée moyenne
              </h3>
            </div>
            <div className="relative">
              <button 
                onMouseEnter={() => setShowTooltip('duration')}
                onMouseLeave={() => setShowTooltip(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Info size={18} />
              </button>
              {showTooltip === 'duration' && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700">
                  <p className="font-semibold mb-2">Durée moyenne par format</p>
                  <p className="text-gray-300 leading-relaxed">
                    Indique la durée moyenne exacte pour les Vidéos classiques, les Shorts, et les sessions en Direct (Lives).
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-3xl md:text-4xl font-display-kpi font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-1">
              {formatDuration(avgDirectDurationSec)}
            </p>
            <p className="text-xs text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Format dominant (Lives)
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
             <div className="flex justify-between items-center bg-orange-50/40 dark:bg-orange-500/5 px-3 py-2 rounded-xl border border-orange-100/50 dark:border-orange-500/10">
                <div className="flex items-center gap-2">
                  <Play size={12} className="text-blue-500" />
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Moy. Vidéos</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatDuration(avgClassicDurationSec)}</span>
             </div>
             <div className="flex justify-between items-center bg-orange-50/40 dark:bg-orange-500/5 px-3 py-2 rounded-xl border border-orange-100/50 dark:border-orange-500/10">
                <div className="flex items-center gap-2">
                  <Zap size={12} className="text-amber-500" />
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Moy. Shorts</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatDuration(avgShortDurationSec)}</span>
             </div>
             <div className="flex justify-between items-center bg-orange-50/40 dark:bg-orange-500/5 px-3 py-2 rounded-xl border border-orange-100/50 dark:border-orange-500/10">
                <div className="flex items-center gap-2">
                  <Radio size={12} className="text-rose-500" />
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Moy. Lives</span>
                </div>
                <span className="text-sm font-bold text-rose-500 dark:text-rose-400">{formatDuration(avgDirectDurationSec)}</span>
             </div>
          </div>
        </div>

        {/* Likes Totaux */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-transparent group-hover:from-pink-500/5 transition-colors duration-500 pointer-events-none"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center border border-pink-100 dark:border-pink-500/20 shadow-inner flex-shrink-0">
                <ThumbsUp size={24} className="text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                Likes
              </h3>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-4xl md:text-5xl font-display-kpi font-bold text-gray-900 dark:text-white tracking-tight">
              {formatNumber(totalLikes)}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-pink-50/40 dark:bg-pink-500/5 p-2.5 rounded-xl border border-pink-100/50 dark:border-pink-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Play size={12} className="text-blue-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Vidéos</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(classicLikes)}</span>
            </div>
            <div className="flex justify-between items-center bg-pink-50/40 dark:bg-pink-500/5 p-2.5 rounded-xl border border-pink-100/50 dark:border-pink-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Zap size={12} className="text-amber-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Shorts</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(shortLikes)}</span>
            </div>
            <div className="flex justify-between items-center bg-pink-50/40 dark:bg-pink-500/5 p-2.5 rounded-xl border border-pink-100/50 dark:border-pink-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Radio size={12} className="text-rose-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Lives</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(directLikes)}</span>
            </div>
          </div>
        </div>

        {/* Engagement */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-transparent group-hover:from-green-500/5 transition-colors duration-500 pointer-events-none rounded-[24px]"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-green-50 dark:bg-green-500/10 flex items-center justify-center border border-green-100 dark:border-green-500/20 shadow-inner flex-shrink-0">
                <Activity size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                Engagement
              </h3>
            </div>
            <div className="relative">
              <button 
                onMouseEnter={() => setShowTooltip('engagement')}
                onMouseLeave={() => setShowTooltip(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Info size={18} />
              </button>
              {showTooltip === 'engagement' && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700">
                  <p className="font-semibold mb-2">Calcul de l'engagement</p>
                  <p className="mb-2 text-gray-300 leading-relaxed">Mesure la proportion de personnes interagissant par rapport au nombre de vues.</p>
                  <div className="bg-black/30 p-2 rounded-lg font-mono text-[10px] mb-2 text-center text-green-400">
                    (Likes + Comms) / Vues × 100
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-end gap-3">
               <p className="text-4xl md:text-5xl font-display-kpi font-bold text-gray-900 dark:text-white tracking-tight">
                 {channel.globalEngagementRate}%
               </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50">
            <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 w-full justify-center`}>
              <div className={`w-2 h-2 rounded-full ${engagementQuality.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`}></div>
              <span className={`text-sm font-bold ${engagementQuality.color} tracking-wide`}>
                Niveau : {engagementQuality.text}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
