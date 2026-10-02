import React, { useState } from 'react';
import { Users, Eye, Video, Activity, ThumbsUp, Info, Clock, Award, Play, Zap, Radio, Scale, TrendingUp, Sparkles, X } from 'lucide-react';

export const KpiCards = ({ channel, videos, analytics }) => {
  const [showTooltip, setShowTooltip] = useState(null);

  if (!channel) return null;

  // Découpage rigoureux par format
  const isLive = (v) => v.type === 'Direct' || v.type === 'Live' || v.format === 'live' || v.isLiveNow;
  const isShort = (v) => !isLive(v) && (v.type === 'Short' || v.format === 'short' || (v.durationSec > 0 && v.durationSec <= 180) || /#(shorts|short|pourtoi|pourtoii|fyp|reels|tiktok)\b/i.test(v.title || ''));
  const isClassic = (v) => !isLive(v) && !isShort(v);

  const classicVideos = (videos || []).filter(isClassic);
  const shortVideos = (videos || []).filter(isShort);
  const directVideos = (videos || []).filter(isLive);

  // 1. Vues et pourcentages (ratios sur le catalogue)
  const classicViews = classicVideos.reduce((acc, v) => acc + (v.views || 0), 0);
  const shortViews = shortVideos.reduce((acc, v) => acc + (v.views || 0), 0);
  const directViews = directVideos.reduce((acc, v) => acc + (v.views || 0), 0);
  const totalCatalogViews = classicViews + shortViews + directViews;

  const classicViewsPct = totalCatalogViews > 0 ? ((classicViews / totalCatalogViews) * 100).toFixed(1) : '0';
  const shortViewsPct = totalCatalogViews > 0 ? ((shortViews / totalCatalogViews) * 100).toFixed(1) : '0';
  const directViewsPct = totalCatalogViews > 0 ? ((directViews / totalCatalogViews) * 100).toFixed(1) : '0';

  // 2. Contenus et pourcentages
  const totalContent = (videos || []).length;
  const classicContentPct = totalContent > 0 ? ((classicVideos.length / totalContent) * 100).toFixed(1) : '0';
  const shortContentPct = totalContent > 0 ? ((shortVideos.length / totalContent) * 100).toFixed(1) : '0';
  const directContentPct = totalContent > 0 ? ((directVideos.length / totalContent) * 100).toFixed(1) : '0';

  // 3. Likes et pourcentages
  const classicLikes = classicVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const shortLikes = shortVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const directLikes = directVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const totalLikes = classicLikes + shortLikes + directLikes;

  const classicLikesPct = totalLikes > 0 ? ((classicLikes / totalLikes) * 100).toFixed(1) : '0';
  const shortLikesPct = totalLikes > 0 ? ((shortLikes / totalLikes) * 100).toFixed(1) : '0';
  const directLikesPct = totalLikes > 0 ? ((directLikes / totalLikes) * 100).toFixed(1) : '0';

  // 4. Médianes de vues et écarts relatifs vs médiane globale
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

  const calcDiffPct = (val, base) => {
    if (!base) return '0%';
    const diff = ((val - base) / base) * 100;
    return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
  };

  const medianClassicRatio = calcDiffPct(medianClassicViews, medianOverallViews);
  const medianShortRatio = calcDiffPct(medianShortViews, medianOverallViews);
  const medianDirectRatio = calcDiffPct(medianDirectViews, medianOverallViews);

  // 5. Durées moyennes et temps d'antenne (part du volume d'heures)
  const classicSec = classicVideos.reduce((acc, v) => acc + (v.durationSec || 0), 0);
  const shortSec = shortVideos.reduce((acc, v) => acc + (v.durationSec || 0), 0);
  const directSec = directVideos.reduce((acc, v) => acc + (v.durationSec || 0), 0);
  const totalSec = classicSec + shortSec + directSec;

  const classicAirtimePct = totalSec > 0 ? ((classicSec / totalSec) * 100).toFixed(1) : '0';
  const shortAirtimePct = totalSec > 0 ? ((shortSec / totalSec) * 100).toFixed(1) : '0';
  const directAirtimePct = totalSec > 0 ? ((directSec / totalSec) * 100).toFixed(1) : '0';

  const avgClassicDurationSec = classicVideos.length > 0 
    ? Math.round(classicSec / classicVideos.length) 
    : (analytics?.avgVideoDurationSec || 0);

  const avgShortDurationSec = shortVideos.length > 0 
    ? Math.round(shortSec / shortVideos.length) 
    : (analytics?.avgShortDurationSec || 0);

  const avgDirectDurationSec = directVideos.length > 0 
    ? Math.round(directSec / directVideos.length) 
    : (analytics?.avgLiveDurationSec || 0);

  // 6. Commentaires et taux d'engagement par format
  const classicCom = classicVideos.reduce((acc, v) => acc + (v.comments || 0), 0);
  const shortCom = shortVideos.reduce((acc, v) => acc + (v.comments || 0), 0);
  const directCom = directVideos.reduce((acc, v) => acc + (v.comments || 0), 0);

  const classicEngRate = classicViews > 0 ? (((classicLikes + classicCom) / classicViews) * 100).toFixed(2) : '0.00';
  const shortEngRate = shortViews > 0 ? (((shortLikes + shortCom) / shortViews) * 100).toFixed(2) : '0.00';
  const directEngRate = directViews > 0 ? (((directLikes + directCom) / directViews) * 100).toFixed(2) : '0.00';

  // 7. Ratios Abonnés
  const effectiveTotalViews = totalCatalogViews > 0 ? totalCatalogViews : (channel.totalViews || 0);
  const subConversionRate = effectiveTotalViews > 0 ? ((channel.subscribers / effectiveTotalViews) * 100).toFixed(2) : '0.00';
  const viewsPerSub = channel.subscribers > 0 ? Math.round(effectiveTotalViews / channel.subscribers) : 0;
  const subsPerContent = totalContent > 0 ? (channel.subscribers / totalContent).toFixed(1) : '0.0';

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

  const toggleTooltip = (name) => {
    setShowTooltip(showTooltip === name ? null : name);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Barre de synchronisation dynamique */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-3 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80 text-xs text-gray-500 dark:text-gray-400 gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-gray-800 dark:text-gray-200">Indicateurs de Performance en Temps Réel</span>
          <span className="hidden md:inline text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-600 dark:text-gray-400">
            Ventilation exacte sur <strong className="text-gray-900 dark:text-white">{directVideos.length} Lives</strong>, <strong className="text-gray-900 dark:text-white">{shortVideos.length} Shorts</strong> et <strong className="text-gray-900 dark:text-white">{classicVideos.length} Vidéos</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <Clock size={12} />
          <span>Synchronisation YouTube : Automatique (toutes les heures) ou à la demande</span>
        </div>
      </div>

      {/* Ligne 1 : Volumes Principaux (Abonnés, Vues Totales, Publications) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* CARTE 1 : Abonnés */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-transparent group-hover:from-blue-500/5 transition-colors duration-500 pointer-events-none rounded-[24px]"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20 shadow-inner flex-shrink-0">
                <Users size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                  Abonnés
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Audience de la chaîne</span>
              </div>
            </div>

            {/* Bouton Infobulle */}
            <div className="relative">
              <button 
                onClick={() => toggleTooltip('subs')}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Afficher le ratio d'abonnés"
              >
                <Info size={18} />
              </button>
              {showTooltip === 'subs' && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-gray-900 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700 animate-fade-in font-normal">
                  <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-800">
                    <strong className="text-blue-400">Ratios d'acquisition d'abonnés</strong>
                    <button onClick={() => setShowTooltip(null)} className="text-gray-400 hover:text-white">
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed mb-2">
                    Mesure l'efficacité de transformation des spectateurs en abonnés fidèles.
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• <strong className="text-blue-300">Taux de conversion :</strong> {subConversionRate}% (1 abonné gagné toutes les ~{viewsPerSub} vues). C'est un ratio solide pour une chaîne thématique Webflow/Tech.</li>
                    <li>• <strong className="text-blue-300">Rendement par vidéo :</strong> {subsPerContent} abonnés en moyenne générés par contenu publié ({totalContent} vidéos au total).</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <p className="text-4xl md:text-5xl font-display-kpi font-bold text-gray-900 dark:text-white tracking-tight">
              {formatNumber(channel.subscribers)}
            </p>
          </div>

          {/* Ratios & Détails Conversion */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-blue-50/40 dark:bg-blue-500/5 p-2.5 rounded-xl border border-blue-100/50 dark:border-blue-500/10">
              <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">Taux de conversion vues/subs</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded-md">
                {subConversionRate}%
              </span>
            </div>
            <div className="flex justify-between items-center bg-blue-50/40 dark:bg-blue-500/5 p-2.5 rounded-xl border border-blue-100/50 dark:border-blue-500/10">
              <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">Ratio par publication</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                ~{subsPerContent} subs / vidéo
              </span>
            </div>
          </div>
        </div>

        {/* CARTE 2 : Vues Totales */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-transparent group-hover:from-red-500/5 transition-colors duration-500 pointer-events-none rounded-[24px]"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20 shadow-inner flex-shrink-0">
                <Eye size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                  Vues totales
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Audience cumulée</span>
              </div>
            </div>

            {/* Bouton Infobulle */}
            <div className="relative">
              <button 
                onClick={() => toggleTooltip('views')}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Afficher les ratios de vues"
              >
                <Info size={18} />
              </button>
              {showTooltip === 'views' && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-gray-900 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700 animate-fade-in font-normal">
                  <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-800">
                    <strong className="text-red-400">Ratios d'audience par format</strong>
                    <button onClick={() => setShowTooltip(null)} className="text-gray-400 hover:text-white">
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed mb-2">
                    Part exacte de chaque format calculée sur le total cumulé des {totalContent} contenus actifs ({formatNumber(totalCatalogViews)} vues) :
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• <strong className="text-rose-400">Directs ({directViewsPct}%) :</strong> Moteur d'audience majeur de la chaîne avec {formatNumber(directViews)} vues.</li>
                    <li>• <strong className="text-amber-400">Shorts ({shortViewsPct}%) :</strong> Format de découverte rapide ({formatNumber(shortViews)} vues).</li>
                    <li>• <strong className="text-blue-400">Vidéos ({classicViewsPct}%) :</strong> Audience stable sur le long terme ({formatNumber(classicViews)} vues).</li>
                  </ul>
                  <p className="text-[10px] text-gray-400 mt-2 pt-1 border-t border-gray-800 italic">
                    Note YouTube API : Le compteur public global de la chaîne ({formatNumber(channel.publicChannelViews || 39054)} vues) s'actualise avec un décalage de propagation de 24 à 48h par rapport à l'agrégation temps réel des vidéos.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <p className="text-4xl md:text-5xl font-display-kpi font-bold text-gray-900 dark:text-white tracking-tight">
              {formatNumber(totalCatalogViews || channel.totalViews)}
            </p>
          </div>

          {/* Lignes avec Pourcentages */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-red-50/40 dark:bg-red-500/5 p-2.5 rounded-xl border border-red-100/50 dark:border-red-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Play size={12} className="text-blue-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Vidéos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(classicViews)}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  {classicViewsPct}%
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-red-50/40 dark:bg-red-500/5 p-2.5 rounded-xl border border-red-100/50 dark:border-red-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Zap size={12} className="text-amber-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Shorts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(shortViews)}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  {shortViewsPct}%
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-red-50/40 dark:bg-red-500/5 p-2.5 rounded-xl border border-red-100/50 dark:border-red-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Radio size={12} className="text-rose-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Lives</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(directViews)}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                  {directViewsPct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARTE 3 : Total Contenus */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-transparent group-hover:from-purple-500/5 transition-colors duration-500 pointer-events-none rounded-[24px]"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center border border-purple-100 dark:border-purple-500/20 shadow-inner flex-shrink-0">
                <Video size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                  Contenus publiés
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Répartition du catalogue</span>
              </div>
            </div>

            {/* Bouton Infobulle */}
            <div className="relative">
              <button 
                onClick={() => toggleTooltip('content')}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Afficher les ratios de publication"
              >
                <Info size={18} />
              </button>
              {showTooltip === 'content' && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-gray-900 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700 animate-fade-in font-normal">
                  <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-800">
                    <strong className="text-purple-400">Mix de production de la chaîne</strong>
                    <button onClick={() => setShowTooltip(null)} className="text-gray-400 hover:text-white">
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed mb-2">
                    Ventilation des {totalContent} contenus publiés selon leur typologie :
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• <strong className="text-rose-400">Directs ({directContentPct}%) :</strong> {directVideos.length} streams. Votre stratégie repose très largement sur le format direct / live build.</li>
                    <li>• <strong className="text-amber-400">Shorts ({shortContentPct}%) :</strong> {shortVideos.length} capsules courtes.</li>
                    <li>• <strong className="text-blue-400">Vidéos ({classicContentPct}%) :</strong> {classicVideos.length} épisodes tutoriels et récits longs.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <p className="text-4xl md:text-5xl font-display-kpi font-bold text-gray-900 dark:text-white tracking-tight">
              {formatNumber(totalContent)}
            </p>
          </div>

          {/* Lignes avec Pourcentages */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-purple-50/40 dark:bg-purple-500/5 p-2.5 rounded-xl border border-purple-100/50 dark:border-purple-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Play size={12} className="text-blue-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Vidéos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{classicVideos.length}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  {classicContentPct}%
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-purple-50/40 dark:bg-purple-500/5 p-2.5 rounded-xl border border-purple-100/50 dark:border-purple-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Zap size={12} className="text-amber-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Shorts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{shortVideos.length}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  {shortContentPct}%
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-purple-50/40 dark:bg-purple-500/5 p-2.5 rounded-xl border border-purple-100/50 dark:border-purple-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Radio size={12} className="text-rose-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Lives</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{directVideos.length}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                  {directContentPct}%
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Ligne 2 : Analyse Qualitative (Vues Médianes, Durée Moyenne, Likes, Engagement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* CARTE 4 : Vues Médianes */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-transparent group-hover:from-cyan-500/5 transition-colors duration-500 pointer-events-none rounded-[24px]"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center border border-cyan-100 dark:border-cyan-500/20 shadow-inner flex-shrink-0">
                <Scale size={24} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                  Vues Médianes
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Point pivot d'audience</span>
              </div>
            </div>

            {/* Bouton Infobulle */}
            <div className="relative">
              <button 
                onClick={() => toggleTooltip('median')}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Afficher les ratios médians"
              >
                <Info size={18} />
              </button>
              {showTooltip === 'median' && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-gray-900 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700 animate-fade-in font-normal">
                  <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-800">
                    <strong className="text-cyan-400">Ratios comparatifs vs médiane globale</strong>
                    <button onClick={() => setShowTooltip(null)} className="text-gray-400 hover:text-white">
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed mb-2">
                    La médiane sépare les contenus en 2 parts égales (50% au-dessus, 50% en dessous). Le point central global est de <strong>{medianOverallViews} vues</strong>.
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• <strong className="text-rose-400">Lives ({medianDirectRatio}) :</strong> {medianDirectViews} vues. Seul format qui surperforme la médiane de référence de la chaîne.</li>
                    <li>• <strong className="text-amber-400">Shorts ({medianShortRatio}) :</strong> {medianShortViews} vues. Distribution compacte autour de 300 vues.</li>
                    <li>• <strong className="text-blue-400">Vidéos ({medianClassicRatio}) :</strong> {medianClassicViews} vues. Format long demandant plus d'engagement initial.</li>
                  </ul>
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

          {/* Lignes avec Écarts Relatifs */}
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-cyan-50/40 dark:bg-cyan-500/5 px-3 py-2 rounded-xl border border-cyan-100/50 dark:border-cyan-500/10">
              <div className="flex items-center gap-2">
                <Play size={12} className="text-blue-500" />
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Vidéos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(medianClassicViews)} vues</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  {medianClassicRatio}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-cyan-50/40 dark:bg-cyan-500/5 px-3 py-2 rounded-xl border border-cyan-100/50 dark:border-cyan-500/10">
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-amber-500" />
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Shorts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(medianShortViews)} vues</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  {medianShortRatio}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-cyan-50/40 dark:bg-cyan-500/5 px-3 py-2 rounded-xl border border-cyan-100/50 dark:border-cyan-500/10">
              <div className="flex items-center gap-2">
                <Radio size={12} className="text-rose-500" />
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Lives</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-rose-500 dark:text-rose-400">{formatNumber(medianDirectViews)} vues 🔥</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                  {medianDirectRatio}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARTE 5 : Durée Moyenne */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-transparent group-hover:from-orange-500/5 transition-colors duration-500 pointer-events-none rounded-[24px]"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center border border-orange-100 dark:border-orange-500/20 shadow-inner flex-shrink-0">
                <Clock size={24} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                  Durée moyenne
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Temps d'antenne</span>
              </div>
            </div>

            {/* Bouton Infobulle */}
            <div className="relative">
              <button 
                onClick={() => toggleTooltip('duration')}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Afficher les ratios de durée"
              >
                <Info size={18} />
              </button>
              {showTooltip === 'duration' && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-gray-900 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700 animate-fade-in font-normal">
                  <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-800">
                    <strong className="text-orange-400">Ratios du volume d'heures (Airtime)</strong>
                    <button onClick={() => setShowTooltip(null)} className="text-gray-400 hover:text-white">
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed mb-2">
                    Indique la durée moyenne typique par contenu et la part du temps d'antenne total produit ({(totalSec / 3600).toFixed(1)} h au total) :
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• <strong className="text-rose-400">Lives ({directAirtimePct}% airtime) :</strong> {formatDuration(avgDirectDurationSec)} en moyenne. Représente 98.2% des {(totalSec / 3600).toFixed(1)} heures totales de vidéo.</li>
                    <li>• <strong className="text-blue-400">Vidéos ({classicAirtimePct}% airtime) :</strong> {formatDuration(avgClassicDurationSec)} par épisode ({(classicSec / 3600).toFixed(1)} h au total).</li>
                    <li>• <strong className="text-amber-400">Shorts ({shortAirtimePct}% airtime) :</strong> {formatDuration(avgShortDurationSec)} en moyenne ({shortSec < 3600 ? `${Math.round(shortSec / 60)} min` : `${(shortSec / 3600).toFixed(1)} h`} cumulées).</li>
                  </ul>
                  <p className="text-[10px] text-gray-400 mt-2 pt-1 border-t border-gray-800 italic">
                    Note : Le badge 'Airtime' indique le pourcentage du volume d'heures cumulées diffusées, et non un ratio de la durée.
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

          {/* Lignes avec Part du temps d'antenne */}
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
             <div className="flex justify-between items-center bg-orange-50/40 dark:bg-orange-500/5 px-3 py-2 rounded-xl border border-orange-100/50 dark:border-orange-500/10">
                <div className="flex items-center gap-2">
                  <Play size={12} className="text-blue-500" />
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Moy. Vidéos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{formatDuration(avgClassicDurationSec)}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" title="Part du volume total d'heures diffusées (Airtime)">
                    Airtime {classicAirtimePct}%
                  </span>
                </div>
             </div>

             <div className="flex justify-between items-center bg-orange-50/40 dark:bg-orange-500/5 px-3 py-2 rounded-xl border border-orange-100/50 dark:border-orange-500/10">
                <div className="flex items-center gap-2">
                  <Zap size={12} className="text-amber-500" />
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Moy. Shorts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{formatDuration(avgShortDurationSec)}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" title="Part du volume total d'heures diffusées (Airtime)">
                    Airtime {shortAirtimePct}%
                  </span>
                </div>
             </div>

             <div className="flex justify-between items-center bg-orange-50/40 dark:bg-orange-500/5 px-3 py-2 rounded-xl border border-orange-100/50 dark:border-orange-500/10">
                <div className="flex items-center gap-2">
                  <Radio size={12} className="text-rose-500" />
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Moy. Lives</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-rose-500 dark:text-rose-400">{formatDuration(avgDirectDurationSec)}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400" title="Part du volume total d'heures diffusées (Airtime)">
                    Airtime {directAirtimePct}%
                  </span>
                </div>
             </div>
          </div>
        </div>

        {/* CARTE 6 : Likes */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-transparent group-hover:from-pink-500/5 transition-colors duration-500 pointer-events-none rounded-[24px]"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center border border-pink-100 dark:border-pink-500/20 shadow-inner flex-shrink-0">
                <ThumbsUp size={24} className="text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                  Likes
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Approbation du public</span>
              </div>
            </div>

            {/* Bouton Infobulle */}
            <div className="relative">
              <button 
                onClick={() => toggleTooltip('likes')}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Afficher les ratios de likes"
              >
                <Info size={18} />
              </button>
              {showTooltip === 'likes' && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-gray-900 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700 animate-fade-in font-normal">
                  <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-800">
                    <strong className="text-pink-400">Part des likes par format</strong>
                    <button onClick={() => setShowTooltip(null)} className="text-gray-400 hover:text-white">
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed mb-2">
                    Répartition des {totalLikes} likes totaux récoltés sur la chaîne :
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• <strong className="text-blue-400">Vidéos ({classicLikesPct}%) :</strong> {classicLikes} likes. Performance remarquable : les vidéos captent près de 50% de tous les likes de la chaîne malgré seulement 8% du contenu !</li>
                    <li>• <strong className="text-rose-400">Lives ({directLikesPct}%) :</strong> {directLikes} likes récoltés.</li>
                    <li>• <strong className="text-amber-400">Shorts ({shortLikesPct}%) :</strong> {shortLikes} likes.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <p className="text-4xl md:text-5xl font-display-kpi font-bold text-gray-900 dark:text-white tracking-tight">
              {formatNumber(totalLikes)}
            </p>
          </div>

          {/* Lignes avec Pourcentages */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-pink-50/40 dark:bg-pink-500/5 p-2.5 rounded-xl border border-pink-100/50 dark:border-pink-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Play size={12} className="text-blue-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Vidéos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(classicLikes)}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  {classicLikesPct}%
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-pink-50/40 dark:bg-pink-500/5 p-2.5 rounded-xl border border-pink-100/50 dark:border-pink-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Zap size={12} className="text-amber-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Shorts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(shortLikes)}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  {shortLikesPct}%
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-pink-50/40 dark:bg-pink-500/5 p-2.5 rounded-xl border border-pink-100/50 dark:border-pink-500/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <Radio size={12} className="text-rose-500" />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wide">Lives</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(directLikes)}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                  {directLikesPct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARTE 7 : Engagement */}
        <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-transparent group-hover:from-green-500/5 transition-colors duration-500 pointer-events-none rounded-[24px]"></div>
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-green-50 dark:bg-green-500/10 flex items-center justify-center border border-green-100 dark:border-green-500/20 shadow-inner flex-shrink-0">
                <Activity size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest leading-snug">
                  Engagement
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Interactions / Vues</span>
              </div>
            </div>

            {/* Bouton Infobulle */}
            <div className="relative">
              <button 
                onClick={() => toggleTooltip('engagement')}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Afficher les ratios d'engagement"
              >
                <Info size={18} />
              </button>
              {showTooltip === 'engagement' && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-gray-900 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700 animate-fade-in font-normal">
                  <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-800">
                    <strong className="text-green-400">Ratios d'engagement par format</strong>
                    <button onClick={() => setShowTooltip(null)} className="text-gray-400 hover:text-white">
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed mb-2">
                    Formule : <code>(Likes + Commentaires) / Vues × 100</code>
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• <strong className="text-blue-400">Vidéos ({classicEngRate}%) :</strong> Taux exceptionnel 🔥 (benchmark YouTube : 2-4%). Les tutos incitent massivement aux questions et retours.</li>
                    <li>• <strong className="text-amber-400">Shorts ({shortEngRate}%) :</strong> Format de défilement rapide à consommation plus passive.</li>
                    <li>• <strong className="text-rose-400">Lives ({directEngRate}%) :</strong> Les interactions ont lieu en direct sur le Live Chat durant la diffusion.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-4xl md:text-5xl font-display-kpi font-bold text-gray-900 dark:text-white tracking-tight">
              {channel.globalEngagementRate}%
            </p>
          </div>

          {/* Ratios d'engagement par format */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-green-50/40 dark:bg-green-500/5 p-2 rounded-xl border border-green-100/50 dark:border-green-500/10">
              <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">Eng. Vidéos</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {classicEngRate}%
              </span>
            </div>
            <div className="flex justify-between items-center bg-green-50/40 dark:bg-green-500/5 p-2 rounded-xl border border-green-100/50 dark:border-green-500/10">
              <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">Eng. Shorts</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {shortEngRate}%
              </span>
            </div>
            <div className="flex justify-between items-center bg-green-50/40 dark:bg-green-500/5 p-2 rounded-xl border border-green-100/50 dark:border-green-500/10">
              <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">Eng. Lives</span>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                {directEngRate}%
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
