import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, Users, Loader2, AlertCircle, MapPin, Activity, PieChart, TrendingUp, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from 'recharts';

export const YouTubePrivateStats = ({ accessToken, channelId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!accessToken) return;

    const fetchPrivateStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const startDateLifetimeStr = '2010-01-01'; // Depuis toujours
        
        const d28 = new Date();
        d28.setDate(d28.getDate() - 28);
        const startDate28Str = d28.toISOString().split('T')[0];

        const base = 'https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE';

        // 1. Stats globales (depuis la création)
        const urlLifetime = `${base}&startDate=${startDateLifetimeStr}&endDate=${today}&metrics=estimatedMinutesWatched,averageViewDuration,estimatedRevenue,views,subscribersGained&dimensions=channel`;
        
        // 3. Démographie (Âge) - Remplacé par Lifetime pour contourner le seuil de confidentialité
        const urlDemographicsAge = `${base}&startDate=${startDateLifetimeStr}&endDate=${today}&metrics=viewerPercentage&dimensions=ageGroup&sort=ageGroup`;
        
        // 4. Démographie (Sexe) - Remplacé par Lifetime
        const urlDemographicsGender = `${base}&startDate=${startDateLifetimeStr}&endDate=${today}&metrics=viewerPercentage&dimensions=gender`;
        
        // 5. Géographie (Tous les pays, Lifetime)
        const urlGeography = `${base}&startDate=${startDateLifetimeStr}&endDate=${today}&metrics=views&dimensions=country&sort=-views&maxResults=50`;
        
        // 6. Sources de trafic (Top 5, Lifetime)
        const urlTrafficSource = `${base}&startDate=${startDateLifetimeStr}&endDate=${today}&metrics=views&dimensions=insightTrafficSourceType&sort=-views&maxResults=5`;

        const fetchWithAuth = (url) => fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } });

        const [resLifetime, resAge, resGender, resGeo, resTraffic] = await Promise.all([
          fetchWithAuth(urlLifetime),
          fetchWithAuth(urlDemographicsAge),
          fetchWithAuth(urlDemographicsGender),
          fetchWithAuth(urlGeography),
          fetchWithAuth(urlTrafficSource)
        ]);

        if (!resLifetime.ok) {
          if (resLifetime.status === 401 || resLifetime.status === 403) throw new Error("Accès refusé ou session expirée. Veuillez vous reconnecter.");
          throw new Error("Erreur de l'API YouTube Analytics");
        }

        const dataLifetime = await resLifetime.json();
        const dataAge = await resAge.json();
        const dataGender = await resGender.json();
        const dataGeo = await resGeo.json();
        const dataTraffic = await resTraffic.json();

        // extract lifetime
        const extractStats = (data) => {
          if (!data.rows || data.rows.length === 0) return null;
          const headers = data.columnHeaders.map(h => h.name);
          const row = data.rows[0];
          return headers.reduce((acc, h, idx) => {
            acc[h] = row[idx];
            return acc;
          }, {});
        };

        setStats({
          lifetime: extractStats(dataLifetime) || {},
          ageGroup: dataAge.rows || [],
          gender: dataGender.rows || [],
          geography: (dataGeo.rows || []).filter(geo => geo[1] >= 1), // Filtre strict: au moins 1 vue
          trafficSource: dataTraffic.rows || []
        });

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
        <span className="ml-3 text-gray-400">Récupération des données démographiques et historiques...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 mt-4 flex items-start gap-3">
        <AlertCircle className="text-red-500 shrink-0" />
        <div>
          <h3 className="text-red-500 font-bold mb-1">Erreur d'autorisation</h3>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const trafficSourceMap = {
    'EXT_URL': 'Sites externes',
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
    'CARD': 'Fiches',
    'END_SCREEN': 'Écrans de fin',
    'HASHTAGS': 'Pages de hashtags',
    'SOUND_PAGES': 'Pages de son',
    'CAMPAIGN_CARD': 'Fiches de campagne'
  };

  const getCountryName = (countryCode) => {
    try {
      const displayNames = new Intl.DisplayNames(['fr'], { type: 'region' });
      return displayNames.of(countryCode);
    } catch (e) {
      return countryCode; 
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-xl">
          <p className="text-white font-bold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-gray-300">{entry.name}:</span>
              <span className="text-white font-bold">
                {entry.value.toLocaleString('fr-FR')}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-900 rounded-3xl p-6 lg:p-8 border border-gray-800 shadow-xl mt-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-2xl bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full"></div>

      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <DollarSign className="text-green-400" /> Vos Données Confidentielles
        </h2>
        <p className="text-gray-400 mb-8 text-sm">Ces métriques sont privées et accessibles uniquement parce que vous êtes connecté avec votre compte Google.</p>

        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="text-indigo-400" size={20} />
          Statistiques Globales (Depuis la création de la chaîne Ytb)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          <div className="bg-black/40 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <DollarSign size={64} className="text-indigo-400" />
            </div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2 bg-indigo-500/20 rounded-xl">
                <DollarSign size={20} className="text-indigo-400" />
              </div>
              <h3 className="text-indigo-300 font-medium text-sm">Revenus Totaux</h3>
            </div>
            <p className="text-4xl font-display-kpi font-bold text-white tracking-tight relative z-10">
              {stats.lifetime?.estimatedRevenue ? `$${stats.lifetime.estimatedRevenue.toFixed(2)}` : '0.00$'}
            </p>
          </div>

          <div className="bg-black/40 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Users size={20} className="text-blue-400" />
              </div>
              <h3 className="text-gray-400 font-medium text-sm flex items-center gap-2">
                Vues Totales
                <div className="group relative">
                  <AlertCircle size={14} className="text-gray-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-gray-800 text-xs text-gray-300 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-xl border border-gray-700">
                    <strong>Pourquoi ce chiffre diffère des vues globales ?</strong> Ce nombre compte absolument toutes les vues de votre chaîne, y compris les vidéos privées, non répertoriées, ou supprimées.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </h3>
            </div>
            <p className="text-4xl font-display-kpi font-bold text-white tracking-tight">
              {(stats.lifetime?.views || 0).toLocaleString('fr-FR')}
            </p>
          </div>

          <div className="bg-black/40 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500/20 rounded-xl">
                <Clock size={20} className="text-orange-400" />
              </div>
              <h3 className="text-gray-400 font-medium text-sm flex items-center gap-2">
                Heures de visionnage
                <div className="group relative">
                  <AlertCircle size={14} className="text-gray-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-xs text-gray-300 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-xl border border-gray-700">
                    Le cumul total de temps que les spectateurs ont passé à regarder vos vidéos.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </h3>
            </div>
            <p className="text-4xl font-display-kpi font-bold text-white tracking-tight">
              {Math.floor((stats.lifetime?.estimatedMinutesWatched || 0) / 60).toLocaleString('fr-FR')}h
            </p>
          </div>
        </div>

        {/* --- DEMOGRAPHICS & GEOGRAPHY --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* DEMOGRAPHICS */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PieChart className="text-purple-400" size={20} />
              Démographie de l'audience (Depuis la création)
            </h3>
            
            <div className="bg-black/40 border border-gray-800 rounded-2xl p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-4">Répartition par Sexe</h4>
              {stats.gender && stats.gender.length > 0 ? (
                <div className="space-y-3">
                  {stats.gender.map((g, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white">{g[0] === 'male' ? 'Hommes' : g[0] === 'female' ? 'Femmes' : 'Autres'}</span>
                        <span className="text-gray-400">{g[1].toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div className={`h-2 rounded-full ${g[0] === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`} style={{ width: `${g[1]}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4 bg-gray-800/20 rounded-xl">
                  <p className="font-semibold text-gray-400 mb-1">Données protégées par YouTube</p>
                  <p className="text-xs">Votre chaîne n'a pas atteint le quota de vues exigé par YouTube pour dévoiler le sexe de l'audience. C'est une sécurité pour empêcher d'identifier vos spectateurs.</p>
                </div>
              )}
            </div>

            <div className="bg-black/40 border border-gray-800 rounded-2xl p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-4">Tranches d'âge principales</h4>
              {stats.ageGroup && stats.ageGroup.length > 0 ? (
                <div className="space-y-3">
                  {stats.ageGroup.map((a, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white">{a[0].replace('age', '')} ans</span>
                        <span className="text-gray-400">{a[1].toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div className="h-2 rounded-full bg-purple-500" style={{ width: `${a[1]}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4 bg-gray-800/20 rounded-xl">
                  <p className="font-semibold text-gray-400 mb-1">Données protégées par YouTube</p>
                  <p className="text-xs">Votre chaîne n'a pas atteint le quota de vues exigé par YouTube pour dévoiler l'âge de l'audience. C'est une sécurité pour empêcher d'identifier vos spectateurs.</p>
                </div>
              )}
            </div>
          </div>

          {/* GEOGRAPHY & TRAFFIC */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="text-red-400" size={20} />
              Acquisition (Depuis la création)
            </h3>
            
            <div className="bg-black/40 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-400">Pays de l'audience</h4>
              </div>
              {stats.geography && stats.geography.length > 0 ? (
                <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                  {stats.geography.map((geo, i) => (
                    <div key={i} className="flex flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-600 shrink-0">#{i + 1}</span>
                        <span className="text-white font-medium whitespace-normal">{getCountryName(geo[0])}</span>
                      </div>
                      <span className="text-gray-400 text-sm shrink-0 bg-gray-800 px-2 py-1 rounded-md">{geo[1].toLocaleString('fr-FR')} vues</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-800/20 rounded-xl">Pas assez de vues enregistrées.</p>
              )}
            </div>

            <div className="bg-black/40 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-400">Sources de trafic</h4>
                  <div className="group relative">
                    <AlertCircle size={14} className="text-gray-500 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] sm:w-[320px] p-3 bg-gray-800 text-[11px] text-gray-300 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-xl border border-gray-700 leading-tight">
                      <strong className="block mb-2 text-white">Vos principaux canaux :</strong>
                      <ul className="space-y-1.5 list-disc pl-4">
                        <li><span className="text-indigo-300">Flux Shorts :</span> Vues générées lorsqu'un utilisateur swipe sur vos vidéos dans l'interface Shorts.</li>
                        <li><span className="text-indigo-300">Fil d'abonnements :</span> Vos propres abonnés qui cliquent sur votre vidéo depuis leur flux d'abonnements.</li>
                        <li><span className="text-indigo-300">Pages de chaînes :</span> Visites directes depuis le profil de votre propre chaîne YouTube.</li>
                        <li><span className="text-indigo-300">Recherche YouTube :</span> L'utilisateur a tapé un mot-clé dans la barre de recherche YouTube et a trouvé votre vidéo.</li>
                        <li><span className="text-indigo-300">Autres pages YouTube :</span> Trafic interne provenant de pages YouTube qui n'entrent pas dans les catégories habituelles.</li>
                      </ul>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {stats.trafficSource && stats.trafficSource.length > 0 ? (
                <div className="space-y-4">
                  {stats.trafficSource.map((traffic, i) => (
                    <div key={i} className="flex flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-500 shrink-0 mt-0.5 sm:mt-0" />
                        <span className="text-white text-sm font-medium whitespace-normal leading-tight">{trafficSourceMap[traffic[0]] || traffic[0]}</span>
                      </div>
                      <span className="text-gray-400 text-sm shrink-0 bg-gray-800 px-2 py-1 rounded-md">{traffic[1].toLocaleString('fr-FR')} vues</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-800/20 rounded-xl">Pas de sources de trafic identifiées.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

