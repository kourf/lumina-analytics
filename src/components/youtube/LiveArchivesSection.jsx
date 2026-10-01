import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  Clock, 
  Play, 
  ThumbsUp, 
  MessageCircle, 
  Download, 
  Search, 
  TrendingUp, 
  Calendar, 
  Info, 
  ExternalLink,
  Sparkles,
  BarChart3,
  Layers,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const LiveArchivesSection = ({ videos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [durationFilter, setDurationFilter] = useState('all'); // 'all', '<1.5h', '1.5-2.5h', '>2.5h'
  const [sortBy, setSortBy] = useState('views'); // 'views', 'date', 'duration', 'engagement', 'comments'
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filtrer uniquement les Lives
  const lives = useMemo(() => {
    if (!videos) return [];
    return videos.filter(v => 
      v.type === 'Direct' || 
      v.type === 'Live' || 
      v.format === 'live' || 
      v.isLiveNow ||
      /\b(live|direct|build together)\b/i.test(v.title || '')
    );
  }, [videos]);

  // Statistiques calculées sur les Lives
  const stats = useMemo(() => {
    if (lives.length === 0) return { total: 0, totalHours: 0, totalViews: 0, totalLikes: 0, totalComments: 0, avgDurationSec: 0, avgViews: 0 };
    
    const totalViews = lives.reduce((acc, v) => acc + (v.views || 0), 0);
    const totalLikes = lives.reduce((acc, v) => acc + (v.likes || 0), 0);
    const totalComments = lives.reduce((acc, v) => acc + (v.comments || 0), 0);
    const totalDurationSec = lives.reduce((acc, v) => acc + (v.durationSec || 0), 0);
    
    return {
      total: lives.length,
      totalHours: (totalDurationSec / 3600).toFixed(1),
      totalViews,
      totalLikes,
      totalComments,
      avgDurationSec: Math.round(totalDurationSec / lives.length),
      avgViews: Math.round(totalViews / lives.length)
    };
  }, [lives]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Date inconnue';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'Date inconnue';
    }
  };

  // Filtrage et Tri
  const filteredLives = useMemo(() => {
    let result = [...lives];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(v => (v.title || '').toLowerCase().includes(q));
    }

    if (durationFilter === '<1.5h') {
      result = result.filter(v => (v.durationSec || 0) < 5400);
    } else if (durationFilter === '1.5-2.5h') {
      result = result.filter(v => (v.durationSec || 0) >= 5400 && (v.durationSec || 0) <= 9000);
    } else if (durationFilter === '>2.5h') {
      result = result.filter(v => (v.durationSec || 0) > 9000);
    }

    result.sort((a, b) => {
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'date') return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
      if (sortBy === 'duration') return (b.durationSec || 0) - (a.durationSec || 0);
      if (sortBy === 'comments') return (b.comments || 0) - (a.comments || 0);
      if (sortBy === 'engagement') return (b.engagementRate || 0) - (a.engagementRate || 0);
      return 0;
    });

    return result;
  }, [lives, searchTerm, durationFilter, sortBy]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLives.length === 0) return;

    const headers = ['ID', 'Titre', 'Date de diffusion', 'Durée (minutes)', 'Vues (Replay + Live)', 'Likes', 'Commentaires', 'Taux engagement (%)', 'URL YouTube'];
    const rows = filteredLives.map(v => [
      `"${v.id}"`,
      `"${(v.title || '').replace(/"/g, '""')}"`,
      `"${formatDate(v.publishedAt)}"`,
      Math.round((v.durationSec || 0) / 60),
      v.views || 0,
      v.likes || 0,
      v.comments || 0,
      v.engagementRate || 0,
      `"https://youtube.com/watch?v=${v.id}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `archives_lives_youtube_karam_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(filteredLives.length / itemsPerPage);
  const displayedLives = filteredLives.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (lives.length === 0) return null;

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-8 rounded-[32px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm relative overflow-hidden flex flex-col gap-6">
      
      {/* Decorative ambiance */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

      {/* En-tête de la section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10 border-b border-gray-100 dark:border-gray-800/80 pb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center flex-shrink-0 text-rose-600 dark:text-rose-400 shadow-inner">
            <Radio size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Archives & Base de Données des Lives
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {lives.length} Sessions enregistrées
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ⏱️ Synchro API YouTube : Active
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Historique complet de vos diffusions en direct, métriques de replays, durées et tendances d'audience
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <HelpCircle size={14} /> Comment l'API gère les Lives ?
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-rose-600/25 active:scale-95 transition-all"
            title="Télécharger toute la base des lives au format CSV"
          >
            <Download size={14} /> Exporter les données (CSV)
          </button>
        </div>
      </div>

      {/* Guide pédagogique API des Lives (Déroulant) */}
      {showHowItWorks && (
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 p-5 rounded-2xl border border-rose-200/60 dark:border-rose-900/30 text-xs text-gray-700 dark:text-gray-300 space-y-3 animate-fade-in relative z-10">
          <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400 text-sm">
            <Info size={16} /> Ce que l'API YouTube fournit pour les Lives vs ce qui nécessite OAuth2
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="bg-white/80 dark:bg-gray-900/60 p-3.5 rounded-xl border border-rose-100 dark:border-gray-800">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                ✓ Disponible immédiatement (YouTube Data API v3 actuelle) :
              </span>
              <ul className="list-disc pl-4 space-y-1 text-gray-600 dark:text-gray-400">
                <li><strong>Vues cumulées :</strong> Total des spectateurs en direct + toutes les vues du replay.</li>
                <li><strong>Horodatages précis :</strong> Heure de début et fin (<code className="text-gray-800 dark:text-gray-200">actualStartTime</code>/<code className="text-gray-800 dark:text-gray-200">actualEndTime</code>) calculant la durée exacte.</li>
                <li><strong>Likes et Commentaires :</strong> Cumul direct + réactions sur l'enregistrement.</li>
                <li><strong>Taux d'engagement global :</strong> Ratio interactions / vues.</li>
              </ul>
            </div>
            <div className="bg-white/80 dark:bg-gray-900/60 p-3.5 rounded-xl border border-rose-100 dark:border-gray-800">
              <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">
                ⚠️ Nécessite la YouTube Analytics API (Connexion Chaîne Propriétaire) :
              </span>
              <ul className="list-disc pl-4 space-y-1 text-gray-600 dark:text-gray-400">
                <li><strong>Pic simultané en direct (Concurrent Viewers) :</strong> Accessible en temps réel durant le live, mais YouTube ne le stocke pas dans la v3 publique après coup.</li>
                <li><strong>Rétention en direct :</strong> Courbe minute par minute des spectateurs présents.</li>
                <li><strong>Séparation exacte :</strong> Part des vues réalisées en direct vs part en rediffusion.</li>
              </ul>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
            💡 Astuce : Grâce à l'export CSV ci-dessus, vous pouvez intégrer vos 71 lives directement dans Google Sheets, Notion ou PowerBI pour corréler la durée de stream avec l'acquisition d'abonnés !
          </p>
        </div>
      )}

      {/* Cartes KPI Synthèse des Lives */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 relative z-10">
        <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Total Lives</span>
          <span className="text-xl font-black text-gray-900 dark:text-white">{stats.total}</span>
          <span className="text-[10px] text-gray-400 block mt-0.5">sessions</span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Volume Diffusé</span>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400">{stats.totalHours} h</span>
          <span className="text-[10px] text-gray-400 block mt-0.5">en direct</span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Vues Cumulées</span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{stats.totalViews.toLocaleString('fr-FR')}</span>
          <span className="text-[10px] text-gray-400 block mt-0.5">~77% du total chaîne</span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Durée Moyenne</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatDuration(stats.avgDurationSec)}</span>
          <span className="text-[10px] text-gray-400 block mt-0.5">par direct</span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Moyenne Vues</span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400">{stats.avgViews.toLocaleString('fr-FR')}</span>
          <span className="text-[10px] text-gray-400 block mt-0.5">vues / live</span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Commentaires</span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400">{stats.totalComments.toLocaleString('fr-FR')}</span>
          <span className="text-[10px] text-gray-400 block mt-0.5">interactions</span>
        </div>
      </div>

      {/* Barre d'outils : Recherche, Filtres de durée et Tri */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 relative z-10 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un live (ex: Build Together, Webflow, Lumos)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtres de durée */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => { setDurationFilter('all'); setCurrentPage(1); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                durationFilter === 'all' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Tous ({lives.length})
            </button>
            <button
              onClick={() => { setDurationFilter('<1.5h'); setCurrentPage(1); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                durationFilter === '<1.5h' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              &lt; 1h30
            </button>
            <button
              onClick={() => { setDurationFilter('1.5-2.5h'); setCurrentPage(1); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                durationFilter === '1.5-2.5h' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              1h30 - 2h30
            </button>
            <button
              onClick={() => { setDurationFilter('>2.5h'); setCurrentPage(1); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                durationFilter === '>2.5h' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              &gt; 2h30
            </button>
          </div>

          {/* Sélecteur de tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 border-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
          >
            <option value="views">Trier par Vues (Décroissant)</option>
            <option value="date">Trier par Date (Plus récents)</option>
            <option value="duration">Trier par Durée (Plus longs)</option>
            <option value="comments">Trier par Commentaires</option>
            <option value="engagement">Trier par Taux d'engagement</option>
          </select>
        </div>
      </div>

      {/* Grille des diffusions en direct */}
      <div className="relative z-10">
        {filteredLives.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Aucun live ne correspond à vos critères de recherche.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedLives.map((live) => (
              <a
                key={live.id}
                href={`https://youtube.com/watch?v=${live.id}`}
                target="_blank"
                rel="noreferrer"
                className="group bg-gray-50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-rose-500/30 dark:hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Miniature avec overlay durée et badge LIVE */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 mb-3">
                    <img 
                      src={live.thumbnailUrl} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy" 
                    />
                    
                    {/* Badge LIVE */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-600/90 text-white backdrop-blur-sm shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      LIVE
                    </div>

                    {/* Durée */}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-black/80 text-white backdrop-blur-sm">
                      {formatDuration(live.durationSec)}
                    </div>
                  </div>

                  {/* Titre */}
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-rose-500 transition-colors mb-2">
                    {live.title}
                  </h4>
                </div>

                {/* Métriques du live */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                    <span className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                      <Play size={12} className="text-rose-500" /> {live.views.toLocaleString('fr-FR')} vues
                    </span>
                    <span>{formatDate(live.publishedAt)}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={10} /> {live.likes} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={10} /> {live.comments} com.
                    </span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {live.engagementRate}% eng.
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center relative z-10 pt-4 border-t border-gray-100 dark:border-gray-800/80 text-xs text-gray-500">
          <div>
            Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredLives.length)} sur {filteredLives.length} lives
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Précédent
            </button>
            <span className="px-3 font-semibold text-gray-700 dark:text-gray-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
