import React, { useState } from 'react';
import { Target, ExternalLink, Users, Eye, Plus, Link as LinkIcon, Trash2, Calendar, Clock, Video, Activity, ThumbsUp, MessageCircle } from 'lucide-react';
import { db } from '../../config/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';

const CompetitorCard = ({ competitor, onRemove }) => {
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Extraire les mois uniques disponibles dans les vidéos
  const availableMonths = React.useMemo(() => {
    if (!competitor.videos) return [];
    const months = new Set();
    competitor.videos.forEach(v => {
      const d = new Date(v.publishedAt);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse().map(m => {
      const [year, month] = m.split('-');
      const date = new Date(year, parseInt(month) - 1);
      return {
        value: m,
        label: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      };
    });
  }, [competitor.videos]);

  const filteredVideos = React.useMemo(() => {
    if (!competitor.videos) return [];
    if (selectedMonth === 'all') return competitor.videos;
    return competitor.videos.filter(v => {
      const d = new Date(v.publishedAt);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return m === selectedMonth;
    });
  }, [competitor.videos, selectedMonth]);

  const topVideos = React.useMemo(() => {
    return filteredVideos.filter(v => v.type === 'Vidéo').sort((a, b) => b.views - a.views).slice(0, 5);
  }, [filteredVideos]);

  const topShorts = React.useMemo(() => {
    return filteredVideos.filter(v => v.type === 'Short').sort((a, b) => b.views - a.views).slice(0, 5);
  }, [filteredVideos]);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString('fr-FR');
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m${s > 0 ? ` ${s}s` : ''}`;
    return `${s}s`;
  };

  return (
    <div className="group bg-gray-50 dark:bg-gray-800/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col lg:flex-row gap-6 transition-all hover:shadow-md hover:border-orange-100 dark:hover:border-orange-900/30 w-full">
      
      <div className="flex-1 flex flex-col min-w-[280px] xl:max-w-md">
        <div className="flex gap-4 items-start mb-4">
          <div className="relative flex-shrink-0">
            <img src={competitor.thumbnailUrl} alt={competitor.title} className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm" />
            <button 
              onClick={() => onRemove(competitor)}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center transition-colors hover:bg-red-200"
              title="Retirer ce concurrent"
            >
              <Trash2 size={12} />
            </button>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{competitor.title}</h4>
              <a href={`https://youtube.com/${competitor.customUrl}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                <ExternalLink size={14} />
              </a>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm border border-gray-100 dark:border-gray-700"><Users size={12} className="text-blue-500"/> {formatNumber(competitor.subscribers)} abos</span>
              <span className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm border border-gray-100 dark:border-gray-700"><Eye size={12} className="text-red-500"/> {formatNumber(competitor.totalViews)} vues</span>
              <span className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm border border-gray-100 dark:border-gray-700"><ThumbsUp size={12} className="text-pink-500"/> {formatNumber(competitor.totalLikes)} likes</span>
              <span className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm border border-gray-100 dark:border-gray-700"><Activity size={12} className="text-green-500"/> {competitor.engagementRate}% eng.</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-gray-200 dark:border-gray-700/50">
          {/* Rythme */}
          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl flex flex-col justify-center border border-gray-100 dark:border-gray-700/50">
            <span className="flex items-center justify-center gap-1 text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-wider"><Calendar size={10}/> / Mois (estimé)</span>
            <p className="text-sm font-bold text-gray-900 dark:text-white text-center leading-tight">
              {competitor.estimatedPerMonth || competitor.publishedLast30Days || 0} <span className="text-[10px] text-gray-400 font-normal">total</span>
            </p>
            <div className="flex justify-center gap-1.5 text-[9px] mt-1 font-medium">
              <span className="text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-1 rounded">{competitor.estimatedVideosPerMonth || 0} Classiques</span>
              <span className="text-red-500 bg-red-50 dark:bg-red-500/10 px-1 rounded">{competitor.estimatedShortsPerMonth || 0} Shorts</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl flex flex-col justify-center border border-gray-100 dark:border-gray-700/50">
            <span className="flex items-center justify-center gap-1 text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-wider"><Calendar size={10}/> / An (estimé)</span>
            <p className="text-sm font-bold text-gray-900 dark:text-white text-center leading-tight">
              {competitor.estimatedPerYear || competitor.publishedLastYear || 0} <span className="text-[10px] text-gray-400 font-normal">total</span>
            </p>
            <div className="flex justify-center gap-1.5 text-[9px] mt-1 font-medium">
              <span className="text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-1 rounded">{(competitor.estimatedVideosPerMonth || 0) * 12} Classiques</span>
              <span className="text-red-500 bg-red-50 dark:bg-red-500/10 px-1 rounded">{(competitor.estimatedShortsPerMonth || 0) * 12} Shorts</span>
            </div>
          </div>
          
          {/* Stratégie / Formats */}
          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl text-center sm:col-span-2 flex flex-col justify-center">
            <span className="flex items-center justify-center gap-1 text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-wider"><Video size={10}/> Ratio Récent</span>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-1 flex overflow-hidden">
              <div style={{ width: `${(competitor.videosCount / Math.max(1, competitor.videosCount + competitor.shortsCount)) * 100}%` }} className="bg-blue-500 h-full"></div>
              <div style={{ width: `${(competitor.shortsCount / Math.max(1, competitor.videosCount + competitor.shortsCount)) * 100}%` }} className="bg-red-500 h-full"></div>
            </div>
            <div className="flex justify-between text-[9px] mt-1 text-gray-500 px-1">
              <span className="text-blue-500 font-semibold">{competitor.videosCount} Classiques</span>
              <span className="text-red-500 font-semibold">{competitor.shortsCount} Shorts</span>
            </div>
          </div>

          {/* Durées Moyennes */}
          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl text-center sm:col-span-4 flex items-center justify-between px-4 mt-1">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase">Durée Moyenne</span>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Classique : <span className="text-blue-500">{formatDuration(competitor.avgVideoDurationSec)}</span>
              </span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Short : <span className="text-red-500">{formatDuration(competitor.avgShortDurationSec)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performances (Vidéos et Shorts) */}
      {(topVideos.length > 0 || topShorts.length > 0) && (
        <div className="flex-[2] pt-4 lg:pt-0 lg:pl-6 lg:border-l lg:border-t-0 border-t border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target size={12} className="text-orange-400"/> Top Performances
            </h5>
            {availableMonths.length > 0 && (
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-[10px] font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded px-2 py-1 outline-none"
              >
                <option value="all">Tous les mois (Top Global)</option>
                {availableMonths.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {topVideos.length > 0 && (
              <div>
                <h6 className="text-[10px] font-semibold text-blue-500 mb-2 uppercase">Top 5 Vidéos Classiques</h6>
                <div className="space-y-2">
                  {topVideos.map(v => (
                    <a key={v.id} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700/50 group">
                      <div className="relative shrink-0 w-16 h-9 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <img src={v.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] px-1 rounded font-medium">{formatDuration(v.durationSec)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-500 transition-colors">{v.title}</p>
                        <p className="text-[10px] text-gray-500 font-medium flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5"><Eye size={10} className="text-gray-400"/> {formatNumber(v.views)}</span>
                          <span className="flex items-center gap-0.5" title={v.likes === 0 ? "Le créateur a probablement masqué les likes via l'API YouTube" : "Likes"}>
                            <ThumbsUp size={10} className="text-gray-400"/> 
                            {v.likes > 0 ? formatNumber(v.likes) : <span className="text-gray-400/80 italic text-[9px]">Masqué</span>}
                          </span>
                          <span className="flex items-center gap-0.5" title={v.comments === 0 ? "Commentaires désactivés ou masqués" : "Commentaires"}>
                            <MessageCircle size={10} className="text-gray-400"/> 
                            {v.comments > 0 ? formatNumber(v.comments) : <span className="text-gray-400/80 italic text-[9px]">Désactivé</span>}
                          </span>
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {topShorts.length > 0 && (
              <div>
                <h6 className="text-[10px] font-semibold text-red-500 mb-2 uppercase">Top 5 Shorts</h6>
                <div className="space-y-2">
                  {topShorts.map(v => (
                    <a key={v.id} href={`https://youtube.com/shorts/${v.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700/50 group">
                      <div className="relative shrink-0 w-8 h-12 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <img src={v.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] px-1 rounded font-medium">{formatDuration(v.durationSec)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-red-500 transition-colors">{v.title}</p>
                        <p className="text-[10px] text-gray-500 font-medium flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5"><Eye size={10} className="text-gray-400"/> {formatNumber(v.views)}</span>
                          <span className="flex items-center gap-0.5" title={v.likes === 0 ? "Le créateur a probablement masqué les likes via l'API YouTube" : "Likes"}>
                            <ThumbsUp size={10} className="text-gray-400"/> 
                            {v.likes > 0 ? formatNumber(v.likes) : <span className="text-gray-400/80 italic text-[9px]">Masqué</span>}
                          </span>
                          <span className="flex items-center gap-0.5" title={v.comments === 0 ? "Commentaires désactivés ou masqués" : "Commentaires"}>
                            <MessageCircle size={10} className="text-gray-400"/> 
                            {v.comments > 0 ? formatNumber(v.comments) : <span className="text-gray-400/80 italic text-[9px]">Désactivé</span>}
                          </span>
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const CompetitorInspiration = ({ competitors = [], onRefresh, onRemoveLocal }) => {
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleAddCompetitor = async () => {
    if (!competitorUrl.trim()) return;
    setIsAdding(true);
    setErrorMsg(null);
    try {
      const userRef = doc(db, 'users', 'karamokho');
      await updateDoc(userRef, {
        trackedCompetitors: arrayUnion(competitorUrl.trim())
      });
      
      if (onRefresh) await onRefresh();
      
      setCompetitorUrl('');
    } catch (error) {
      console.error("Erreur lors de l'ajout du concurrent:", error);
      setErrorMsg("L'analyse a échoué. Vérifiez l'URL ou réessayez plus tard.");
      try {
        const userRef = doc(db, 'users', 'karamokho');
        await updateDoc(userRef, {
          trackedCompetitors: arrayRemove(competitorUrl.trim())
        });
      } catch (e) {}
    } finally {
      setIsAdding(false);
    }
  };

  const removeCompetitor = async (competitor) => {
    try {
      if (onRemoveLocal) onRemoveLocal(competitor.id);
      const userRef = doc(db, 'users', 'karamokho');
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const tracked = userSnap.data().trackedCompetitors || [];
        const newTracked = tracked.filter(url => 
          !url.includes(competitor.customUrl) && 
          (!competitor.originalUrl || url !== competitor.originalUrl)
        );
        await updateDoc(userRef, {
          trackedCompetitors: newTracked
        });
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/10 transition-all duration-300 p-6 rounded-3xl border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm mt-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-500">
            <Target size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Analyse des Concurrents</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Surveillez les statistiques publiques et la stratégie de vos concurrents</p>
          </div>
        </div>

        <div className="flex flex-col w-full md:w-auto gap-2">
          <div className="flex gap-2 w-full">
            <div className="relative flex-1 md:w-72">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
                placeholder="Coller l'URL d'une chaîne YouTube..."
                className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white transition-all"
              />
            </div>
            <button 
              onClick={handleAddCompetitor}
              disabled={!competitorUrl.trim() || isAdding}
              className={`px-4 py-2.5 font-medium text-sm rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                competitorUrl.trim() && !isAdding
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-500/20' 
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              {isAdding ? (
                <span className="animate-pulse">Analyse en cours...</span>
              ) : (
                <>
                  <Plus size={16} /> Ajouter
                </>
              )}
            </button>
          </div>
          {errorMsg && (
            <p className="text-xs text-red-500 font-medium px-2">{errorMsg}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 relative z-10">
        {competitors.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-lumina-lightBorder dark:border-lumina-darkBorder rounded-2xl">
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucun concurrent surveillé pour le moment.</p>
            <p className="text-xs text-gray-400 mt-1">Collez l'URL d'une chaîne ci-dessus pour commencer l'analyse.</p>
          </div>
        ) : (
          competitors.map((competitor) => (
            <CompetitorCard key={competitor.id} competitor={competitor} onRemove={removeCompetitor} />
          ))
        )}
      </div>
    </div>
  );
};

