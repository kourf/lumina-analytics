import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, MessageCircle, Heart, Info, TrendingUp, Zap, Share2, Globe, Users } from 'lucide-react';

export const TikTokVideoAnalytics = ({ videoAnalytics, recentVideos = [], followers = 0 }) => {
  if (!recentVideos || recentVideos.length === 0 || followers === null || followers === 0) {
    return (
      <div className="w-full relative z-[60] bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 mt-4">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-red-500" />
          Analyse Stratégique : Données Insuffisantes
        </h3>
        <p className="text-sm opacity-90 mb-4">
          Impossible de calculer les taux stratégiques (Engagement, Reach, Conversion). Le catalogue de vidéos est vide ou le nombre d'abonnés est introuvable.
        </p>
        <div className="bg-black/40 p-4 rounded-xl font-mono text-xs border border-red-500/10 overflow-x-auto">
          <code>
            // Technical Error Context (copy to developer):<br/>
            - Videos Count: {recentVideos?.length || 0}<br/>
            - Followers Reference: {followers === null ? 'NULL (Error)' : followers}<br/>
            - Required: followers &gt; 0 AND recentVideos.length &gt; 0
          </code>
        </div>
      </div>
    );
  }

  // Calcul Taux d'Engagement
  const totalViews = recentVideos.reduce((acc, v) => acc + (v.views || 0), 0);
  const totalEngagements = recentVideos.reduce((acc, v) => acc + (v.likes || 0) + (v.comments || 0) + (v.shares || 0), 0);
  const engagementRate = totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(2) : 0;

  // Calcul Vues Médianes
  const viewsArray = recentVideos.map(v => v.views || 0).sort((a, b) => a - b);
  let medianViews = 0;
  if (viewsArray.length > 0) {
    const mid = Math.floor(viewsArray.length / 2);
    medianViews = viewsArray.length % 2 !== 0 ? viewsArray[mid] : (viewsArray[mid - 1] + viewsArray[mid]) / 2;
  }

  // Calcul Taux de Reach
  const reachRate = followers > 0 ? ((medianViews / followers) * 100).toFixed(2) : 0;

  // Calcul Viralité (Taux de Partage)
  const totalShares = recentVideos.reduce((acc, v) => acc + (v.shares || 0), 0);
  const viralityRate = totalViews > 0 ? ((totalShares / totalViews) * 100).toFixed(2) : 0;

  // Ratio de Viralité (Portée organique)
  const organicReachMultiplier = followers > 0 ? (totalViews / followers).toFixed(1) : 0;

  // Ratio de Conversion Abonnés (%)
  const conversionRate = totalViews > 0 ? ((followers / totalViews) * 100).toFixed(2) : 0;
  const viewsPerSub = followers > 0 ? Math.round(totalViews / followers) : 0;

  // Préparer les données pour le graphique des dernières vidéos
  const chartData = [...recentVideos].reverse().map((video, index) => ({
    name: `Vid ${index + 1}`,
    views: video.views,
    title: video.title
  }));

  // Préparer les données pour les vidéos publiées par mois
  const videosPerMonth = {};
  recentVideos.forEach(video => {
    if (video.date) {
      const dateObj = new Date(video.date);
      const monthStr = dateObj.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
      videosPerMonth[monthStr] = (videosPerMonth[monthStr] || 0) + 1;
    }
  });
  
  const monthlyData = Object.keys(videosPerMonth).map(key => ({
    month: key,
    count: videosPerMonth[key]
  })).reverse();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111827]/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-white/10 max-w-[200px] animate-in fade-in zoom-in duration-200">
          <p className="font-semibold text-white mb-2 line-clamp-2">{payload[0].payload.title}</p>
          <p className="text-teal-700 dark:text-[#25F4EE] font-bold">
            {new Intl.NumberFormat('fr-FR').format(payload[0].value)} Vues
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full mt-8">
      {/* Title/Header moved to unified parent block */}

      {/* Ligne 1 : KPIs (6 colonnes sur 2 lignes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Engagement Moyen */}
        <div className="bg-white dark:bg-transparent bg-gradient-to-br from-[#25F4EE]/10 dark:from-[#25F4EE]/20 to-blue-500/5 dark:to-blue-500/10 border border-[#25F4EE]/30 p-6 rounded-2xl text-slate-900 dark:text-white shadow-[0_8px_30px_rgba(37,244,238,0.15)] dark:shadow-[0_0_30px_rgba(37,244,238,0.1)] hover:shadow-[0_8px_40px_rgba(37,244,238,0.25)] dark:hover:shadow-[0_0_40px_rgba(37,244,238,0.2)] transition-shadow duration-300 flex flex-col justify-between relative overflow-visible group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#25F4EE]/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-[#25F4EE]/30 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-semibold text-teal-700 dark:text-[#25F4EE] uppercase tracking-wider relative z-10 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Taux d'Engagement
            </div>
            <div className="relative group/tooltip cursor-help z-50">
              <Info className="w-4 h-4 text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors" />
              <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-black border border-gray-700 dark:border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-xs text-left z-[60] pointer-events-none">
                <p className="font-bold text-white mb-1">Qualité de l'audience</p>
                <p className="text-gray-300 mb-2">Pourcentage de personnes ayant interagi avec vos vidéos par rapport au nombre de vues.</p>
                <div className="bg-black/50 rounded-lg p-2 mb-2 border border-white/5 space-y-1">
                  <div className="flex justify-between text-[10px]"><span className="text-red-400">&lt; 3%</span><span className="text-gray-400">Faible</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-yellow-400">3% - 6%</span><span className="text-gray-400">Bon</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-emerald-400">6% - 9%</span><span className="text-gray-400">Excellent</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-purple-400">&gt; 9%</span><span className="text-gray-400 font-semibold">Viral</span></div>
                </div>
                <div className="bg-white/10 rounded p-1.5 font-mono text-[10px] text-teal-400 dark:text-[#25F4EE]">
                  (Likes + Comms + Partages) / Vues * 100
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-4xl font-black mb-1 tracking-tight relative z-10 text-slate-900 dark:text-white flex items-baseline gap-1">
              {engagementRate}<span className="text-2xl text-slate-600">%</span>
            </div>
            <div className="mt-2 text-sm text-gray-800 font-medium dark:text-gray-300 relative z-10">
              Sur {recentVideos.length} vidéos analysées
            </div>
          </div>
        </div>

        {/* Card 2: Vues Médianes */}
        <div className="bg-white dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none flex flex-col justify-between hover:border-slate-300 transition-colors relative overflow-visible group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Vues Médianes
            </div>
            <div className="relative group/tooltip cursor-help z-50">
              <Info className="w-4 h-4 text-gray-400 hover:text-slate-900 dark:hover:text-white" />
              <div className="absolute right-0 bottom-full mb-2 w-56 p-3 bg-gray-900 dark:bg-black border border-gray-700 dark:border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-xs text-left z-[60] pointer-events-none">
                <p className="font-bold text-white mb-1">Plus réaliste</p>
                <p className="text-gray-300 mb-2">Une seule vidéo virale peut fausser la moyenne. La médiane indique le score que vos vidéos atteignent "normalement".</p>
                <div className="bg-white/10 rounded p-1.5 font-mono text-[10px] text-purple-600 dark:text-purple-400">
                  50% font mieux, 50% font moins
                </div>
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {new Intl.NumberFormat('fr-FR').format(medianViews)}
          </div>
        </div>

        {/* Card 3: Taux de Reach */}
        <div className="bg-white dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none flex flex-col justify-between hover:border-slate-300 transition-colors relative overflow-visible group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Taux de Reach
            </div>
            <div className="relative group/tooltip cursor-help z-50">
              <Info className="w-4 h-4 text-gray-400 hover:text-slate-900 dark:hover:text-white" />
              <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-black border border-gray-700 dark:border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-xs text-left z-[60] pointer-events-none">
                <p className="font-bold text-white mb-1">Portée de l'Audience</p>
                <p className="text-gray-300 mb-2">Proportion d'abonnés touchés par vos vidéos "normales" (médianes).</p>
                <div className="bg-black/50 rounded-lg p-2 mb-2 border border-white/5 space-y-1">
                  <div className="flex justify-between text-[10px]"><span className="text-red-400">&lt; 10%</span><span className="text-gray-400">Faible</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-yellow-400">10% - 25%</span><span className="text-gray-400">Bon</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-purple-400">&gt; 25%</span><span className="text-gray-400 font-semibold">Excellent</span></div>
                </div>
                <div className="bg-white/10 rounded p-1.5 font-mono text-[10px] text-blue-400 dark:text-[#25F4EE]">
                  (Vues Médianes / Abonnés) * 100
                </div>
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1">
              {reachRate}<span className="text-xl font-normal text-slate-600">%</span>
          </div>
        </div>

        {/* Card 4: Ratio de Viralité */}
        <div className="bg-white dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none flex flex-col justify-between hover:border-slate-300 transition-colors relative overflow-visible group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              <Share2 className="w-4 h-4 text-[#10B981]" /> Taux Partage
            </div>
            <div className="relative group/tooltip cursor-help z-50">
              <Info className="w-4 h-4 text-gray-400 hover:text-slate-900 dark:hover:text-white" />
              <div className="absolute right-0 bottom-full mb-2 w-56 p-3 bg-gray-900 dark:bg-black border border-gray-700 dark:border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-xs text-left z-[60] pointer-events-none">
                <p className="font-bold text-white mb-1">Score de Viralité</p>
                <p className="text-gray-300 mb-2">Le partage est le signal #1 pour l'algorithme (Pour Toi).</p>
                <div className="bg-black/50 rounded-lg p-2 mb-2 border border-white/5 space-y-1">
                  <div className="flex justify-between text-[10px]"><span className="text-red-400">&lt; 0.5%</span><span className="text-gray-400">Faible</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-yellow-400">0.5% - 2%</span><span className="text-gray-400">Bon</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-purple-400">&gt; 2%</span><span className="text-gray-400 font-semibold">Viral</span></div>
                </div>
                <div className="bg-white/10 rounded p-1.5 font-mono text-[10px] text-[#10B981]">
                  (Partages / Vues) * 100
                </div>
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1">
              {viralityRate}<span className="text-xl font-normal text-slate-600">%</span>
          </div>
        </div>

        {/* Card 5: Ratio de Viralité (Portée organique) */}
        <div className="bg-white dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none flex flex-col justify-between hover:border-slate-300 transition-colors relative overflow-visible group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              <Globe className="w-4 h-4 text-orange-600 dark:text-orange-400" /> Viralité (Portée)
            </div>
            <div className="relative group/tooltip cursor-help z-50">
              <Info className="w-4 h-4 text-gray-400 hover:text-slate-900 dark:hover:text-white" />
              <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-black border border-gray-700 dark:border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-xs text-left z-[60] pointer-events-none">
                <p className="font-bold text-white mb-1">Portée Organique</p>
                <p className="text-gray-300 mb-2">Ce ratio montre à quel point l'algorithme te pousse au-delà de ton propre cercle. Ça prouve concrètement ta capacité à "percer l'algorithme". Un argument en or pour ton Agence.</p>
                <div className="bg-black/50 rounded-lg p-2 mb-2 border border-white/5 space-y-1">
                  <div className="flex justify-between text-[10px]"><span className="text-red-400">&lt; 5x</span><span className="text-gray-400">Faible</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-yellow-400">5x - 20x</span><span className="text-gray-400">Bon</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-purple-400">&gt; 20x</span><span className="text-gray-400 font-semibold">Excellent</span></div>
                </div>
                <div className="bg-white/10 rounded p-1.5 font-mono text-[10px] text-orange-400 text-center">
                  Vues Totales / Abonnés
                </div>
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1">
              {organicReachMultiplier}<span className="text-xl font-normal text-slate-600">x</span>
          </div>
        </div>

        {/* Card 6: Ratio de Conversion Abonnés */}
        <div className="bg-white dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none flex flex-col justify-between hover:border-slate-300 transition-colors relative overflow-visible group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Conversion Abo
            </div>
            <div className="relative group/tooltip cursor-help z-50">
              <Info className="w-4 h-4 text-gray-400 hover:text-slate-900 dark:hover:text-white" />
              <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-black border border-gray-700 dark:border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-xs text-left z-[60] pointer-events-none">
                <p className="font-bold text-white mb-1">Efficacité du Contenu</p>
                <p className="text-gray-300 mb-2">C'est un indicateur d'efficacité de ton contenu. Tes vidéos font des vues, c'est bien. Est-ce qu'elles donnent envie de s'abonner ? Ça permet de tester des Call to Action à la fin de tes vidéos.</p>
                <div className="bg-black/50 rounded-lg p-2 mb-2 border border-white/5 space-y-1">
                  <div className="flex justify-between text-[10px]"><span className="text-red-400">&lt; 1%</span><span className="text-gray-400">Faible</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-yellow-400">1% - 3%</span><span className="text-gray-400">Moyen</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-purple-400">&gt; 3%</span><span className="text-gray-400 font-semibold">Excellent</span></div>
                </div>
                <div className="bg-white/10 rounded p-1.5 font-mono text-[10px] text-emerald-400 text-center">
                  Abonnés / Vues Totales<br/>
                  (Soit 1 abo toutes les {viewsPerSub} vues)
                </div>
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1">
              {conversionRate}<span className="text-xl font-normal text-slate-600">%</span>
          </div>
        </div>
      </div>

      {/* Ligne 2 : Graphiques */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Graphique Vues */}
        <div className="flex-1 bg-white dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 tracking-wide uppercase">Évolution des vues</h3>
          <div className="h-[300px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} dy={10} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(37, 244, 238, 0.05)'}} />
                <Bar dataKey="views" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#colorViews)" />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#25F4EE" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#25F4EE" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Graphique Vidéos par Mois */}
        <div className="flex-1 bg-white dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 tracking-wide uppercase">Vidéos Publiées / Mois</h3>
          <div className="h-[300px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} dy={10} />
                <Tooltip 
                  cursor={{fill: 'rgba(16, 185, 129, 0.05)'}}
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" name="Vidéos publiées" radius={[6, 6, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell key={`cell-month-${index}`} fill="url(#colorMonths)" />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="colorMonths" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
