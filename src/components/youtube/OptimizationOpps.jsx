import React from 'react';
import { Target, AlertCircle, PlayCircle } from 'lucide-react';

export const OptimizationOpps = ({ videos }) => {
  const [activeTab, setActiveTab] = React.useState('videos');
  const [showWhy, setShowWhy] = React.useState(false);

  if (!videos || videos.length === 0) return null;

  const classicVideos = videos.filter(v => v.type === 'Vidéo' || v.type === 'Video').slice(0, 3);
  const shortVideos = videos.filter(v => v.type === 'Short').slice(0, 3);
  const directVideos = videos.filter(v => v.type === 'Direct').slice(0, 3);

  const displayedVideos = activeTab === 'videos' ? classicVideos : activeTab === 'shorts' ? shortVideos : directVideos;

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/10 transition-all duration-300 p-6 rounded-3xl border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm flex flex-col h-full relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-500">
            <Target size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Contenus à surveiller</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Vidéos nécessitant une optimisation</p>
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
      
      <div className="mb-4 relative z-10 mt-2">
        <button 
          onClick={() => setShowWhy(!showWhy)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full"
        >
          <AlertCircle size={14} /> Pourquoi ces contenus ?
        </button>
        {showWhy && (
          <div className="mt-2 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800/30 flex gap-2 items-start animate-fade-in">
            <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
              Ils ont été sélectionnés car ils sont publiés depuis plus de 48h, mais génèrent le moins de vues comparé à vos autres contenus récents de ce format. Testez une nouvelle miniature ou un nouveau titre pour les relancer !
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 flex-1 relative z-10">
        {displayedVideos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400 py-4">
            Aucun {activeTab === 'shorts' ? 'Short' : activeTab === 'directs' ? 'Direct' : 'vidéo'} à surveiller.
          </div>
        ) : (
          displayedVideos.map((video) => (
            <a 
              key={video.id} 
              href={`https://youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex gap-4 group p-3 -mx-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className={`relative ${activeTab === 'shorts' ? 'w-12 h-20' : 'w-24 h-14'} rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 opacity-80 group-hover:opacity-100 transition-opacity`}>
                <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover grayscale-[30%]" />
              </div>
              <div className="flex flex-col justify-center py-0.5 flex-1">
                <div className="flex items-start gap-2 mb-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0 ${activeTab === 'shorts' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : activeTab === 'directs' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                    {activeTab === 'shorts' ? 'Short' : activeTab === 'directs' ? 'Direct' : 'Vidéo'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-500 transition-colors">
                  {video.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <PlayCircle size={12} /> {video.views.toLocaleString('fr-FR')} vues
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

