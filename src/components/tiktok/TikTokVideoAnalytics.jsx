import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, MessageCircle, Heart, Info, TrendingUp, Zap, Share2, Globe, Users, BarChart2, TrendingUp as TrendingUpIcon, Sparkles, Calendar } from 'lucide-react';

export const TikTokVideoAnalytics = ({ videoAnalytics, recentVideos = [], followers = 0 }) => {
  const [activeMetric, setActiveMetric] = useState('views');
  const [chartType, setChartType] = useState('bar');

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

  // Configurations pédagogiques pour chaque métrique
  const metricConfig = {
    views: {
      key: 'views',
      label: 'Vues',
      color: '#25F4EE',
      activeText: 'text-teal-600 dark:text-[#25F4EE]',
      bgBadge: 'bg-[#25F4EE]/10 text-teal-700 dark:text-[#25F4EE] border-[#25F4EE]/30',
      title: 'Évolution du volume de Vues',
      explanation: 'Mesure la diffusion algorithmique de chaque vidéo, de votre 1ère vidéo publiée jusqu\'à aujourd\'hui. Les pics correspondent aux contenus massivement propulsés dans le flux "Pour Toi" grâce à une forte rétention dès les premières secondes.',
      takeaway: 'Objectif : Identifier les sujets et formats des vidéos en pic pour répliquer leurs accroches (hooks).'
    },
    likes: {
      key: 'likes',
      label: 'Likes',
      color: '#F43F5E',
      activeText: 'text-rose-600 dark:text-rose-400',
      bgBadge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      title: 'Évolution des Mentions "J\'aime"',
      explanation: 'Mesure l\'approbation immédiate et la sympathie générée auprès de vos spectateurs, de votre toute 1ère vidéo à aujourd\'hui. Le like valide la qualité perçue et le plaisir ressenti par le spectateur.',
      takeaway: 'Objectif : Observer la hausse constante des likes qui témoigne d\'une meilleure maîtrise de vos formats et d\'un public de plus en plus conquis.'
    },
    shares: {
      key: 'shares',
      label: 'Partages',
      color: '#8B5CF6',
      activeText: 'text-purple-600 dark:text-purple-400',
      bgBadge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
      title: 'Évolution de la Viralité (Partages)',
      explanation: 'Mesure la recommandation active de vos vidéos : les spectateurs les envoient à leurs proches ou les partagent sur d\'autres réseaux. C\'est le signal le plus puissant et le plus récompensé par l\'algorithme TikTok.',
      takeaway: 'Objectif : Isoler les vidéos à très fort partage (astuces concrètes, émotions fortes, contenus éducatifs) qui drainent le plus d\'audience externe.'
    },
    engagement: {
      key: 'engagement',
      label: 'Engagement (%)',
      color: '#F59E0B',
      activeText: 'text-amber-600 dark:text-amber-400',
      bgBadge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      title: 'Évolution du Taux d\'Engagement (%)',
      explanation: 'Représente le pourcentage d\'interactions actives (Likes + Commentaires + Partages) rapporté au nombre de vues, pour chaque vidéo de la 1ère à aujourd\'hui. Il permet de comparer objectivement petits et gros succès.',
      takeaway: 'Un taux supérieur à 6% signale une communauté très soudée et attentive, indépendamment du nombre de vues.'
    },
    followers: {
      key: 'followers',
      label: 'Abonnés',
      color: '#10B981',
      activeText: 'text-emerald-600 dark:text-emerald-400',
      bgBadge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      title: 'Évolution de la Croissance des Abonnés',
      explanation: 'Retrace la croissance progressive de votre communauté de la 1ère vidéo publiée jusqu\'à votre total actuel d\'abonnés. Chaque vidéo convertit une fraction de son audience en abonnés fidèles.',
      takeaway: 'Les accélérations de la courbe mettent en lumière les vidéos qui ont servi de tremplin d\'acquisition majeur.'
    }
  };

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

  // Tri chronologique rigoureux : de la 1ère vidéo publiée jusqu'à aujourd'hui
  const sortedChronologicalVideos = useMemo(() => {
    const hasDates = recentVideos.some(v => v.date);
    if (hasDates) {
      return [...recentVideos].sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        return timeA - timeB;
      });
    }
    return [...recentVideos].reverse();
  }, [recentVideos]);

  // Préparer les données pour le graphique chronologique
  let cumulativeViewsTracker = 0;
  const chartData = sortedChronologicalVideos.map((video, index) => {
    const views = Number(video.views || 0);
    const likes = Number(video.likes || 0);
    const comments = Number(video.comments || 0);
    const shares = Number(video.shares || 0);
    const engagement = views > 0 ? Number((((likes + comments + shares) / views) * 100).toFixed(2)) : 0;
    
    cumulativeViewsTracker += views;
    const cumulativeFollowers = totalViews > 0 ? Math.round((cumulativeViewsTracker / totalViews) * followers) : 0;
    const followersGain = totalViews > 0 ? Math.round((views / totalViews) * followers) : 0;

    let formattedDate = '';
    if (video.date) {
      try {
        formattedDate = new Date(video.date).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      } catch (e) {
        formattedDate = '';
      }
    }

    return {
      name: `Vid ${index + 1}`,
      index: index + 1,
      isFirst: index === 0,
      isLast: index === sortedChronologicalVideos.length - 1,
      views,
      likes,
      shares,
      engagement,
      followers: cumulativeFollowers,
      followersGain,
      formattedDate,
      title: video.title || video.desc || `Vidéo ${index + 1}`
    };
  });

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
      const itemData = payload[0].payload;
      const currentConfig = metricConfig[activeMetric] || metricConfig.views;
      const rawVal = payload[0].value;
      const formattedVal = activeMetric === 'engagement'
        ? `${rawVal}%`
        : new Intl.NumberFormat('fr-FR').format(rawVal);

      return (
        <div className="bg-[#111827]/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-white/10 max-w-[260px] animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-white/10">
            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
              {itemData.name} {itemData.isFirst ? '· 1ère vidéo' : itemData.isLast ? '· Aujourd\'hui' : ''}
            </span>
            {itemData.formattedDate && (
              <span className="text-[10px] text-gray-400 font-mono">{itemData.formattedDate}</span>
            )}
          </div>
          <p className="font-semibold text-white mb-2 line-clamp-2 text-xs leading-snug">{itemData.title}</p>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-gray-300">{currentConfig.label} :</span>
            <span className="font-bold text-sm" style={{ color: currentConfig.color }}>
              {formattedVal}
            </span>
          </div>
          {activeMetric === 'followers' && (
            <p className="text-[10px] text-emerald-400 mt-1 font-mono">
              +{new Intl.NumberFormat('fr-FR').format(itemData.followersGain)} abos estimés générés
            </p>
          )}
          {activeMetric !== 'followers' && (
            <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-white/5 text-[10px] text-gray-400 font-mono">
              <div>Vues: {new Intl.NumberFormat('fr-FR').format(itemData.views)}</div>
              <div>Likes: {new Intl.NumberFormat('fr-FR').format(itemData.likes)}</div>
              <div>Partages: {new Intl.NumberFormat('fr-FR').format(itemData.shares)}</div>
              <div>Engag.: {itemData.engagement}%</div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full mt-8 relative z-20 hover:z-50 transition-all">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            Analyse Stratégique du Contenu
          </h2>
          <p className="text-slate-500 dark:text-gray-400 mt-1">
            Période analysée : depuis la publication de votre première vidéo jusqu'à aujourd'hui (calculé sur l'ensemble du catalogue de {recentVideos.length} vidéos)
          </p>
        </div>
      </div>

      {/* Ligne 1 : KPIs (6 colonnes sur 2 lignes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Engagement Moyen */}
        <div className="bg-white dark:bg-transparent bg-gradient-to-br from-[#25F4EE]/10 dark:from-[#25F4EE]/20 to-blue-500/5 dark:to-blue-500/10 border border-[#25F4EE]/30 p-6 rounded-2xl text-slate-900 dark:text-white shadow-[0_8px_30px_rgba(37,244,238,0.15)] dark:shadow-[0_0_30px_rgba(37,244,238,0.1)] hover:shadow-[0_8px_40px_rgba(37,244,238,0.25)] dark:hover:shadow-[0_0_40px_rgba(37,244,238,0.2)] transition-shadow duration-300 flex flex-col justify-between relative hover:z-50 overflow-visible group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#25F4EE]/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-[#25F4EE]/30 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-semibold text-teal-700 dark:text-[#25F4EE] uppercase tracking-wider relative z-10 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Taux d'Engagement
            </div>
            <div className="relative group/tooltip cursor-help z-50">
              <Info className="w-4 h-4 text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors" />
              <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-black border border-gray-700 dark:border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-xs text-left z-[60] pointer-events-none">
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
        <div className="bg-white dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none flex flex-col justify-between hover:border-slate-300 transition-colors relative hover:z-50 overflow-visible group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Vues Médianes
            </div>
            <div className="relative group/tooltip cursor-help z-50">
              <Info className="w-4 h-4 text-gray-400 hover:text-slate-900 dark:hover:text-white" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 bg-gray-900 dark:bg-black border border-gray-700 dark:border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-xs text-left z-[60] pointer-events-none">
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
        <div className="bg-white dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none flex flex-col justify-between hover:border-slate-300 transition-colors relative hover:z-50 overflow-visible group">
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
        <div className="bg-white dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none flex flex-col justify-between hover:border-slate-300 transition-colors relative hover:z-50 overflow-visible group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              <Share2 className="w-4 h-4 text-[#10B981]" /> Taux Partage
            </div>
            <div className="relative group/tooltip cursor-help z-50">
              <Info className="w-4 h-4 text-gray-400 hover:text-slate-900 dark:hover:text-white" />
              <div className="absolute left-0 bottom-full mb-2 w-56 p-3 bg-gray-900 dark:bg-black border border-gray-700 dark:border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-xs text-left z-[60] pointer-events-none">
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
        <div className="bg-white dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none flex flex-col justify-between hover:border-slate-300 transition-colors relative hover:z-50 overflow-visible group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              <Globe className="w-4 h-4 text-orange-600 dark:text-orange-400" /> Viralité (Portée)
            </div>
            <div className="relative group/tooltip cursor-help z-50">
              <Info className="w-4 h-4 text-gray-400 hover:text-slate-900 dark:hover:text-white" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-black border border-gray-700 dark:border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-xs text-left z-[60] pointer-events-none">
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
        <div className="bg-white dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none flex flex-col justify-between hover:border-slate-300 transition-colors relative hover:z-50 overflow-visible group">
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
        {/* Graphique Interactif */}
        <div className="flex-1 bg-white dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                  Évolution des performances
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  De la 1ère vidéo à aujourd'hui
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Suivi chronologique sur vos {recentVideos.length} vidéos (de la toute première publiée jusqu'à la plus récente)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-200 dark:border-slate-700/50">
                <button
                  onClick={() => setActiveMetric('views')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeMetric === 'views' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-[#25F4EE] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >Vues</button>
                <button
                  onClick={() => setActiveMetric('likes')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeMetric === 'likes' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >Likes</button>
                <button
                  onClick={() => setActiveMetric('shares')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeMetric === 'shares' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >Partages</button>
                <button
                  onClick={() => setActiveMetric('engagement')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeMetric === 'engagement' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >Engagement</button>
                <button
                  onClick={() => setActiveMetric('followers')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeMetric === 'followers' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >Abonnés</button>
              </div>

              <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-200 dark:border-slate-700/50">
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  title="Histogramme"
                >
                  <BarChart2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  title="Courbe linéaire"
                >
                  <TrendingUpIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Encart Pédagogique Interactif pour l'indicateur sélectionné */}
          {metricConfig[activeMetric] && (
            <div className="mb-4 p-4 rounded-xl border transition-all duration-300 bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${metricConfig[activeMetric].bgBadge}`}>
                    {metricConfig[activeMetric].label}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {metricConfig[activeMetric].title}
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" /> De la 1ère vidéo publiée à aujourd'hui
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed mb-2.5">
                {metricConfig[activeMetric].explanation}
              </p>
              <div className="flex items-start sm:items-center gap-2 text-[11px] font-medium text-slate-700 dark:text-gray-300 bg-white dark:bg-black/30 p-2.5 rounded-lg border border-slate-200 dark:border-white/5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                <span>{metricConfig[activeMetric].takeaway}</span>
              </div>
            </div>
          )}

          <div className="h-[280px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} dy={10} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255, 255, 255, 0.05)'}} />
                  <Bar dataKey={activeMetric} radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={metricConfig[activeMetric]?.color || '#25F4EE'} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} dy={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey={activeMetric} 
                    stroke={metricConfig[activeMetric]?.color || '#25F4EE'} 
                    strokeWidth={3} 
                    dot={{r: 3, fill: '#111827', stroke: metricConfig[activeMetric]?.color || '#25F4EE', strokeWidth: 2}} 
                    activeDot={{r: 6, fill: metricConfig[activeMetric]?.color || '#25F4EE'}} 
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-600 dark:text-gray-400">
            <span>Ordre chronologique : Vid 1 (1ère vidéo)</span>
            <span>Vid {recentVideos.length} (Dernière vidéo · Aujourd'hui)</span>
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
