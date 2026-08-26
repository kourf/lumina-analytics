import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Video, PlayCircle, Heart, Share2, MessageCircle, Search, Sparkles, TrendingUp, Filter, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

export const TikTokRecentVideos = ({ recentVideos = [] }) => {
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, views_desc, views_asc
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVideos = useMemo(() => {
    return recentVideos.filter(v => 
      (v.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recentVideos, searchQuery]);

  const sortedVideos = useMemo(() => {
    return [...filteredVideos].sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === 'date_asc') {
        return new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'views_desc') {
        return (b.views || 0) - (a.views || 0);
      } else if (sortBy === 'views_asc') {
        return (a.views || 0) - (b.views || 0);
      } else if (sortBy === 'likes_desc') {
        return (b.likes || 0) - (a.likes || 0);
      } else if (sortBy === 'likes_asc') {
        return (a.likes || 0) - (b.likes || 0);
      } else if (sortBy === 'shares_desc') {
        return (b.shares || 0) - (a.shares || 0);
      } else if (sortBy === 'shares_asc') {
        return (a.shares || 0) - (b.shares || 0);
      } else if (sortBy === 'comments_desc') {
        return (b.comments || 0) - (a.comments || 0);
      } else if (sortBy === 'comments_asc') {
        return (a.comments || 0) - (b.comments || 0);
      }
      return 0;
    });
  }, [filteredVideos, sortBy]);

  const totalViews = recentVideos.reduce((acc, v) => acc + (v.views || 0), 0);
  const totalLikes = recentVideos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const avgViews = recentVideos.length > 0 ? Math.round(totalViews / recentVideos.length) : 0;

  return (
    <div className="w-full bg-white dark:bg-[#111827]/80 backdrop-blur-xl border border-slate-200 dark:border-[#1F2937] rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-sm transition-all duration-300">
      <div className="p-6 md:p-8">
        
        {/* Header & Filtres */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                <Video className="w-5 h-5 text-teal-600 dark:text-[#25F4EE]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Catalogue Vidéos TikTok
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-[#25F4EE]/10 text-teal-700 dark:text-[#25F4EE] border border-teal-200 dark:border-[#25F4EE]/20">
                    {recentVideos.length} vidéos
                  </span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">Performance et analyse détaillée de vos publications</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Barre de recherche */}
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une vidéo..."
                className="w-full bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#25F4EE]/50 transition-all"
              />
            </div>

            {/* Tri */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-slate-400 dark:text-gray-500" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-100 dark:bg-[#1F2937] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#25F4EE]/50 cursor-pointer transition-colors hover:bg-slate-200 dark:hover:bg-gray-800"
              >
                <option value="date_desc">Plus récentes</option>
                <option value="date_asc">Plus anciennes</option>
                <option value="views_desc">Plus vues</option>
                <option value="views_asc">Moins vues</option>
                <option value="likes_desc">Plus de likes</option>
                <option value="likes_asc">Moins de likes</option>
                <option value="shares_desc">Plus de partages</option>
                <option value="shares_asc">Moins de partages</option>
                <option value="comments_desc">Plus de commentaires</option>
                <option value="comments_asc">Moins de commentaires</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tableau des Vidéos */}
        {sortedVideos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/5">
                  <th className="pb-3 pt-2 px-4 font-semibold text-slate-500 dark:text-gray-400 text-xs tracking-wider uppercase">Vidéo</th>
                  <th className="pb-3 pt-2 px-4 font-semibold text-slate-500 dark:text-gray-400 text-xs tracking-wider uppercase text-right">Vues</th>
                  <th className="pb-3 pt-2 px-4 font-semibold text-slate-500 dark:text-gray-400 text-xs tracking-wider uppercase text-right">Likes</th>
                  <th className="pb-3 pt-2 px-4 font-semibold text-slate-500 dark:text-gray-400 text-xs tracking-wider uppercase text-right">Partages</th>
                  <th className="pb-3 pt-2 px-4 font-semibold text-slate-500 dark:text-gray-400 text-xs tracking-wider uppercase text-right">Commentaires</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {sortedVideos.map((video, index) => {
                  const isTop = (video.views || 0) >= 30000;
                  return (
                    <tr 
                      key={video.id || index} 
                      className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                      onClick={() => window.open(`https://www.tiktok.com/@karam.drame/video/${video.id}`, '_blank')}
                    >
                      <td className="py-3.5 px-4 text-slate-900 dark:text-white font-medium flex items-center gap-4">
                        <div className="relative w-14 h-[75px] rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group-hover:border-[#25F4EE]/50 transition-colors shrink-0 shadow-sm">
                          {video.coverUrl ? (
                            <img src={video.coverUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center">
                              <Video className="text-gray-400 dark:text-slate-700 w-5 h-5" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <PlayCircle className="text-white w-6 h-6 drop-shadow-md" />
                          </div>
                          {isTop && (
                            <span className="absolute top-1 left-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded shadow-sm">
                              TOP
                            </span>
                          )}
                        </div>
                        <div className="max-w-[280px] md:max-w-[420px]">
                          <p className="line-clamp-2 leading-snug text-xs md:text-sm font-semibold text-slate-800 dark:text-gray-200 group-hover:text-teal-600 dark:group-hover:text-[#25F4EE] transition-colors">
                            {video.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-gray-500 mt-1.5 flex items-center gap-2">
                            <span>{new Date(video.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span className="text-slate-300 dark:text-gray-700">•</span>
                            <span className="flex items-center gap-1 group-hover:underline text-teal-600 dark:text-[#25F4EE]">
                              Ouvrir sur TikTok <ExternalLink size={10} />
                            </span>
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-slate-900 dark:text-white font-bold font-mono text-xs md:text-sm">
                          <PlayCircle className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                          {new Intl.NumberFormat('fr-FR').format(video.views || 0)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-slate-700 dark:text-gray-300 font-semibold font-mono text-xs md:text-sm">
                          <Heart className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500 group-hover:text-[#FE2C55] transition-colors" />
                          {new Intl.NumberFormat('fr-FR').format(video.likes || 0)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-slate-700 dark:text-gray-300 font-semibold font-mono text-xs md:text-sm">
                          <Share2 className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500 group-hover:text-teal-500 transition-colors" />
                          {new Intl.NumberFormat('fr-FR').format(video.shares || 0)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-slate-700 dark:text-gray-300 font-semibold font-mono text-xs md:text-sm">
                          <MessageCircle className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" />
                          {new Intl.NumberFormat('fr-FR').format(video.comments || 0)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
            <Video className="w-10 h-10 text-slate-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-gray-300">Aucune vidéo ne correspond à votre recherche</p>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">Essayez un autre mot-clé ou réinitialisez la recherche.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default TikTokRecentVideos;
