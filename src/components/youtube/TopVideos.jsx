import React, { useState } from 'react';
import { TrendingUp, MessageCircle, ThumbsUp, PlayCircle } from 'lucide-react';

export const TopVideos = ({ videos }) => {
  const [activeTab, setActiveTab] = useState('videos');

  if (!videos || videos.length === 0) return null;

  const classicVideos = videos.filter(v => v.type === 'Vidéo' || v.type === 'Video').sort((a, b) => b.views - a.views).slice(0, 5);
  const shortVideos = videos.filter(v => v.type === 'Short').sort((a, b) => b.views - a.views).slice(0, 5);
  const directVideos = videos.filter(v => v.type === 'Direct').sort((a, b) => b.views - a.views).slice(0, 5);

  const displayedVideos = activeTab === 'videos' ? classicVideos : activeTab === 'shorts' ? shortVideos : directVideos;

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/10 transition-all duration-300 p-6 rounded-3xl border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl text-yellow-500">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top 5</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Contenus les plus vus</p>
          </div>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'videos' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Vidéos
          </button>
          <button
            onClick={() => setActiveTab('shorts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'shorts' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Shorts
          </button>
          <button
            onClick={() => setActiveTab('directs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'directs' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Directs
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {displayedVideos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            Aucun {activeTab === 'shorts' ? 'Short' : activeTab === 'directs' ? 'Direct' : 'vidéo'} disponible.
          </div>
        ) : (
          displayedVideos.map((video, index) => (
            <a 
              key={video.id} 
              href={`https://youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex gap-4 group p-3 -mx-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className={`relative ${activeTab === 'shorts' ? 'w-16 h-28' : 'w-28 h-16'} rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800`}>
                <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                  #{index + 1}
                </div>
              </div>
              <div className="flex flex-col justify-center py-0.5 flex-1">
                <div className="flex items-start gap-2 mb-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0 ${activeTab === 'shorts' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : activeTab === 'directs' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                    {activeTab === 'shorts' ? 'Short' : activeTab === 'directs' ? 'Direct' : 'Vidéo'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-500 transition-colors mb-2">
                  {video.title}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                    <PlayCircle size={12} className="text-red-500" /> {video.views.toLocaleString('fr-FR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={12} /> {video.likes.toLocaleString('fr-FR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={12} /> {video.comments.toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
};

