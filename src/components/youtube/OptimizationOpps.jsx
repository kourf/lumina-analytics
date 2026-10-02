import React, { useState, useMemo } from 'react';
import { Target, AlertCircle, PlayCircle, Sparkles, TrendingDown, ArrowUpRight, Clock, Info, X } from 'lucide-react';

export const OptimizationOpps = ({ videos, allVideos }) => {
  const [activeTab, setActiveTab] = useState('videos');
  const [showWhy, setShowWhy] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Utiliser la liste complète si disponible pour garantir 5 par format
  const sourceVideos = allVideos && allVideos.length > 0 ? allVideos : (videos || []);

  const isLive = (v) => v.type === 'Live' || v.type === 'Direct' || v.format === 'live' || v.isLiveNow;
  const isShort = (v) => !isLive(v) && (v.type === 'Short' || v.format === 'short' || (v.durationSec > 0 && v.durationSec <= 180) || /#(shorts|short|pourtoi|pourtoii|fyp|reels|tiktok)\b/i.test(v.title || ''));
  const isClassic = (v) => !isLive(v) && !isShort(v);

  // Extraire les 5 contenus les moins performants (plus de 48h) pour chaque format
  const { classicVideos, shortVideos, directVideos } = useMemo(() => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const getWeakest = (filterFn) => {
      const filtered = sourceVideos.filter(filterFn);
      // Filtrer de préférence les vidéos de plus de 48h pour laisser le temps de décoller
      const mature = filtered.filter(v => new Date(v.publishedAt) < twoDaysAgo);
      const candidates = mature.length >= 5 ? mature : filtered;
      // Trier par vues croissantes (les moins vues en premier) et prendre les 5 premières
      return [...candidates].sort((a, b) => (a.views || 0) - (b.views || 0)).slice(0, 5);
    };

    return {
      classicVideos: getWeakest(isClassic),
      shortVideos: getWeakest(isShort),
      directVideos: getWeakest(isLive)
    };
  }, [sourceVideos]);

  const displayedVideos = activeTab === 'videos' ? classicVideos : activeTab === 'shorts' ? shortVideos : directVideos;

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ''}`;
    return `${s}s`;
  };

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/10 transition-all duration-300 p-6 rounded-3xl border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm flex flex-col h-full relative overflow-visible">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-500 flex-shrink-0">
            <Target size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Contenus à surveiller</h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Top 5 par format
              </span>

              {/* Bouton Infobulle Utilité */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                  title="Comprendre l'utilité de la section Contenus à surveiller"
                >
                  <Info size={16} />
                </button>

                {showTooltip && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-80 sm:w-96 bg-gray-900 text-white p-4 rounded-2xl text-xs z-50 shadow-2xl border border-gray-700 animate-fade-in font-normal leading-relaxed">
                    <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-gray-800">
                      <div className="flex items-center gap-1.5">
                        <Target size={14} className="text-indigo-400" />
                        <strong className="text-indigo-400 font-bold">Utilité de cette section</strong>
                      </div>
                      <button onClick={() => setShowTooltip(false)} className="text-gray-400 hover:text-white p-1">
                        <X size={13} />
                      </button>
                    </div>

                    <p className="text-gray-300 text-[11px] mb-2.5">
                      Cette section isole automatiquement les <strong>5 contenus les moins vus</strong> de chaque format (Vidéos, Shorts, Directs) ayant plus de 48h d'existence.
                    </p>

                    <div className="space-y-2 text-[11px] text-gray-300 bg-gray-800/60 p-2.5 rounded-xl border border-gray-700/50 mb-2.5">
                      <div>
                        <strong className="text-amber-300">🎯 Pourquoi c'est votre plus grand levier ?</strong>
                        <p className="text-gray-400 text-[10.5px] mt-0.5">
                          Sur YouTube, une vidéo qui stagne en vues n'a souvent qu'un seul problème : son <strong>packaging</strong> (titre trop neutre ou miniature peu incitative). Elle a une bonne rétention mais les spectateurs ne cliquent pas (faible CTR).
                        </p>
                      </div>
                      <div>
                        <strong className="text-emerald-300">🚀 L'effet "Second Souffle" de l'algorithme :</strong>
                        <p className="text-gray-400 text-[10.5px] mt-0.5">
                          YouTube re-teste constamment les vidéos dont le titre ou la miniature changent. Modifier une cover peut relancer les impressions et doubler vos vues sans créer de nouvelle vidéo !
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-1 text-[10.5px] text-gray-300">
                      <li>• <strong>Plan Titre :</strong> Formulez une promesse claire ou une question forte qui attise la curiosité.</li>
                      <li>• <strong>Plan Miniature :</strong> Augmentez le contraste, 3 mots lisibles sur smartphone max, visage expressif.</li>
                      <li>• <strong>SEO :</strong> Enrichissez la description et les premiers chapitres pour capter la recherche.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Opportunités d'optimisation (titres & miniatures)</p>
          </div>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex-shrink-0">
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'videos' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Vidéos ({classicVideos.length})
          </button>
          <button
            onClick={() => setActiveTab('shorts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'shorts' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Shorts ({shortVideos.length})
          </button>
          <button
            onClick={() => setActiveTab('directs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'directs' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Lives ({directVideos.length})
          </button>
        </div>
      </div>
      
      {/* Explication & Fréquence de calcul */}
      <div className="mb-4 relative z-10 mt-2 flex items-center justify-between flex-wrap gap-2">
        <button 
          onClick={() => setShowWhy(!showWhy)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full"
        >
          <AlertCircle size={14} /> Pourquoi ces contenus ?
        </button>

        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <Clock size={11} /> Recalculé à chaque synchronisation YouTube (exclut &lt; 48h)
        </span>
      </div>

      {showWhy && (
        <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 flex flex-col gap-1.5 animate-fade-in relative z-10 text-xs">
          <div className="flex items-center justify-between">
            <strong className="text-indigo-900 dark:text-indigo-200 font-semibold flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-500" /> Guide d'optimisation rapide :
            </strong>
            <button onClick={() => setShowWhy(false)} className="text-gray-400 hover:text-indigo-600 dark:hover:text-white">
              <X size={12} />
            </button>
          </div>
          <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed text-[11px]">
            Ces 5 contenus enregistrent les volumes de vues les plus bas de leur catégorie après au moins 48h de diffusion. Cliquez sur <strong>« Tester nouveau titre »</strong> pour ouvrir YouTube Studio et ajuster le titre ou la miniature afin de réveiller la distribution algorithmique.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 flex-1 relative z-10">
        {displayedVideos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400 py-6">
            Aucun {activeTab === 'shorts' ? 'Short' : activeTab === 'directs' ? 'Live' : 'vidéo'} à surveiller.
          </div>
        ) : (
          displayedVideos.map((video, idx) => (
            <a 
              key={video.id} 
              href={`https://youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex gap-3.5 group p-2.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-indigo-500/20 transition-all duration-200"
            >
              {/* Miniature avec overlay durée */}
              <div className={`relative ${activeTab === 'shorts' ? 'w-14 h-24' : 'w-28 h-16'} rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 opacity-90 group-hover:opacity-100 transition-opacity`}>
                <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[9px] font-bold bg-black/80 text-white backdrop-blur-sm">
                  {formatDuration(video.durationSec)}
                </div>
              </div>

              {/* Détails & Suggestion */}
              <div className="flex flex-col justify-center py-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${
                    activeTab === 'shorts' 
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20' 
                      : activeTab === 'directs' 
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20' 
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20'
                  }`}>
                    {activeTab === 'shorts' ? 'Short' : activeTab === 'directs' ? 'Live' : 'Vidéo'}
                  </span>
                  
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <TrendingDown size={11} /> Opportunité #{idx + 1}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1 leading-snug group-hover:text-indigo-500 transition-colors">
                  {video.title}
                </h4>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  <span className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-200 text-xs">
                    <PlayCircle size={12} className="text-gray-400" /> {(video.views || 0).toLocaleString('fr-FR')} vues
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-0.5">
                    Tester nouveau titre <ArrowUpRight size={10} />
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
