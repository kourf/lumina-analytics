import React, { useState } from 'react';
import { Search, PlayCircle, ThumbsUp, MessageCircle, Activity, Info } from 'lucide-react';

export const VideoPerformance = ({ videos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showVPHTooltip, setShowVPHTooltip] = useState(false);

  if (!videos || videos.length === 0) return null;

  const calculateVPH = (publishedAt, views) => {
    if (!publishedAt || !views) return 0;
    const hours = (new Date() - new Date(publishedAt)) / (1000 * 60 * 60);
    return Math.max(0, views / Math.max(1, hours));
  };

  const filteredVideos = videos
    .filter(v => typeFilter === 'all' || 
                 (typeFilter === 'video' && (v.type === 'Video' || v.type === 'Vidéo')) || 
                 (typeFilter === 'short' && v.type === 'Short') ||
                 (typeFilter === 'direct' && v.type === 'Direct'))
    .filter(v => v.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'views') return b.views - a.views;
      if (sortBy === 'engagement') return b.engagementRate - a.engagementRate;
      if (sortBy === 'vph') {
        const aHours = Math.max(1, (new Date() - new Date(a.publishedAt)) / (1000 * 60 * 60));
        const bHours = Math.max(1, (new Date() - new Date(b.publishedAt)) / (1000 * 60 * 60));
        return (b.views / bHours) - (a.views / aHours);
      }
      if (sortBy === 'date-asc') return new Date(a.publishedAt) - new Date(b.publishedAt);
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/10 transition-all duration-300 p-6 lg:p-8 rounded-3xl border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Performance des vidéos</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dernières vidéos publiées</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Rechercher une vidéo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white"
            />
          </div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white appearance-none cursor-pointer w-full sm:w-auto"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em 1.2em' }}
          >
            <option value="all">Tous les formats</option>
            <option value="video">Vidéos uniquement</option>
            <option value="short">Shorts uniquement</option>
            <option value="direct">Directs (Lives) uniquement</option>
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white appearance-none cursor-pointer w-full sm:w-auto"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em 1.2em' }}
          >
            <option value="date-desc">Trier par date (Du plus récent au moins récent)</option>
            <option value="date-asc">Trier par date (Du plus ancien au plus récent)</option>
            <option value="views">Trier par vues</option>
            <option value="engagement">Trier par engagement</option>
            <option value="vph">Trier par vélocité (VPH)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-800/20 text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold">Contenu</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-center">Type</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold">Publié le</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-right">Vues</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-right relative group">
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
                    Indique la moyenne de vues par heure depuis la publication. Plus le chiffre est élevé, plus la vidéo est performante actuellement !<br /><br />
                    <span className="text-gray-300"><em>Exemple : Un VPH de 0,3/h signifie qu'il faut environ 3 heures pour obtenir 1 nouvelle vue. Si le chiffre monte (ex: 2/h), c'est que l'algorithme recommence à la mettre en avant !</em></span>
                  </div>
                )}
              </th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-right">Likes</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-right">Comm.</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-right">Engagement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredVideos.map((video) => {
              const vph = calculateVPH(video.publishedAt, video.views);
              return (
              <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-3 sm:px-6 py-3 sm:py-4 min-w-[200px] sm:min-w-[250px]">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer" className={`relative ${video.type === 'Short' ? 'w-8 h-12 sm:w-10 sm:h-16' : 'w-16 h-10 sm:w-20 sm:h-12'} rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 group block`}>
                      <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    </a>
                    <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer" className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-red-500 transition-colors">
                      {video.title}
                    </a>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                  <span className={`inline-flex px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${video.type === 'Short' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                    {video.type === 'Short' ? 'Short' : 'Vidéo'}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {new Date(video.publishedAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 dark:text-white text-right">
                  <div className="flex justify-end items-center gap-1 sm:gap-1.5">
                    {video.views.toLocaleString('fr-FR')} <PlayCircle size={12} className="text-gray-400 sm:w-[14px] sm:h-[14px]" />
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-orange-500 text-right whitespace-nowrap">
                  {vph > 100 ? (
                    <span className="flex justify-end items-center gap-1">
                      {vph.toFixed(1)}/h <span className="animate-pulse text-[10px] sm:text-sm">🔥</span>
                    </span>
                  ) : (
                    <span>{vph.toFixed(1)}/h</span>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-right">
                  <div className="flex justify-end items-center gap-1 sm:gap-1.5">
                    {video.likes.toLocaleString('fr-FR')} <ThumbsUp size={12} className="text-gray-400 sm:w-[14px] sm:h-[14px]" />
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-right">
                  <div className="flex justify-end items-center gap-1 sm:gap-1.5">
                    {video.comments.toLocaleString('fr-FR')} <MessageCircle size={12} className="text-gray-400 sm:w-[14px] sm:h-[14px]" />
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-indigo-500 dark:text-indigo-400 text-right">
                  <div className="flex justify-end items-center gap-1 sm:gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 inline-flex px-1.5 sm:px-2 py-1 rounded-lg">
                    {video.engagementRate}% <Activity size={12} className="sm:w-[14px] sm:h-[14px]" />
                  </div>
                </td>
              </tr>
              );
            })}
            {filteredVideos.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                  Aucun contenu ne correspond à vos filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

