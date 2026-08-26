import React, { useState } from 'react';
import { Users, Eye, Video, Activity, ThumbsUp, Info, Clock, Award, Play, Zap, Radio } from 'lucide-react';

export const KpiCards = ({ channel, videos, analytics }) => {
  const [showEngagementTooltip, setShowEngagementTooltip] = useState(false);

  if (!channel) return null;

  const classicVideos = (videos || []).filter(v => v.type === 'Vidéo' || v.type === 'Video');
  const shortVideos = (videos || []).filter(v => v.type === 'Short');
  const directVideos = (videos || []).filter(v => v.type === 'Direct');

  const classicViews = classicVideos.reduce((acc, v) => acc + (v.views || 0), 0);
  const shortViews = shortVideos.reduce((acc, v) => acc + (v.views || 0), 0);
  const directViews = directVideos.reduce((acc, v) => acc + (v.views || 0), 0);

  const classicLikes = classicVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const shortLikes = shortVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const directLikes = directVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const totalLikes = classicLikes + shortLikes + directLikes;

  const totalContent = (videos || []).length;

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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m${s > 0 ? ` ${s}s` : ''}`;
    return `${s}s`;
  };

  // Calcul de la "Meilleure Durée" (basé sur le format ayant la meilleure moyenne de vues par contenu)
  const avgViewsClassic = classicVideos.length > 0 ? classicViews / classicVideos.length : 0;
  const avgViewsShorts = shortVideos.length > 0 ? shortViews / shortVideos.length : 0;
  const bestFormat = avgViewsShorts > avgViewsClassic ? 'Shorts' : 'Vidéos';
  const bestDuration = avgViewsShorts > avgViewsClassic 
    ? formatDuration(analytics?.avgShortDurationSec || 0)
    : formatDuration(analytics?.avgVideoDurationSec || 0);

  const avgDirectDurationSec = directVideos.length > 0 ? directVideos.reduce((acc, v) => acc + (v.durationSec || 0), 0) / directVideos.length : 0;

  return (
    <div className="flex flex-col gap-6">
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
                onMouseEnter={() => setShowEngagementTooltip('views')}
                onMouseLeave={() => setShowEngagementTooltip(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Info size={18} />
              </button>
              {/* Infobulle */}
              {showEngagementTooltip === 'views' && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700">
                  <p className="font-semibold mb-2">Répartition des vues</p>
                  <p className="text-gray-300 leading-relaxed">Divise vos vues totales selon le format de contenu pour identifier ce qui fonctionne.</p>
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
                  <Play size={12} className="text-red-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Vidéos</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(classicViews)}</span>
            </div>
            <div className="flex justify-between items-center bg-red-50/40 dark:bg-red-500/5 p-2.5 rounded-xl border border-red-100/50 dark:border-red-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Zap size={12} className="text-red-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Shorts</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(shortViews)}</span>
            </div>
            <div className="flex justify-between items-center bg-red-50/40 dark:bg-red-500/5 p-2.5 rounded-xl border border-red-100/50 dark:border-red-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Radio size={12} className="text-red-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Directs</span>
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
                Vidéos publiées
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
                  <Play size={12} className="text-purple-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Vidéos</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{classicVideos.length}</span>
            </div>
            <div className="flex justify-between items-center bg-purple-50/40 dark:bg-purple-500/5 p-2.5 rounded-xl border border-purple-100/50 dark:border-purple-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Zap size={12} className="text-purple-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Shorts</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{shortVideos.length}</span>
            </div>
            <div className="flex justify-between items-center bg-purple-50/40 dark:bg-purple-500/5 p-2.5 rounded-xl border border-purple-100/50 dark:border-purple-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Radio size={12} className="text-purple-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Directs</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{directVideos.length}</span>
            </div>
          </div>
        </div>

        {/* Durées Moyennes */}
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
                onMouseEnter={() => setShowEngagementTooltip('duration')}
                onMouseLeave={() => setShowEngagementTooltip(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Info size={18} />
              </button>
              {showEngagementTooltip === 'duration' && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700">
                  <p className="font-semibold mb-2">Choix de la meilleure durée</p>
                  <p className="text-gray-300 leading-relaxed">L'app compare les vues moyennes de vos vidéos classiques avec celles de vos Shorts pour identifier le format le plus impactant et l'affiche en référence.</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-3xl md:text-4xl lg:text-5xl font-display-kpi font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-1">
              {formatDuration(analytics?.avgVideoDurationSec)}
            </p>
            <p className="text-xs text-gray-400 font-medium">Pour le format Vidéo</p>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
             <div className="flex justify-between items-center bg-orange-50/40 dark:bg-orange-500/5 px-3 py-2.5 rounded-xl border border-orange-100/50 dark:border-orange-500/10">
                <div className="flex items-center gap-2">
                  <Zap size={12} className="text-orange-500" />
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Moy. Shorts</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatDuration(analytics?.avgShortDurationSec)}</span>
             </div>
             <div className="flex justify-between items-center bg-orange-50/40 dark:bg-orange-500/5 px-3 py-2.5 rounded-xl border border-orange-100/50 dark:border-orange-500/10">
                <div className="flex items-center gap-2">
                  <Radio size={12} className="text-orange-500" />
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Moy. Directs</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatDuration(avgDirectDurationSec)}</span>
             </div>
             <div className="flex items-center justify-between px-3 mt-1">
               <div className="flex items-center gap-1.5">
                 <Award size={14} className="text-yellow-500 flex-shrink-0" />
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Idéal</span>
               </div>
               <span className="text-[11px] font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1 rounded-md">
                 {formatDuration(analytics?.avgShortDurationSec)} <span className="opacity-50">(S)</span> 
                 <span className="mx-1 font-normal opacity-30">|</span> 
                 {formatDuration(analytics?.avgVideoDurationSec)} <span className="opacity-50">(V)</span>
               </span>
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
                  <Play size={12} className="text-pink-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Vidéos</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(classicLikes)}</span>
            </div>
            <div className="flex justify-between items-center bg-pink-50/40 dark:bg-pink-500/5 p-2.5 rounded-xl border border-pink-100/50 dark:border-pink-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Zap size={12} className="text-pink-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Shorts</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(shortLikes)}</span>
            </div>
            <div className="flex justify-between items-center bg-pink-50/40 dark:bg-pink-500/5 p-2.5 rounded-xl border border-pink-100/50 dark:border-pink-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Radio size={12} className="text-pink-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Directs</span>
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
                onMouseEnter={() => setShowEngagementTooltip('engagement')}
                onMouseLeave={() => setShowEngagementTooltip(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Info size={18} />
              </button>
              {showEngagementTooltip === 'engagement' && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700">
                  <p className="font-semibold mb-2">Calcul de l'engagement</p>
                  <p className="mb-2 text-gray-300 leading-relaxed">Mesure la proportion de personnes interagissant par rapport au nombre de vues.</p>
                  <div className="bg-black/30 p-2 rounded-lg font-mono text-[10px] mb-2 text-center text-green-400">
                    (Likes + Comms) / Vues × 100
                  </div>
                  <ul className="space-y-1 text-gray-400 mt-3 border-t border-gray-700 pt-2">
                    <li><span className="text-red-400">{"< 1%"}</span> : Faible</li>
                    <li><span className="text-yellow-400">{"1-3%"}</span> : Correct</li>
                    <li><span className="text-green-400">{"3-6%"}</span> : Bon</li>
                    <li><span className="text-blue-400">{"> 6%"}</span> : Excellent</li>
                  </ul>
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

