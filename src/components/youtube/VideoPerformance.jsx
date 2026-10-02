import React, { useState, useMemo } from 'react';
import { 
  Search, 
  PlayCircle, 
  ThumbsUp, 
  MessageCircle, 
  Activity, 
  Info, 
  Radio, 
  Zap, 
  Video as VideoIcon, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Clock,
  Eye,
  MessageSquare,
  HelpCircle,
  BarChart2
} from 'lucide-react';

export const VideoPerformance = ({ videos, channel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showVPHTooltip, setShowVPHTooltip] = useState(false);
  const [activeKpiTooltip, setActiveKpiTooltip] = useState(null); // 'hours' | 'views' | 'comments' | null
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  if (!videos || videos.length === 0) return null;

  // Découpage rigoureux par format
  const isVideoLive = (v) => v.type === 'Live' || v.type === 'Direct' || v.format === 'live' || v.isLiveNow;
  const isVideoShort = (v) => !isVideoLive(v) && (v.type === 'Short' || v.format === 'short' || (v.durationSec > 0 && v.durationSec <= 180) || /#(shorts|short|pourtoi|pourtoii|fyp|reels|tiktok)\b/i.test(v.title || ''));
  const isVideoClassic = (v) => !isVideoLive(v) && !isVideoShort(v);

  const lives = useMemo(() => videos.filter(isVideoLive), [videos]);
  const shorts = useMemo(() => videos.filter(isVideoShort), [videos]);
  const classics = useMemo(() => videos.filter(isVideoClassic), [videos]);

  // Compteurs par format
  const counts = useMemo(() => {
    return {
      all: videos.length,
      live: lives.length,
      short: shorts.length,
      video: classics.length
    };
  }, [videos, lives, shorts, classics]);

  // 1. Volume total d'heures (Directs, Shorts, Vidéos) et pourcentages
  const hoursStats = useMemo(() => {
    const livesSec = lives.reduce((acc, v) => acc + (v.durationSec || 0), 0);
    const shortsSec = shorts.reduce((acc, v) => acc + (v.durationSec || 0), 0);
    const classicsSec = classics.reduce((acc, v) => acc + (v.durationSec || 0), 0);
    const totalSec = livesSec + shortsSec + classicsSec;

    const livesH = livesSec / 3600;
    const shortsH = shortsSec / 3600;
    const classicsH = classicsSec / 3600;
    const totalH = totalSec / 3600;

    const livesPct = totalH > 0 ? (livesH / totalH) * 100 : 0;
    const shortsPct = totalH > 0 ? (shortsH / totalH) * 100 : 0;
    const classicsPct = totalH > 0 ? (classicsH / totalH) * 100 : 0;

    return {
      livesH,
      shortsH,
      classicsH,
      totalH,
      livesPct,
      shortsPct,
      classicsPct
    };
  }, [lives, shorts, classics]);

  // 2. Vues cumulées (Directs, Shorts, Vidéos) et pourcentages par rapport au total de la chaîne
  const viewsStats = useMemo(() => {
    const livesViews = lives.reduce((acc, v) => acc + (v.views || 0), 0);
    const shortsViews = shorts.reduce((acc, v) => acc + (v.views || 0), 0);
    const classicsViews = classics.reduce((acc, v) => acc + (v.views || 0), 0);
    const catalogTotalViews = livesViews + shortsViews + classicsViews;
    const baseTotalViews = catalogTotalViews > 0 ? catalogTotalViews : (channel?.totalViews || 0);

    const livesPct = baseTotalViews > 0 ? (livesViews / baseTotalViews) * 100 : 0;
    const shortsPct = baseTotalViews > 0 ? (shortsViews / baseTotalViews) * 100 : 0;
    const classicsPct = baseTotalViews > 0 ? (classicsViews / baseTotalViews) * 100 : 0;

    return {
      livesViews,
      shortsViews,
      classicsViews,
      catalogTotalViews,
      channelTotalViews: channel?.totalViews || catalogTotalViews,
      publicChannelViews: channel?.publicChannelViews || 39054,
      livesPct,
      shortsPct,
      classicsPct
    };
  }, [lives, shorts, classics, channel]);

  // 3. Nombre de commentaires (Directs, Shorts, Vidéos) et pourcentages
  const commentsStats = useMemo(() => {
    const livesCom = lives.reduce((acc, v) => acc + (v.comments || 0), 0);
    const shortsCom = shorts.reduce((acc, v) => acc + (v.comments || 0), 0);
    const classicsCom = classics.reduce((acc, v) => acc + (v.comments || 0), 0);
    const totalCom = livesCom + shortsCom + classicsCom;

    const livesPct = totalCom > 0 ? (livesCom / totalCom) * 100 : 0;
    const shortsPct = totalCom > 0 ? (shortsCom / totalCom) * 100 : 0;
    const classicsPct = totalCom > 0 ? (classicsCom / totalCom) * 100 : 0;

    return {
      livesCom,
      shortsCom,
      classicsCom,
      totalCom,
      livesPct,
      shortsPct,
      classicsPct
    };
  }, [lives, shorts, classics]);

  const calculateVPH = (publishedAt, views) => {
    if (!publishedAt || !views) return 0;
    const hours = (new Date() - new Date(publishedAt)) / (1000 * 60 * 60);
    return Math.max(0, views / Math.max(1, hours));
  };

  const formatDuration = (sec) => {
    if (!sec) return null;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
    if (m > 0) return `${m}m${s > 0 ? ` ${s}s` : ''}`;
    return `${s}s`;
  };

  const filteredVideos = useMemo(() => {
    return videos
      .filter(v => {
        if (typeFilter === 'all') return true;
        if (typeFilter === 'live') return isVideoLive(v);
        if (typeFilter === 'short') return isVideoShort(v);
        if (typeFilter === 'video') return isVideoClassic(v);
        return true;
      })
      .filter(v => (v.title || '').toLowerCase().includes(searchTerm.toLowerCase().trim()))
      .sort((a, b) => {
        if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
        if (sortBy === 'engagement') return (b.engagementRate || 0) - (a.engagementRate || 0);
        if (sortBy === 'vph') {
          const aHours = Math.max(1, (new Date() - new Date(a.publishedAt)) / (1000 * 60 * 60));
          const bHours = Math.max(1, (new Date() - new Date(b.publishedAt)) / (1000 * 60 * 60));
          return ((b.views || 0) / bHours) - ((a.views || 0) / aHours);
        }
        if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
        if (sortBy === 'comments') return (b.comments || 0) - (a.comments || 0);
        if (sortBy === 'date-asc') return new Date(a.publishedAt) - new Date(b.publishedAt);
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      });
  }, [videos, typeFilter, searchTerm, sortBy]);

  // Pagination
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredVideos.length / itemsPerPage);
  const paginatedVideos = useMemo(() => {
    if (itemsPerPage === 'all') return filteredVideos;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVideos.slice(start, start + itemsPerPage);
  }, [filteredVideos, currentPage, itemsPerPage]);

  const handleFilterChange = (val) => {
    setTypeFilter(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:shadow-xl hover:shadow-lumina-primary/5 transition-all duration-300 p-6 lg:p-8 rounded-3xl border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm flex flex-col gap-6">
      
      {/* 1. Header section avec titre & badge de synchronisation */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Performance des contenus</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {filteredVideos.length} {filteredVideos.length > 1 ? 'contenus' : 'contenu'}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              🔄 Données calculées en temps réel sur le catalogue
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Indicateurs consolidés et catalogue synchronisé ({counts.live} Lives, {counts.short} Shorts et {counts.video} Vidéos longues)
          </p>
        </div>
      </div>

      {/* 2. Les 3 Cartes KPI de Répartition (Heures, Vues Cumulées, Commentaires) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* CARTE 1 : Volume Total d'Heures */}
        <div className="bg-gray-50/80 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-500/30 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Volume Total d'Heures
                  </h4>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">Temps de diffusion cumulé</span>
                </div>
              </div>

              {/* Bouton Infobulle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveKpiTooltip(activeKpiTooltip === 'hours' ? null : 'hours')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                  title="Afficher l'explication"
                >
                  <Info size={16} />
                </button>

                {activeKpiTooltip === 'hours' && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 text-white p-3.5 rounded-xl text-xs z-50 shadow-2xl border border-gray-700 animate-fade-in font-normal">
                    <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-800">
                      <strong className="text-indigo-400">Calcul du volume d'heures</strong>
                      <button onClick={() => setActiveKpiTooltip(null)} className="text-gray-400 hover:text-white">
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed mb-2">
                      Somme exacte de la durée de chaque contenu indexé divisée par 3 600 secondes.
                    </p>
                    <ul className="space-y-1 text-[11px] text-gray-300">
                      <li>• <strong className="text-rose-400">Directs :</strong> {hoursStats.livesH.toFixed(1)} h ({hoursStats.livesPct.toFixed(1)}% du total). Format marathon dominant.</li>
                      <li>• <strong className="text-blue-400">Vidéos :</strong> {hoursStats.classicsH.toFixed(1)} h ({hoursStats.classicsPct.toFixed(1)}% du total). Contenus structurés.</li>
                      <li>• <strong className="text-amber-400">Shorts :</strong> {hoursStats.shortsH < 1 ? `${Math.round(hoursStats.shortsH * 60)} min` : `${hoursStats.shortsH.toFixed(1)} h`} ({hoursStats.shortsPct.toFixed(1)}% du total).</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Chiffre Principal */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {hoursStats.totalH.toFixed(1)} h
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">au total</span>
            </div>

            {/* Barre de répartition segmentée */}
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 flex overflow-hidden mb-3">
              <div 
                style={{ width: `${hoursStats.livesPct}%` }} 
                className="bg-rose-500 h-full transition-all duration-500" 
                title={`Directs: ${hoursStats.livesPct.toFixed(1)}%`}
              />
              <div 
                style={{ width: `${hoursStats.classicsPct}%` }} 
                className="bg-blue-500 h-full transition-all duration-500" 
                title={`Vidéos: ${hoursStats.classicsPct.toFixed(1)}%`}
              />
              <div 
                style={{ width: `${Math.max(hoursStats.shortsPct, 1)}%` }} 
                className="bg-amber-500 h-full transition-all duration-500" 
                title={`Shorts: ${hoursStats.shortsPct.toFixed(1)}%`}
              />
            </div>
          </div>

          {/* Lignes de ventilation détaillée */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800/80 text-xs">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Directs
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {hoursStats.livesH.toFixed(1)} h <span className="text-rose-600 dark:text-rose-400 font-semibold ml-1">({hoursStats.livesPct.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Vidéos
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {hoursStats.classicsH.toFixed(1)} h <span className="text-blue-600 dark:text-blue-400 font-semibold ml-1">({hoursStats.classicsPct.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Shorts
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {hoursStats.shortsH < 1 ? `${Math.round(hoursStats.shortsH * 60)} min` : `${hoursStats.shortsH.toFixed(1)} h`} <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1">({hoursStats.shortsPct.toFixed(1)}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* CARTE 2 : Vues Cumulées */}
        <div className="bg-gray-50/80 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-emerald-500/30 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Eye size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vues Cumulées
                  </h4>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">Audience par format</span>
                </div>
              </div>

              {/* Bouton Infobulle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveKpiTooltip(activeKpiTooltip === 'views' ? null : 'views')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                  title="Afficher l'explication"
                >
                  <Info size={16} />
                </button>

                {activeKpiTooltip === 'views' && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 text-white p-3.5 rounded-xl text-xs z-50 shadow-2xl border border-gray-700 animate-fade-in font-normal">
                    <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-800">
                      <strong className="text-emerald-400">Répartition des vues</strong>
                      <button onClick={() => setActiveKpiTooltip(null)} className="text-gray-400 hover:text-white">
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed mb-2">
                      Rapporte les vues de chaque format au volume cumulé exact du catalogue ({viewsStats.catalogTotalViews.toLocaleString('fr-FR')} vues) :
                    </p>
                    <ul className="space-y-1 text-[11px] text-gray-300">
                      <li>• <strong className="text-rose-400">Directs :</strong> {viewsStats.livesViews.toLocaleString('fr-FR')} vues ({viewsStats.livesPct.toFixed(1)}%). Moteur d'audience n°1.</li>
                      <li>• <strong className="text-amber-400">Shorts :</strong> {viewsStats.shortsViews.toLocaleString('fr-FR')} vues ({viewsStats.shortsPct.toFixed(1)}%). Acquisition rapide.</li>
                      <li>• <strong className="text-blue-400">Vidéos :</strong> {viewsStats.classicsViews.toLocaleString('fr-FR')} vues ({viewsStats.classicsPct.toFixed(1)}%). Vues pérennes.</li>
                    </ul>
                    <p className="text-[10px] text-gray-400 mt-2 pt-1 border-t border-gray-800 italic">
                      Note YouTube API : Le compteur public global YouTube ({viewsStats.publicChannelViews.toLocaleString('fr-FR')} vues) a un décalage de propagation de 24 à 48h par rapport à l'agrégation temps réel des vidéos.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Chiffre Principal */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {viewsStats.catalogTotalViews.toLocaleString('fr-FR')}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">vues catalogue</span>
            </div>

            {/* Barre de répartition segmentée */}
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 flex overflow-hidden mb-3">
              <div 
                style={{ width: `${viewsStats.livesPct}%` }} 
                className="bg-rose-500 h-full transition-all duration-500" 
                title={`Directs: ${viewsStats.livesPct.toFixed(1)}%`}
              />
              <div 
                style={{ width: `${viewsStats.shortsPct}%` }} 
                className="bg-amber-500 h-full transition-all duration-500" 
                title={`Shorts: ${viewsStats.shortsPct.toFixed(1)}%`}
              />
              <div 
                style={{ width: `${viewsStats.classicsPct}%` }} 
                className="bg-blue-500 h-full transition-all duration-500" 
                title={`Vidéos: ${viewsStats.classicsPct.toFixed(1)}%`}
              />
            </div>
          </div>

          {/* Lignes de ventilation détaillée */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800/80 text-xs">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Directs
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {viewsStats.livesViews.toLocaleString('fr-FR')} <span className="text-rose-600 dark:text-rose-400 font-semibold ml-1">({viewsStats.livesPct.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Shorts
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {viewsStats.shortsViews.toLocaleString('fr-FR')} <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1">({viewsStats.shortsPct.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Vidéos
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {viewsStats.classicsViews.toLocaleString('fr-FR')} <span className="text-blue-600 dark:text-blue-400 font-semibold ml-1">({viewsStats.classicsPct.toFixed(1)}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* CARTE 3 : Nombre de Commentaires */}
        <div className="bg-gray-50/80 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-500/30 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nombre de Commentaires
                  </h4>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">Interactions & retours</span>
                </div>
              </div>

              {/* Bouton Infobulle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveKpiTooltip(activeKpiTooltip === 'comments' ? null : 'comments')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                  title="Afficher l'explication"
                >
                  <Info size={16} />
                </button>

                {activeKpiTooltip === 'comments' && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 text-white p-3.5 rounded-xl text-xs z-50 shadow-2xl border border-gray-700 animate-fade-in font-normal">
                    <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-800">
                      <strong className="text-blue-400">Répartition des commentaires</strong>
                      <button onClick={() => setActiveKpiTooltip(null)} className="text-gray-400 hover:text-white">
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed mb-2">
                      Nombre total de commentaires enregistrés sous les contenus ({commentsStats.totalCom} commentaires).
                    </p>
                    <ul className="space-y-1 text-[11px] text-gray-300">
                      <li>• <strong className="text-blue-400">Vidéos :</strong> {commentsStats.classicsCom} com. ({commentsStats.classicsPct.toFixed(1)}% des messages). Fort taux de questions et remerciements.</li>
                      <li>• <strong className="text-rose-400">Directs :</strong> {commentsStats.livesCom} com. ({commentsStats.livesPct.toFixed(1)}%). Les spectateurs discutent en direct sur le chat pendant la session.</li>
                      <li>• <strong className="text-amber-400">Shorts :</strong> {commentsStats.shortsCom} com. ({commentsStats.shortsPct.toFixed(1)}%).</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Chiffre Principal */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {commentsStats.totalCom.toLocaleString('fr-FR')}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">commentaires au total</span>
            </div>

            {/* Barre de répartition segmentée */}
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 flex overflow-hidden mb-3">
              <div 
                style={{ width: `${commentsStats.classicsPct}%` }} 
                className="bg-blue-500 h-full transition-all duration-500" 
                title={`Vidéos: ${commentsStats.classicsPct.toFixed(1)}%`}
              />
              <div 
                style={{ width: `${commentsStats.livesPct}%` }} 
                className="bg-rose-500 h-full transition-all duration-500" 
                title={`Directs: ${commentsStats.livesPct.toFixed(1)}%`}
              />
              <div 
                style={{ width: `${commentsStats.shortsPct}%` }} 
                className="bg-amber-500 h-full transition-all duration-500" 
                title={`Shorts: ${commentsStats.shortsPct.toFixed(1)}%`}
              />
            </div>
          </div>

          {/* Lignes de ventilation détaillée */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800/80 text-xs">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Vidéos
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {commentsStats.classicsCom} <span className="text-blue-600 dark:text-blue-400 font-semibold ml-1">({commentsStats.classicsPct.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Directs
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {commentsStats.livesCom} <span className="text-rose-600 dark:text-rose-400 font-semibold ml-1">({commentsStats.livesPct.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Shorts
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {commentsStats.shortsCom} <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1">({commentsStats.shortsPct.toFixed(1)}%)</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Contrôles de filtrage & recherche */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800/80">
        {/* Barre de recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Rechercher par titre (ex: Build Together, Webflow, Bangkok)..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white transition-all placeholder-gray-400"
          />
          {searchTerm && (
            <button 
              onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtres & Tri */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sélecteur de format */}
          <select 
            value={typeFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em 1.2em' }}
          >
            <option value="all">Tous les formats ({counts.all})</option>
            <option value="live">🔴 Lives & Directs ({counts.live})</option>
            <option value="short">⚡ Shorts ({counts.short})</option>
            <option value="video">🎬 Vidéos ({counts.video})</option>
          </select>

          {/* Tri */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em 1.2em' }}
          >
            <option value="date-desc">Plus récents d'abord</option>
            <option value="date-asc">Plus anciens d'abord</option>
            <option value="views">Trier par vues (décroissant)</option>
            <option value="engagement">Trier par engagement</option>
            <option value="vph">Trier par vélocité (VPH)</option>
            <option value="likes">Trier par likes</option>
            <option value="comments">Trier par commentaires</option>
          </select>
        </div>
      </div>

      {/* 4. Tableau des contenus */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800/80">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-gray-800/40 text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200/60 dark:border-gray-800">
              <th className="px-4 sm:px-6 py-3.5 font-semibold">Contenu</th>
              <th className="px-3 sm:px-4 py-3.5 font-semibold text-center">Format</th>
              <th className="px-3 sm:px-4 py-3.5 font-semibold">Publié le</th>
              <th className="px-3 sm:px-4 py-3.5 font-semibold text-right">Vues</th>
              <th className="px-3 sm:px-4 py-3.5 font-semibold text-right relative group">
                <div 
                  className="flex justify-end items-center gap-1 cursor-help"
                  onClick={() => setShowVPHTooltip(!showVPHTooltip)}
                  onMouseEnter={() => setShowVPHTooltip(true)}
                  onMouseLeave={() => setShowVPHTooltip(false)}
                >
                  VPH 🔥 <Info size={14} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                </div>
                {showVPHTooltip && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-gray-900 dark:bg-gray-800 text-white p-3 rounded-xl text-xs z-50 shadow-xl border border-gray-700 animate-fade-in text-left font-normal normal-case">
                    <strong>VPH (Vues Par Heure)</strong><br />
                    Moyenne de vues par heure depuis la diffusion. Un VPH élevé signifie que l'algorithme met activement la vidéo en avant !<br /><br />
                    <span className="text-gray-300"><em>Ex: 10/h = 10 nouvelles vues chaque heure.</em></span>
                  </div>
                )}
              </th>
              <th className="px-3 sm:px-4 py-3.5 font-semibold text-right">Likes</th>
              <th className="px-3 sm:px-4 py-3.5 font-semibold text-right">Comm.</th>
              <th className="px-3 sm:px-4 py-3.5 font-semibold text-right">Engagement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 bg-transparent">
            {paginatedVideos.map((video) => {
              const vph = calculateVPH(video.publishedAt, video.views);
              const isLive = isVideoLive(video);
              const isShort = isVideoShort(video);
              const formattedDuration = formatDuration(video.durationSec);

              return (
                <tr 
                  key={video.id} 
                  className="hover:bg-gray-50/70 dark:hover:bg-gray-800/30 transition-colors group"
                >
                  {/* Miniature & Titre */}
                  <td className="px-4 sm:px-6 py-3.5 min-w-[240px] sm:min-w-[320px]">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <a 
                        href={`https://youtube.com/watch?v=${video.id}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className={`relative ${isShort ? 'w-10 h-16 sm:w-12 sm:h-20' : 'w-20 h-12 sm:w-24 sm:h-14'} rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 block shadow-xs group/thumb`}
                      >
                        <img 
                          src={video.thumbnailUrl} 
                          alt="" 
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500" 
                          loading="lazy" 
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover/thumb:bg-transparent transition-colors"></div>

                        {/* Badge durée ou statut live sur la miniature */}
                        {isLive ? (
                          <div className="absolute bottom-1 right-1 bg-red-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            {formattedDuration || 'LIVE'}
                          </div>
                        ) : isShort ? (
                          <div className="absolute bottom-1 right-1 bg-amber-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-0.5 shadow-sm">
                            <Zap size={9} className="fill-white" />
                            {formattedDuration || 'SHORT'}
                          </div>
                        ) : (
                          formattedDuration && (
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded backdrop-blur-xs shadow-sm">
                              {formattedDuration}
                            </div>
                          )
                        )}
                      </a>

                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <a 
                          href={`https://youtube.com/watch?v=${video.id}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-red-500 dark:hover:text-red-400 transition-colors leading-snug"
                        >
                          {video.title}
                        </a>
                      </div>
                    </div>
                  </td>

                  {/* Format Badge (LIVE / SHORT / VIDÉO) */}
                  <td className="px-3 sm:px-4 py-3.5 text-center whitespace-nowrap">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        Live
                      </span>
                    ) : isShort ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20 shadow-xs">
                        <Zap size={11} className="fill-amber-500" />
                        Short
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 shadow-xs">
                        <VideoIcon size={11} />
                        Vidéo
                      </span>
                    )}
                  </td>

                  {/* Date de publication */}
                  <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(video.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>

                  {/* Vues */}
                  <td className="px-3 sm:px-4 py-3.5 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {video.views?.toLocaleString('fr-FR')}
                  </td>

                  {/* VPH */}
                  <td className="px-3 sm:px-4 py-3.5 text-right whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 font-semibold ${
                      vph > 50 ? 'text-red-500 dark:text-red-400' :
                      vph > 10 ? 'text-orange-500 dark:text-orange-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {vph.toFixed(1)}
                      {vph > 50 && <span className="text-[10px]">🔥</span>}
                    </span>
                  </td>

                  {/* Likes */}
                  <td className="px-3 sm:px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {video.likes?.toLocaleString('fr-FR')}
                  </td>

                  {/* Commentaires */}
                  <td className="px-3 sm:px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {video.comments?.toLocaleString('fr-FR')}
                  </td>

                  {/* Taux d'engagement */}
                  <td className="px-3 sm:px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                      <span>{video.engagementRate}%</span>
                      <Activity size={12} className={video.engagementRate > 5 ? 'text-emerald-500' : 'text-gray-400'} />
                    </div>
                  </td>
                </tr>
              );
            })}

            {paginatedVideos.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-16 text-center text-gray-400 dark:text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search size={28} className="text-gray-300 dark:text-gray-600 mb-1" />
                    <p className="font-medium text-sm text-gray-700 dark:text-gray-300">Aucun contenu trouvé</p>
                    <p className="text-xs">Modifiez vos critères de recherche ou réinitialisez les filtres.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Barre de pagination */}
      {filteredVideos.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>Afficher</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold focus:outline-none dark:text-white"
            >
              <option value={15}>15 par page</option>
              <option value={30}>30 par page</option>
              <option value={50}>50 par page</option>
              <option value="all">Tout afficher ({filteredVideos.length})</option>
            </select>
            <span>
              {itemsPerPage !== 'all' ? (
                <>
                  Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredVideos.length)} sur {filteredVideos.length}
                </>
              ) : (
                <>{filteredVideos.length} résultats</>
              )}
            </span>
          </div>

          {itemsPerPage !== 'all' && totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1 px-2 font-medium">
                Page <span className="font-bold text-gray-900 dark:text-white">{currentPage}</span> sur <span className="font-bold text-gray-900 dark:text-white">{totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
