import React, { useState, useMemo } from 'react';
import { Search, PlayCircle, ThumbsUp, MessageCircle, Activity, Info, Radio, Zap, Video as VideoIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export const VideoPerformance = ({ videos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showVPHTooltip, setShowVPHTooltip] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  if (!videos || videos.length === 0) return null;

  const isVideoLive = (v) => v.type === 'Live' || v.type === 'Direct' || v.isLiveNow;
  const isVideoShort = (v) => v.type === 'Short';
  const isVideoClassic = (v) => (v.type === 'Video' || v.type === 'Vidéo') && !isVideoLive(v);

  // Compteurs par format
  const counts = useMemo(() => {
    return {
      all: videos.length,
      live: videos.filter(isVideoLive).length,
      short: videos.filter(isVideoShort).length,
      video: videos.filter(isVideoClassic).length
    };
  }, [videos]);

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
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:shadow-xl hover:shadow-lumina-primary/5 transition-all duration-300 p-6 lg:p-8 rounded-3xl border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm">
      {/* Header section avec titre & filtres rapides */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Performance des contenus</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {filteredVideos.length} {filteredVideos.length > 1 ? 'contenus' : 'contenu'}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Catalogue exhaustif et synchronisé (Lives, Vidéos longues et Shorts)
          </p>
        </div>

        {/* Contrôles de filtrage & recherche */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Barre de recherche */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Rechercher par titre..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white transition-all"
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

          {/* Sélecteur de format */}
          <select 
            value={typeFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white appearance-none cursor-pointer"
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
            className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em 1.2em' }}
          >
            <option value="date-desc">Plus récents d'abord</option>
            <option value="date-asc">Plus anciens d'abord</option>
            <option value="views">Trier par vues</option>
            <option value="engagement">Trier par engagement</option>
            <option value="vph">Trier par vélocité (VPH)</option>
            <option value="likes">Trier par likes</option>
            <option value="comments">Trier par commentaires</option>
          </select>
        </div>
      </div>

      {/* Tableau des contenus */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800/80">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-gray-800/40 text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200/60 dark:border-gray-800">
              <th className="px-4 sm:px-6 py-3.5 font-semibold">Contenu</th>
              <th className="px-3 sm:px-4 py-3.5 font-semibold text-center">Format</th>
              <th className="px-3 sm:px-6 py-3.5 font-semibold">Publié le</th>
              <th className="px-3 sm:px-6 py-3.5 font-semibold text-right">Vues</th>
              <th className="px-3 sm:px-6 py-3.5 font-semibold text-right relative group">
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
              <th className="px-3 sm:px-6 py-3.5 font-semibold text-right">Likes</th>
              <th className="px-3 sm:px-6 py-3.5 font-semibold text-right">Comm.</th>
              <th className="px-3 sm:px-6 py-3.5 font-semibold text-right">Engagement</th>
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
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20 shadow-xs">
                        <Zap size={11} className="fill-amber-500" />
                        Short
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 shadow-xs">
                        <VideoIcon size={11} />
                        Vidéo
                      </span>
                    )}
                  </td>

                  {/* Date de publication */}
                  <td className="px-3 sm:px-6 py-3.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(video.publishedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>

                  {/* Vues */}
                  <td className="px-3 sm:px-6 py-3.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-right whitespace-nowrap">
                    <div className="flex justify-end items-center gap-1.5">
                      {(video.views || 0).toLocaleString('fr-FR')} 
                      <PlayCircle size={13} className="text-gray-400" />
                    </div>
                  </td>

                  {/* VPH */}
                  <td className="px-3 sm:px-6 py-3.5 text-xs sm:text-sm font-bold text-orange-500 text-right whitespace-nowrap">
                    {vph >= 5 ? (
                      <span className="flex justify-end items-center gap-1">
                        {vph.toFixed(1)}/h <span className="animate-pulse">🔥</span>
                      </span>
                    ) : (
                      <span>{vph.toFixed(1)}/h</span>
                    )}
                  </td>

                  {/* Likes */}
                  <td className="px-3 sm:px-6 py-3.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-right whitespace-nowrap">
                    <div className="flex justify-end items-center gap-1.5">
                      {(video.likes || 0).toLocaleString('fr-FR')} 
                      <ThumbsUp size={13} className="text-gray-400" />
                    </div>
                  </td>

                  {/* Commentaires */}
                  <td className="px-3 sm:px-6 py-3.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-right whitespace-nowrap">
                    <div className="flex justify-end items-center gap-1.5">
                      {(video.comments || 0).toLocaleString('fr-FR')} 
                      <MessageCircle size={13} className="text-gray-400" />
                    </div>
                  </td>

                  {/* Taux d'engagement */}
                  <td className="px-3 sm:px-6 py-3.5 text-xs sm:text-sm font-semibold text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20">
                      {(video.engagementRate || 0)}% 
                      <Activity size={12} />
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

      {/* Barre de pagination */}
      {filteredVideos.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
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
