import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Clock, Users, Loader2, AlertCircle, MapPin, Activity, 
  PieChart, TrendingUp, Filter, Share2, UserPlus, UserMinus, 
  Smartphone, Monitor, Tablet, Tv, ShieldCheck, Sparkles, Eye, 
  CheckCircle2, PlayCircle, Trophy, HelpCircle, Laptop, Info, X 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

// Composant d'infobulle interactif (tactile & clic, responsive, pédagogique et simplifié)
const CardTooltip = ({ 
  id, 
  activeTooltip, 
  setActiveTooltip, 
  title, 
  color = "indigo", 
  whatIsIt, 
  utility, 
  advice, 
  align = "right" 
}) => {
  const isOpen = activeTooltip === id;

  const colorStyles = {
    emerald: {
      btn: "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20",
      border: "border-emerald-500/30",
      title: "text-emerald-400",
      glow: "shadow-emerald-500/10",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    blue: {
      btn: "text-blue-400 hover:text-blue-300 hover:bg-blue-500/20",
      border: "border-blue-500/30",
      title: "text-blue-400",
      glow: "shadow-blue-500/10",
      badge: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    },
    indigo: {
      btn: "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20",
      border: "border-indigo-500/30",
      title: "text-indigo-400",
      glow: "shadow-indigo-500/10",
      badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
    },
    orange: {
      btn: "text-orange-400 hover:text-orange-300 hover:bg-orange-500/20",
      border: "border-orange-500/30",
      title: "text-orange-400",
      glow: "shadow-orange-500/10",
      badge: "bg-orange-500/10 text-orange-400 border-orange-500/20"
    },
    purple: {
      btn: "text-purple-400 hover:text-purple-300 hover:bg-purple-500/20",
      border: "border-purple-500/30",
      title: "text-purple-400",
      glow: "shadow-purple-500/10",
      badge: "bg-purple-500/10 text-purple-400 border-purple-500/20"
    },
    amber: {
      btn: "text-amber-400 hover:text-amber-300 hover:bg-amber-500/20",
      border: "border-amber-500/30",
      title: "text-amber-400",
      glow: "shadow-amber-500/10",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    },
    red: {
      btn: "text-red-400 hover:text-red-300 hover:bg-red-500/20",
      border: "border-red-500/30",
      title: "text-red-400",
      glow: "shadow-red-500/10",
      badge: "bg-red-500/10 text-red-400 border-red-500/20"
    }
  }[color] || {
    btn: "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20",
    border: "border-indigo-500/30",
    title: "text-indigo-400",
    glow: "shadow-indigo-500/10",
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  };

  const alignClass = align === "left" ? "left-0" : "right-0";

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActiveTooltip(isOpen ? null : id);
        }}
        className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${colorStyles.btn} ${isOpen ? 'bg-white/10 ring-2 ring-white/20' : 'bg-gray-800/40'}`}
        title="Comprendre cet indicateur et son utilité stratégique"
        aria-label="Infobulle explicative"
      >
        <Info size={15} />
      </button>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-full ${alignClass} mt-2 w-[295px] sm:w-[340px] p-4 bg-gray-900/98 backdrop-blur-xl text-xs rounded-2xl shadow-2xl ${colorStyles.glow} border ${colorStyles.border} z-50 animate-in fade-in zoom-in-95 duration-200 text-left`}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-gray-800">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className={colorStyles.title} />
              <strong className={`font-bold text-xs sm:text-sm ${colorStyles.title}`}>{title}</strong>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTooltip(null);
              }}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2 text-gray-300 leading-relaxed text-[11.5px]">
            {/* À quoi ça correspond */}
            <div className="bg-black/40 p-2 rounded-xl border border-gray-800/60">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5 flex items-center gap-1">
                <span>🎯</span> À quoi ça correspond :
              </p>
              <p className="text-gray-200">{whatIsIt}</p>
            </div>

            {/* Utilité Stratégique */}
            <div className="bg-black/40 p-2 rounded-xl border border-gray-800/60">
              <p className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider mb-0.5 flex items-center gap-1">
                <span>💡</span> Utilité & Stratégie :
              </p>
              <p className="text-gray-300">{utility}</p>
            </div>

            {/* Conseil pour piloter */}
            {advice && (
              <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-0.5 flex items-center gap-1">
                  <span>🚀</span> Conseil pour piloter :
                </p>
                <p className="text-emerald-300/90 font-medium">{advice}</p>
              </div>
            )}
          </div>

          {/* Flèche en haut vers le bouton */}
          <div className={`absolute bottom-full ${align === "left" ? "left-4" : "right-4"} border-6 border-transparent border-b-gray-900`}></div>
        </div>
      )}
    </div>
  );
};

export const YouTubePrivateStats = ({ 
  accessToken, 
  cachedStats, 
  channelId, 
  allVideos = [], 
  onStatsUpdated 
}) => {
  const [loading, setLoading] = useState(!cachedStats && !!accessToken);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(cachedStats || null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Fermeture des tooltips lors d'un clic en dehors
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveTooltip(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Synchronisation avec cachedStats si accessToken n'est pas encore présent (ex: sur smartphone)
  useEffect(() => {
    if (cachedStats && !accessToken) {
      setStats(cachedStats);
      setLoading(false);
    }
  }, [cachedStats, accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    const fetchPrivateStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const startDateLifetimeStr = '2010-01-01'; // Depuis toujours
        const base = 'https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE';

        // 1. Stats globales (depuis la création) avec métriques secrètes
        const urlLifetime = `${base}&startDate=${startDateLifetimeStr}&endDate=${today}&metrics=estimatedMinutesWatched,averageViewDuration,estimatedRevenue,views,subscribersGained,subscribersLost,shares&dimensions=channel`;
        
        // 2. Démographie (Âge)
        const urlDemographicsAge = `${base}&startDate=${startDateLifetimeStr}&endDate=${today}&metrics=viewerPercentage&dimensions=ageGroup&sort=ageGroup`;
        
        // 3. Démographie (Sexe)
        const urlDemographicsGender = `${base}&startDate=${startDateLifetimeStr}&endDate=${today}&metrics=viewerPercentage&dimensions=gender`;
        
        // 4. Géographie (Pays)
        const urlGeography = `${base}&startDate=${startDateLifetimeStr}&endDate=${today}&metrics=views&dimensions=country&sort=-views&maxResults=30`;
        
        // 5. Sources de trafic
        const urlTrafficSource = `${base}&startDate=${startDateLifetimeStr}&endDate=${today}&metrics=views&dimensions=insightTrafficSourceType&sort=-views&maxResults=10`;

        // 6. Types d'appareils (Écrans)
        const urlDeviceType = `${base}&startDate=${startDateLifetimeStr}&endDate=${today}&metrics=views,estimatedMinutesWatched&dimensions=deviceType&sort=-views`;

        // 7. Statut d'abonnement (Abonnés vs Non-Abonnés)
        const urlSubscribedStatus = `${base}&startDate=${startDateLifetimeStr}&endDate=${today}&metrics=views,estimatedMinutesWatched&dimensions=subscribedStatus`;

        // 8. Top 5 vidéos par temps de visionnage (Watch Time)
        const urlTopVideos = `${base}&startDate=${startDateLifetimeStr}&endDate=${today}&metrics=estimatedMinutesWatched,views,averageViewDuration&dimensions=video&sort=-estimatedMinutesWatched&maxResults=5`;

        const fetchWithAuth = (url) => 
          fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } });

        // Utilisation de Promise.allSettled pour une résilience maximale contre les quotas ou limitations partielles
        const settledResults = await Promise.allSettled([
          fetchWithAuth(urlLifetime),
          fetchWithAuth(urlDemographicsAge),
          fetchWithAuth(urlDemographicsGender),
          fetchWithAuth(urlGeography),
          fetchWithAuth(urlTrafficSource),
          fetchWithAuth(urlDeviceType),
          fetchWithAuth(urlSubscribedStatus),
          fetchWithAuth(urlTopVideos)
        ]);

        const parseResult = async (resPromise) => {
          if (resPromise.status !== 'fulfilled') return null;
          const res = resPromise.value;
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              console.warn("Jeton OAuth expiré ou non autorisé");
            }
            return null;
          }
          try {
            return await res.json();
          } catch (e) {
            return null;
          }
        };

        const [
          dataLifetime,
          dataAge,
          dataGender,
          dataGeo,
          dataTraffic,
          dataDevice,
          dataSubscribed,
          dataTopVideos
        ] = await Promise.all(settledResults.map(parseResult));

        // Vérification de la requête principale lifetime
        if (!dataLifetime && !stats) {
          throw new Error("Impossible de récupérer les statistiques de base. Session peut-être expirée.");
        }

        // Extraction helper
        const extractStats = (data) => {
          if (!data || !data.rows || data.rows.length === 0) return null;
          const headers = data.columnHeaders.map(h => h.name);
          const row = data.rows[0];
          return headers.reduce((acc, h, idx) => {
            acc[h] = row[idx];
            return acc;
          }, {});
        };

        const newStats = {
          lifetime: (dataLifetime ? extractStats(dataLifetime) : stats?.lifetime) || {},
          ageGroup: dataAge?.rows || stats?.ageGroup || [],
          gender: dataGender?.rows || stats?.gender || [],
          geography: (dataGeo?.rows || stats?.geography || []).filter(geo => geo[1] >= 1),
          trafficSource: dataTraffic?.rows || stats?.trafficSource || [],
          deviceType: dataDevice?.rows || stats?.deviceType || [],
          subscribedStatus: dataSubscribed?.rows || stats?.subscribedStatus || [],
          topVideos: dataTopVideos?.rows || stats?.topVideos || []
        };

        setStats(newStats);

        // Sauvegarde automatique dans Firestore pour multi-appareils et persistance infinie
        if (onStatsUpdated) {
          onStatsUpdated(newStats);
        }

      } catch (err) {
        console.error("Fetch YouTube Analytics Error:", err);
        setError(err.message || "Impossible de charger vos statistiques privées.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrivateStats();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-xl mt-4 flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
        <span className="ml-3 text-gray-400">Récupération des données confidentielles YouTube Analytics...</span>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 mt-4 flex items-start gap-3">
        <AlertCircle className="text-red-500 shrink-0" />
        <div>
          <h3 className="text-red-500 font-bold mb-1">Erreur d'accès aux données secrètes</h3>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Dictionnaires de traduction et icônes
  const trafficSourceMap = {
    'EXT_URL': 'Sites externes & Liens',
    'YT_SEARCH': 'Recherche YouTube',
    'RELATED_VIDEO': 'Vidéos suggérées',
    'SUBSCRIBER': 'Fil d\'abonnements',
    'YT_CHANNEL': 'Pages de chaînes',
    'YT_OTHER_PAGE': 'Autres pages YouTube',
    'SHORTS': 'Flux Shorts',
    'PROMOTED': 'Publicité YouTube',
    'NOTIFICATION': 'Notifications',
    'PLAYLIST': 'Playlists',
    'NO_LINK_OTHER': 'Autres (sans lien direct)',
    'ANNOTATION': 'Annotations',
    'CARD': 'Fiches interactives',
    'END_SCREEN': 'Écrans de fin',
    'HASHTAGS': 'Pages de hashtags',
    'SOUND_PAGES': 'Pages de sons'
  };

  const deviceMap = {
    'MOBILE': { label: 'Smartphones & Mobiles', icon: Smartphone, color: 'bg-blue-500' },
    'DESKTOP': { label: 'Ordinateurs (PC / Mac)', icon: Monitor, color: 'bg-indigo-500' },
    'TABLET': { label: 'Tablettes', icon: Tablet, color: 'bg-amber-500' },
    'TV': { label: 'Téléviseurs connectés / TV', icon: Tv, color: 'bg-emerald-500' },
    'GAME_CONSOLE': { label: 'Consoles de jeux', icon: Laptop, color: 'bg-purple-500' },
    'UNKNOWN': { label: 'Autres appareils', icon: HelpCircle, color: 'bg-gray-500' }
  };

  const getCountryName = (countryCode) => {
    try {
      const displayNames = new Intl.DisplayNames(['fr'], { type: 'region' });
      return displayNames.of(countryCode) || countryCode;
    } catch (e) {
      return countryCode; 
    }
  };

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds)) return '0:00';
    const totalSecs = Math.round(totalSeconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Calculs dérivés pour les abonnés et métriques
  const gained = stats.lifetime?.subscribersGained || 0;
  const lost = stats.lifetime?.subscribersLost || 0;
  const netSubscribers = gained - lost;
  const retentionRatio = gained > 0 ? Math.max(0, Math.round(((gained - lost) / gained) * 100)) : 100;

  // Calcul répartition abonnés vs non-abonnés
  const subRows = stats.subscribedStatus || [];
  const subTotalViews = subRows.reduce((acc, row) => acc + (row[1] || 0), 0);
  const subViews = subRows.find(r => r[0] === 'SUBSCRIBED')?.[1] || 0;
  const unsubViews = subRows.find(r => r[0] === 'UNSUBSCRIBED')?.[1] || 0;
  const subPercent = subTotalViews > 0 ? Math.round((subViews / subTotalViews) * 100) : 0;
  const unsubPercent = subTotalViews > 0 ? 100 - subPercent : 0;

  // Calcul répartition appareils
  const devRows = stats.deviceType || [];
  const devTotalViews = devRows.reduce((acc, row) => acc + (row[1] || 0), 0);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-[#161622] to-[#12121C] rounded-3xl p-6 lg:p-8 border border-gray-800 shadow-2xl mt-4 relative overflow-visible">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full"></div>

      <div className="relative z-10">
        
        {/* EN-TÊTE DE LA SECTION SECRÈTE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <ShieldCheck size={20} />
              </span>
              <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                Données Secrètes & Privées
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  YouTube Analytics API
                </span>
              </h2>
            </div>
            <p className="text-gray-400 text-sm">
              Ces métriques confidentielles sont réservées exclusivement au propriétaire de la chaîne (données privées d'engagement, rétention, flux d'abonnés et partages).
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-gray-800 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-gray-300 font-medium">Synchronisé Multi-Écrans</span>
          </div>
        </div>

        {/* --- GRILLE DES 6 KPIS SECRETS PRINCIPAUX --- */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="text-indigo-400" size={18} />
            KPIs Confidentiels Globaux (Depuis la création)
          </h3>
          <span className="text-[11px] text-gray-500 hidden sm:inline">
            Cliquez sur les icônes <Info size={12} className="inline text-gray-400" /> pour voir les explications et conseils stratégiques
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          
          {/* 1. REVENUS TOTAUX */}
          <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-5 relative overflow-visible group hover:border-emerald-500/40 transition-all">
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <DollarSign size={64} className="text-emerald-400" />
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <DollarSign size={18} />
                </div>
                <span className="text-gray-300 font-medium text-xs">Revenus Estimés Totaux</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  100% Privé
                </span>
                <CardTooltip 
                  id="revenue"
                  activeTooltip={activeTooltip}
                  setActiveTooltip={setActiveTooltip}
                  title="Revenus Estimés Totaux"
                  color="emerald"
                  whatIsIt="L'argent réel généré par votre chaîne via les annonces publicitaires et les vues des membres YouTube Premium."
                  utility="Mesure la rentabilité directe de votre chaîne. Pour débloquer la monétisation AdSense, YouTube exige 1 000 abonnés et 4 000 heures de visionnage (ou 10 millions de vues Shorts)."
                  advice="Tant que la monétisation officielle n'est pas activée, servez-vous de vos vidéos pour vendre vos propres prestations, du coaching ou des partenariats avec des marques."
                />
              </div>
            </div>
            <p className="text-3xl font-display-kpi font-bold text-white tracking-tight relative z-10 mb-1">
              {stats.lifetime?.estimatedRevenue ? `$${stats.lifetime.estimatedRevenue.toFixed(2)}` : '0.00$'}
            </p>
            <p className="text-[11px] text-gray-500 relative z-10">
              Gains bruts estimés (AdSense, annonces & abonnements YouTube Premium).
            </p>
          </div>

          {/* 2. VUES TOTALES RÉELLES (PRIVÉES INCLUSES) */}
          <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 relative overflow-visible group hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                  <Eye size={18} />
                </div>
                <span className="text-gray-300 font-medium text-xs">Vues Totales Réelles</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-blue-400/90">Audience</span>
                <CardTooltip 
                  id="views"
                  activeTooltip={activeTooltip}
                  setActiveTooltip={setActiveTooltip}
                  title="Vues Totales Réelles"
                  color="blue"
                  whatIsIt="Le nombre total absolu de lancements de vos vidéos depuis la création, y compris vos vidéos non répertoriées ou archivées."
                  utility="Représente votre portée globale cumulée. Elle vous permet de calculer votre ratio de transformation spectateur ➔ abonné."
                  advice="Si vos vues grimpent mais que vos abonnés stagnent, intégrez un appel simple à vous abonner dans les premières minutes de vos vidéos."
                />
              </div>
            </div>
            <p className="text-3xl font-display-kpi font-bold text-white tracking-tight mb-1">
              {(stats.lifetime?.views || 0).toLocaleString('fr-FR')}
            </p>
            <p className="text-[11px] text-gray-500">
              Toutes les vues enregistrées par l'algorithme YouTube.
            </p>
          </div>

          {/* 3. HEURES DE VISIONNAGE CUMULÉES */}
          <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 relative overflow-visible group hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-500/20 rounded-xl text-orange-400">
                  <Clock size={18} />
                </div>
                <span className="text-gray-300 font-medium text-xs">Watch Time Cumulé</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-orange-400/90">Temps</span>
                <CardTooltip 
                  id="watchtime"
                  activeTooltip={activeTooltip}
                  setActiveTooltip={setActiveTooltip}
                  title="Watch Time Cumulé"
                  color="orange"
                  whatIsIt="Le total cumulé d'heures et de minutes que les internautes ont passé les yeux rivés sur vos vidéos."
                  utility="C'est la métrique reine que l'algorithme YouTube adore : plus vous gardez les gens sur la plateforme, plus YouTube recommande vos vidéos à de nouveaux spectateurs."
                  advice="Les vidéos longues (10 à 20 min) et les Lives YouTube sont les meilleurs leviers pour gonfler rapidement ce compteur d'heures."
                />
              </div>
            </div>
            <p className="text-3xl font-display-kpi font-bold text-white tracking-tight mb-1">
              {Math.floor((stats.lifetime?.estimatedMinutesWatched || 0) / 60).toLocaleString('fr-FR')}h {Math.round((stats.lifetime?.estimatedMinutesWatched || 0) % 60)}m
            </p>
            <p className="text-[11px] text-gray-500">
              Volume total de temps que le public a passé sur vos contenus.
            </p>
          </div>

          {/* 4. RÉTENTION MOYENNE PAR VUE (MÉTRIQUE CLÉ ALGO) */}
          <div className="bg-black/40 border border-indigo-500/20 rounded-2xl p-5 relative overflow-visible group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                  <TrendingUp size={18} />
                </div>
                <span className="text-gray-300 font-medium text-xs">Rétention Moyenne par Vue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Clé Algorithme
                </span>
                <CardTooltip 
                  id="retention"
                  activeTooltip={activeTooltip}
                  setActiveTooltip={setActiveTooltip}
                  title="Rétention Moyenne par Vue"
                  color="indigo"
                  whatIsIt="Le temps moyen passé par un spectateur sur une vidéo avant de quitter ou de changer de page."
                  utility="C'est l'indicateur le plus décisif : une vidéo avec une forte rétention sera 10x plus recommandée qu'une vidéo où les gens partent après 20 secondes."
                  advice="Soignez les 15 premières secondes ! Supprimez les génériques longs, entrez directement dans le vif du sujet et annoncez le résultat promis."
                />
              </div>
            </div>
            <p className="text-3xl font-display-kpi font-bold text-white tracking-tight mb-1">
              {formatDuration(stats.lifetime?.averageViewDuration)}
            </p>
            <p className="text-[11px] text-gray-500">
              Durée moyenne de capture d'attention par spectateur.
            </p>
          </div>

          {/* 5. PARTAGES SECRETS */}
          <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-5 relative overflow-visible group hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                  <Share2 size={18} />
                </div>
                <span className="text-gray-300 font-medium text-xs">Partages Secrets</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Bouche-à-oreille
                </span>
                <CardTooltip 
                  id="shares"
                  activeTooltip={activeTooltip}
                  setActiveTooltip={setActiveTooltip}
                  title="Partages Secrets (Bouche-à-oreille)"
                  color="purple"
                  whatIsIt="Le nombre de fois où vos spectateurs ont cliqué sur 'Partager' (vers WhatsApp, SMS, X, Instagram, Discord ou lien copié)."
                  utility="Ce chiffre est 100% secret et inaccessible au public. Un partage prouve que votre contenu a créé une forte émotion ou apporté une valeur tellement utile que les gens veulent en faire profiter un ami."
                  advice="Repérez les vidéos les plus partagées : ce sont vos meilleurs sujets viraux. Créez des suites ou des vidéos similaires sur ces thèmes."
                />
              </div>
            </div>
            <p className="text-3xl font-display-kpi font-bold text-white tracking-tight mb-1">
              {(stats.lifetime?.shares || 0).toLocaleString('fr-FR')}
            </p>
            <p className="text-[11px] text-gray-500">
              Nombre de recommandations directes de vos vidéos par vos spectateurs.
            </p>
          </div>

          {/* 6. FLUX D'ABONNÉS (GAGNÉS VS PERDUS) */}
          <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 relative overflow-visible group hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <Users size={18} />
                </div>
                <span className="text-gray-300 font-medium text-xs">Fidélisation Abonnés</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-emerald-400/90">{retentionRatio}% fidélité</span>
                <CardTooltip 
                  id="subscribers"
                  activeTooltip={activeTooltip}
                  setActiveTooltip={setActiveTooltip}
                  title="Fidélisation & Flux d'Abonnés"
                  color="emerald"
                  whatIsIt="Le relevé secret des nouveaux abonnements gagnés face aux désabonnements subis, avec le solde net restant."
                  utility="Révèle la santé de votre communauté : un taux de fidélité supérieur à 80% montre que les spectateurs qui s'abonnent restent fidèles et aiment votre évolution."
                  advice="Ne paniquez pas lors de désabonnements : c'est un nettoyage naturel d'audience. Restez régulier sur votre thématique pour rassurer vos fidèles."
                />
              </div>
            </div>
            <div className="flex items-baseline gap-3 mb-1">
              <p className="text-3xl font-display-kpi font-bold text-white tracking-tight">
                {netSubscribers >= 0 ? `+${netSubscribers.toLocaleString('fr-FR')}` : netSubscribers.toLocaleString('fr-FR')}
              </p>
              <span className="text-xs text-gray-400 font-medium">solde net</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] mt-2 pt-2 border-t border-gray-800/80">
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <UserPlus size={11} /> +{(gained).toLocaleString('fr-FR')} gagnés
              </span>
              <span className="text-red-400 flex items-center gap-1 font-medium">
                <UserMinus size={11} /> -{(lost).toLocaleString('fr-FR')} perdus
              </span>
            </div>
          </div>

        </div>

        {/* --- SECTION DÉMOGRAPHIE & FIDÉLISATION AUDIENCE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* COLONNE GAUCHE : DÉMOGRAPHIE (SEXE & ÂGE) */}
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="text-purple-400" size={18} />
              Démographie de l'Audience
            </h3>
            
            {/* RÉPARTITION PAR SEXE */}
            <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 relative overflow-visible">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Répartition par Sexe</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">Depuis l'origine</span>
                  <CardTooltip 
                    id="gender"
                    activeTooltip={activeTooltip}
                    setActiveTooltip={setActiveTooltip}
                    title="Répartition Hommes / Femmes"
                    color="blue"
                    whatIsIt="La proportion d'hommes et de femmes parmi les spectateurs connectés à un compte Google."
                    utility="Vous aide à comprendre qui s'identifie à vos contenus et à ajuster votre communication, vos visuels et vos références."
                    advice="Adaptez le vocabulaire et les exemples à votre public dominant tout en conservant une approche inclusive si vous cherchez à élargir votre cible."
                  />
                </div>
              </div>
              {stats.gender && stats.gender.length > 0 ? (
                <div className="space-y-3">
                  {stats.gender.map((g, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-white font-medium">{g[0] === 'male' ? 'Hommes' : g[0] === 'female' ? 'Femmes' : 'Autres'}</span>
                        <span className="text-gray-300 font-bold">{g[1].toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-800/80 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${g[0] === 'male' ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : 'bg-gradient-to-r from-pink-600 to-rose-400'}`} 
                          style={{ width: `${Math.min(100, Math.max(2, g[1]))}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 py-3 px-4 bg-gray-800/20 rounded-xl border border-gray-800/60 leading-relaxed">
                  <p className="font-semibold text-gray-300 mb-0.5">Seuil de confidentialité YouTube</p>
                  <p className="text-[11px] text-gray-500">YouTube exige un quota minimum de visionnage par chaîne pour dévoiler publiquement la part de genre afin de préserver l'anonymat des spectateurs.</p>
                </div>
              )}
            </div>

            {/* TRANCHES D'ÂGE */}
            <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 relative overflow-visible">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tranches d'Âge</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">Depuis l'origine</span>
                  <CardTooltip 
                    id="age"
                    activeTooltip={activeTooltip}
                    setActiveTooltip={setActiveTooltip}
                    title="Tranches d'Âge de l'Audience"
                    color="purple"
                    whatIsIt="La pyramide des âges de vos spectateurs (18-24 ans, 25-34 ans, 35-44 ans...)."
                    utility="Détermine le pouvoir d'achat et le stade de vie de vos abonnés. Une audience 25-34 ans est active, professionnelle et prête à investir dans des solutions pour accélérer ses projets."
                    advice="Si vos spectateurs ont 25-34 ans, privilégiez des sujets concrets orientés résultats, outils professionnels, productivité et revenus."
                  />
                </div>
              </div>
              {stats.ageGroup && stats.ageGroup.length > 0 ? (
                <div className="space-y-3">
                  {stats.ageGroup.map((a, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-white font-medium">{a[0].replace('age', '')} ans</span>
                        <span className="text-purple-300 font-bold">{a[1].toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-800/80 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-400 transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(2, a[1]))}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 py-3 px-4 bg-gray-800/20 rounded-xl border border-gray-800/60 leading-relaxed">
                  <p className="font-semibold text-gray-300 mb-0.5">Seuil de confidentialité YouTube</p>
                  <p className="text-[11px] text-gray-500">Données protégées par YouTube jusqu'à l'atteinte du seuil statistique garantissant l'anonymat de l'audience.</p>
                </div>
              )}
            </div>

            {/* ABONNÉS VS NON-ABONNÉS */}
            <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 relative overflow-visible">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  Abonnés vs Nouveaux Spectateurs
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">Statut d'abonnement</span>
                  <CardTooltip 
                    id="audience"
                    activeTooltip={activeTooltip}
                    setActiveTooltip={setActiveTooltip}
                    title="Fidèles vs Nouveaux Spectateurs"
                    color="indigo"
                    whatIsIt="La part de vos vues provenant de vos abonnés actuels comparée à celle des personnes qui ne sont pas encore abonnées."
                    utility="Si le pourcentage de non-abonnés est très fort (>80%), c'est une excellente nouvelle : votre chaîne n'est pas en circuit fermé, l'algorithme vous fait découvrir à de nouvelles personnes en continu !"
                    advice="Pensez que la majorité de vos spectateurs ne vous connaissent pas encore : présentez-vous brièvement et donnez-leur une raison forte de s'abonner."
                  />
                </div>
              </div>

              {subTotalViews > 0 ? (
                <div className="space-y-4">
                  <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-800">
                    <div 
                      className="bg-emerald-500 transition-all" 
                      style={{ width: `${subPercent}%` }}
                      title={`Abonnés: ${subPercent}%`}
                    ></div>
                    <div 
                      className="bg-indigo-500 transition-all" 
                      style={{ width: `${unsubPercent}%` }}
                      title={`Non-abonnés: ${unsubPercent}%`}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-xs text-gray-300 font-medium">Abonnés fidèles</span>
                      </div>
                      <p className="text-lg font-bold text-white">{subPercent}%</p>
                      <p className="text-[10px] text-gray-500">{(subViews).toLocaleString('fr-FR')} vues</p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                        <span className="text-xs text-gray-300 font-medium">Non-abonnés (Découverte)</span>
                      </div>
                      <p className="text-lg font-bold text-white">{unsubPercent}%</p>
                      <p className="text-[10px] text-gray-500">{(unsubViews).toLocaleString('fr-FR')} vues</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-3 bg-gray-800/20 rounded-xl">
                  Données de statut d'abonnement en cours d'indexation par l'API.
                </p>
              )}
            </div>

          </div>

          {/* COLONNE DROITE : APPAREILS, SOURCES DE TRAFIC & GÉOGRAPHIE */}
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Smartphone className="text-blue-400" size={18} />
              Supports de Visionnage & Acquisition
            </h3>

            {/* TYPES D'APPAREILS */}
            <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 relative overflow-visible">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Types d'Écrans (Appareils)</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">Vues par matériel</span>
                  <CardTooltip 
                    id="devices"
                    activeTooltip={activeTooltip}
                    setActiveTooltip={setActiveTooltip}
                    title="Types d'Écrans & Appareils"
                    color="blue"
                    whatIsIt="La proportion des vues réalisées sur smartphones, ordinateurs de bureau, téléviseurs de salon ou tablettes."
                    utility="Permet d'adapter le format visuel. Si plus de la moitié des vues est sur mobile, tout doit être pensé pour un petit écran (texte de miniature gros et lisible)."
                    advice="Vérifiez vos miniatures en tout petit format avant de les publier : si le texte n'est pas lisible en 1 clin d'œil sur un téléphone, agrandissez-le !"
                  />
                </div>
              </div>

              {devRows && devRows.length > 0 ? (
                <div className="space-y-3">
                  {devRows.map((dev, i) => {
                    const devInfo = deviceMap[dev[0]] || deviceMap['UNKNOWN'];
                    const DevIcon = devInfo.icon;
                    const views = dev[1] || 0;
                    const pct = devTotalViews > 0 ? ((views / devTotalViews) * 100).toFixed(1) : 0;
                    const minutes = dev[2] || 0;

                    return (
                      <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-gray-900/40 border border-gray-800/60">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gray-800 text-gray-300`}>
                            <DevIcon size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{devInfo.label}</p>
                            <p className="text-[10px] text-gray-400">{Math.floor(minutes / 60)}h de visionnage</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold text-white">{pct}%</p>
                          <p className="text-[10px] text-gray-400">{(views).toLocaleString('fr-FR')} vues</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-3 bg-gray-800/20 rounded-xl">
                  Répartition des appareils en cours de traitement par YouTube Analytics.
                </p>
              )}
            </div>

            {/* SOURCES DE TRAFIC */}
            <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 relative overflow-visible">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  Sources de Trafic Principales
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">Acquisition</span>
                  <CardTooltip 
                    id="traffic"
                    activeTooltip={activeTooltip}
                    setActiveTooltip={setActiveTooltip}
                    title="Sources de Trafic (Acquisition)"
                    color="indigo"
                    whatIsIt="Le canal par lequel les spectateurs découvrent vos vidéos : fil d'abonnements, flux de swipe Shorts, recherche YouTube, suggestions..."
                    utility="Identifie ce qui fait tourner votre chaîne. La recherche YouTube apporte des vues passives pendant des années. Le flux Shorts apporte des poussées fulgurantes d'abonnés."
                    advice="Optimisez vos titres avec les questions que les gens tapent dans la recherche (ex: 'Comment créer...', 'Tutoriel complet...', 'Mon avis sur...')."
                  />
                </div>
              </div>
              
              {stats.trafficSource && stats.trafficSource.length > 0 ? (
                <div className="space-y-2.5">
                  {stats.trafficSource.slice(0, 6).map((traffic, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-800/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <Filter size={13} className="text-gray-500 shrink-0" />
                        <span className="text-white text-xs font-medium">{trafficSourceMap[traffic[0]] || traffic[0]}</span>
                      </div>
                      <span className="text-gray-400 text-xs font-semibold bg-gray-800 px-2 py-0.5 rounded-md">
                        {traffic[1].toLocaleString('fr-FR')} vues
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-3 bg-gray-800/20 rounded-xl">Pas de sources identifiées.</p>
              )}
            </div>

            {/* PAYS DE L'AUDIENCE */}
            <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 relative overflow-visible">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-red-400" />
                  Top Pays de l'Audience
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">Géographie</span>
                  <CardTooltip 
                    id="geography"
                    activeTooltip={activeTooltip}
                    setActiveTooltip={setActiveTooltip}
                    title="Top Pays de l'Audience"
                    color="red"
                    whatIsIt="La localisation géographique réelle de vos spectateurs à travers le monde."
                    utility="Crucial pour choisir la meilleure heure de publication (décalage horaire) et adapter la monnaie de vos offres commerciales."
                    advice="Pour une audience en France et Europe de l'Ouest, les créneaux idéaux de publication sont entre 18h00 et 20h00 en semaine et le dimanche vers 12h00."
                  />
                </div>
              </div>
              {stats.geography && stats.geography.length > 0 ? (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                  {stats.geography.slice(0, 10).map((geo, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-1 border-b border-gray-800/40 last:border-none">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-gray-600 w-4">{i + 1}.</span>
                        <span className="text-white text-xs font-medium">{getCountryName(geo[0])}</span>
                      </div>
                      <span className="text-gray-400 text-xs font-semibold bg-gray-800/60 px-2 py-0.5 rounded-md">
                        {geo[1].toLocaleString('fr-FR')} vues
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-3 bg-gray-800/20 rounded-xl">Pas assez de vues géographiques enregistrées.</p>
              )}
            </div>

          </div>

        </div>

        {/* --- SECTION SECRÈTE : TOP 5 CHAMPIONS DU TEMPS DE VISIONNAGE --- */}
        {stats.topVideos && stats.topVideos.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-800/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="text-amber-400" size={18} />
                <h3 className="text-base font-bold text-white">
                  Top 5 Champions de Rétention & Watch Time (API YouTube Analytics)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 hidden sm:inline">
                  Classées par volume total d'attention captée
                </span>
                <CardTooltip 
                  id="topVideos"
                  activeTooltip={activeTooltip}
                  setActiveTooltip={setActiveTooltip}
                  title="Champions de Rétention & Watch Time"
                  color="amber"
                  whatIsIt="Les 5 vidéos qui ont réussi le tour de force de capter le plus gros volume d'heures d'attention et de retenir le public le plus longtemps."
                  utility="Ce sont vos piliers de croissance ! Ces vidéos prouvent mathématiquement ce qui passionne votre communauté et ce qui convertit le mieux."
                  advice="Analysez la formule de ces 5 vidéos (sujet, rythme, durée, titre). Faites-en des 'Partie 2' ou traitez des sujets similaires : le succès y sera quasi garanti !"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {stats.topVideos.map((vRow, idx) => {
                const videoId = vRow[0];
                const minutesWatched = vRow[1] || 0;
                const viewsCount = vRow[2] || 0;
                const avgViewDuration = vRow[3] || 0;
                const videoInfo = allVideos.find(v => v.id === videoId);

                const title = videoInfo?.title || `Vidéo ${videoId}`;
                const thumbnail = videoInfo?.thumbnailUrl || '';
                const format = videoInfo?.type || 'Vidéo';

                return (
                  <div key={idx} className="bg-black/50 border border-gray-800 hover:border-amber-500/30 rounded-2xl p-3 flex flex-col justify-between transition-all group">
                    <div>
                      {thumbnail ? (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-2.5 bg-gray-800">
                          <img 
                            src={thumbnail} 
                            alt={title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-black/80 text-amber-400 border border-amber-500/30">
                            #{idx + 1}
                          </span>
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-black/80 text-white">
                            {format}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full aspect-video rounded-xl bg-gray-800 flex items-center justify-center mb-2.5 text-gray-600">
                          <PlayCircle size={28} />
                        </div>
                      )}

                      <h4 className="text-xs font-semibold text-white line-clamp-2 mb-2 group-hover:text-amber-300 transition-colors" title={title}>
                        {title}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-gray-800/80 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-400">Temps passé :</span>
                        <span className="text-amber-400 font-bold">{Math.floor(minutesWatched / 60)}h {Math.round(minutesWatched % 60)}m</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-400">Vues réelles :</span>
                        <span className="text-white font-medium">{(viewsCount).toLocaleString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-400">Rétention moy. :</span>
                        <span className="text-indigo-300 font-medium">{formatDuration(avgViewDuration)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
