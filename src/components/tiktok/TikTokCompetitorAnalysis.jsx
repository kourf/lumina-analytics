import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Users, Eye, Heart, MessageCircle, BarChart2, Zap, ArrowUpRight, ArrowDownRight, Activity, X, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '../../lib/utils';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../config/firebase';

const CHART_COLORS = ['#F97316', '#A855F7', '#EC4899', '#EAB308'];

export const TikTokCompetitorAnalysis = ({ myData }) => {
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [competitors, setCompetitors] = useState([]);

  // Écoute de Firestore pour la synchronisation multi-appareils
  useEffect(() => {
    const docRef = doc(db, 'users', 'karamokho');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.tiktokCompetitors) {
          setCompetitors(data.tiktokCompetitors);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Valeurs par défaut si myData n'est pas dispo
  const myFollowers = myData?.followers || 6000;
  const myViews = myData?.views || 273200;
  const myLikes = myData?.likes || 15600;
  const myComments = myData?.comments || 1200;
  const myShares = myData?.shares || 850;
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!competitorUrl || competitors.length >= 4) return;

    setIsAnalyzing(true);
    
    let newUsername = competitorUrl.split('@')[1];
    if (newUsername) {
      newUsername = newUsername.split('?')[0].split('/')[0];
    } else {
      newUsername = competitorUrl;
    }
    
    // On évite les doublons
    if (competitors.find(c => c.username === newUsername)) {
      setIsAnalyzing(false);
      setCompetitorUrl('');
      return;
    }

    try {
      const functions = getFunctions();
      const scrapeCompetitor = httpsCallable(functions, 'scrapeCompetitor');
      
      const response = await scrapeCompetitor({ username: newUsername });
      const scrapedData = response.data.data;
      
      // On conserve le mock pour les stats mensuelles qui ne sont pas scrapables publiquement
      const multiplier = competitors.length === 0 ? 1 : 0.4;
      
      const newCompetitor = {
        id: Date.now(),
        username: scrapedData.nickname || newUsername,
        color: CHART_COLORS[competitors.length % CHART_COLORS.length],
        followers: scrapedData.followers || 0,
        views: (scrapedData.videos || 1) * 12000, // On estime les vues totales à partir du nb de vidéos
        likes: scrapedData.likes || 0,
        comments: Math.floor(scrapedData.likes * 0.05), // Estimation
        shares: Math.floor(scrapedData.likes * 0.02), // Estimation
        monthlyData: [
          Math.floor(12 * multiplier), Math.floor(15 * multiplier), Math.floor(14 * multiplier), 
          Math.floor(18 * multiplier), Math.floor(16 * multiplier), Math.floor(10 * multiplier), 
          Math.floor(20 * multiplier), Math.floor(22 * multiplier), Math.floor(15 * multiplier), 
          Math.floor(12 * multiplier), Math.floor(14 * multiplier), Math.floor(16 * multiplier)
        ]
      };

      const updatedCompetitors = [...competitors, newCompetitor];
      
      await setDoc(doc(db, 'users', 'karamokho'), {
        tiktokCompetitors: updatedCompetitors
      }, { merge: true });

    } catch (err) {
      console.error("Erreur de scraping (Captcha probable) :", err);
      alert("Le scraper maison a été bloqué par TikTok (Captcha ou sécurité). Sans API payante (RapidAPI), l'extraction est échouée.");
    } finally {
      setIsAnalyzing(false);
      setCompetitorUrl('');
    }
  };

  const removeCompetitor = async (id) => {
    const updatedCompetitors = competitors.filter(c => c.id !== id);
    try {
      await setDoc(doc(db, 'users', 'karamokho'), {
        tiktokCompetitors: updatedCompetitors
      }, { merge: true });
    } catch (err) {
      console.error("Erreur de suppression:", err);
      // Fallback local
      setCompetitors(updatedCompetitors);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const calculateEngagement = (views, likes, comments, shares) => {
    if (!views || views === 0) return 0;
    // L'engagement total prend en compte likes, commentaires et partages
    const totalEngagements = likes + comments + (shares || 0);
    return ((totalEngagements / views) * 100).toFixed(2);
  };

  const calculateVirality = (views, followers) => {
    if (!followers || followers === 0) return 0;
    return (views / followers).toFixed(2);
  };

  const calculateConversion = (followers, views) => {
    if (!views || views === 0) return 0;
    return ((followers / views) * 100).toFixed(2);
  };

  const calculateShareRate = (shares, views) => {
    if (!views || views === 0) return 0;
    return ((shares / views) * 100).toFixed(2);
  };

  const myEngagement = parseFloat(calculateEngagement(myViews, myLikes, myComments, myShares));
  const myVirality = parseFloat(calculateVirality(myViews, myFollowers));
  const myConversion = parseFloat(calculateConversion(myFollowers, myViews));
  const myShareRate = parseFloat(calculateShareRate(myShares, myViews));

  // Préparation des données pour le graphique
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const baseMyMonthlyData = [4, 5, 6, 4, 5, 3, 7, 6, 5, 4, 5, 6];
  
  const chartData = months.map((month, index) => {
    const dataObj = { month, moi: baseMyMonthlyData[index] };
    competitors.forEach(comp => {
      dataObj[comp.username] = comp.monthlyData[index];
    });
    return dataObj;
  });

  const renderComparisonRow = (label, myVal, compKey, type = 'number', tooltipText = '') => {
    // Collecter toutes les valeurs
    const allValues = [{ name: 'Moi', value: myVal }];
    competitors.forEach(comp => {
      let val = comp[compKey];
      if (compKey === 'engagement') val = parseFloat(calculateEngagement(comp.views, comp.likes, comp.comments, comp.shares));
      else if (compKey === 'virality') val = parseFloat(calculateVirality(comp.views, comp.followers));
      else if (compKey === 'conversion') val = parseFloat(calculateConversion(comp.followers, comp.views));
      else if (compKey === 'shareRate') val = parseFloat(calculateShareRate(comp.shares, comp.views));
      else val = val || 0; // fallback in case shares or other is missing
      
      allValues.push({ name: comp.username, value: val });
    });

    const formatValue = (v) => {
      if (type === 'percent') return `${v.toFixed(2)}%`;
      if (type === 'multiplier') return `${v.toFixed(2)}x`;
      return formatNumber(v);
    };

    // Trouver le max
    const maxObj = allValues.reduce((prev, current) => (prev.value > current.value) ? prev : current);
    
    // Calculer l'écart par rapport au Leader (Si je suis le leader, écart vs 2ème. Sinon, mon écart vs Leader)
    let diffText = "";
    let diffColor = "";
    let Icon = null;

    if (maxObj.name === 'Moi') {
      const secondBest = allValues.filter(v => v.name !== 'Moi').reduce((prev, current) => (prev.value > current.value) ? prev : current, {value: 0});
      const gap = myVal - secondBest.value;
      
      diffText = `+${formatValue(gap)}`;
      diffColor = "text-emerald-600 dark:text-emerald-400";
      Icon = ArrowUpRight;
    } else {
      const gap = maxObj.value - myVal; // Valeur positive absolue
      
      diffText = `-${formatValue(gap)}`;
      diffColor = "text-red-500 dark:text-red-400";
      Icon = ArrowDownRight;
    }

    return (
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group/row">
        <div className="w-[120px] shrink-0 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-gray-300 group/tooltip relative cursor-help">
          <span className="border-b border-dashed border-slate-400 dark:border-gray-500 pb-0.5">{label}</span>
          {tooltipText && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2.5 bg-slate-800 dark:bg-black/90 text-white text-xs leading-relaxed rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 shadow-xl pointer-events-none text-center">
              {tooltipText}
              <div className="absolute left-1/2 -translate-x-1/2 top-full border-[6px] border-transparent border-t-slate-800 dark:border-t-black/90"></div>
            </div>
          )}
        </div>
        
        <div className={cn("w-[100px] shrink-0 text-center font-bold", maxObj.name === 'Moi' ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-gray-400")}>
          {formatValue(myVal)}
        </div>
        
        {competitors.map(comp => {
          let cVal = comp[compKey];
          if (compKey === 'engagement') cVal = parseFloat(calculateEngagement(comp.views, comp.likes, comp.comments, comp.shares));
          else if (compKey === 'virality') cVal = parseFloat(calculateVirality(comp.views, comp.followers));
          else if (compKey === 'conversion') cVal = parseFloat(calculateConversion(comp.followers, comp.views));
          else if (compKey === 'shareRate') cVal = parseFloat(calculateShareRate(comp.shares, comp.views));
          else cVal = cVal || 0;

          const isWinner = maxObj.name === comp.username;
          return (
            <div key={comp.id} className={cn("w-[100px] shrink-0 text-center font-bold", isWinner ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-gray-500")} style={isWinner ? { color: comp.color } : {}}>
              {formatValue(cVal)}
            </div>
          );
        })}

        <div className={cn("w-[140px] shrink-0 flex items-center justify-end gap-1 text-xs font-bold", diffColor)}>
          {diffText} {Icon && <Icon className="w-3 h-3" />}
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-xl">
          <p className="font-bold text-slate-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <p key={index} className="text-sm font-semibold flex items-center gap-2" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name} : {formatNumber(entry.value)} vidéos
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Trouver le domaine à améliorer (Là où l'écart négatif est le plus grand en pourcentage)
  let worstGap = { key: '', label: '', percentage: 0 };
  if (competitors.length > 0) {
    const kpis = [
      { key: 'views', label: 'Vues Totales', myVal: myViews },
      { key: 'likes', label: 'Likes', myVal: myLikes },
      { key: 'comments', label: 'Commentaires', myVal: myComments },
      { key: 'shares', label: 'Partages', myVal: myShares },
      { key: 'engagement', label: 'Engagement', myVal: myEngagement },
      { key: 'shareRate', label: 'Taux de Partage', myVal: myShareRate },
      { key: 'virality', label: 'Ratio de Viralité', myVal: myVirality },
      { key: 'conversion', label: 'Conversion Abo', myVal: myConversion }
    ];

    kpis.forEach(kpi => {
      let maxCompVal = 0;
      competitors.forEach(c => {
        let val = c[kpi.key];
        if (kpi.key === 'engagement') val = parseFloat(calculateEngagement(c.views, c.likes, c.comments, c.shares));
        else if (kpi.key === 'virality') val = parseFloat(calculateVirality(c.views, c.followers));
        else if (kpi.key === 'conversion') val = parseFloat(calculateConversion(c.followers, c.views));
        else if (kpi.key === 'shareRate') val = parseFloat(calculateShareRate(c.shares, c.views));
        else val = val || 0;
        
        if (val > maxCompVal) maxCompVal = val;
      });

      if (maxCompVal > kpi.myVal) {
        const gapPercentage = ((maxCompVal - kpi.myVal) / maxCompVal) * 100;
        if (gapPercentage > worstGap.percentage) {
          worstGap = { key: kpi.key, label: kpi.label, percentage: gapPercentage };
        }
      }
    });
  }

  const cleanUsername = (name) => name ? name.split('?')[0].split('/')[0] : '';

  const ACTION_ADVICE = {
    views: [
      "Retravailler les 3 premières secondes (Hook) pour capter l'attention plus vite.",
      "Utiliser les musiques et trends audio virales du moment en fond sonore.",
      "Augmenter légèrement la fréquence de publication pour pousser l'algorithme."
    ],
    likes: [
      "Intégrer un Call-To-Action vocal clair à la fin de vos vidéos.",
      "Créer davantage de contenu 'relatable' (humour ou situations du quotidien).",
      "Améliorer le storytelling visuel pour créer un attachement émotionnel."
    ],
    comments: [
      "Poser une question ouverte et clivante dans les 5 dernières secondes.",
      "Laisser un détail insolite ou un 'easter egg' visuel en arrière-plan.",
      "Répondre avec une vidéo aux meilleurs commentaires pour relancer le débat."
    ],
    shares: [
      "Créer des vidéos de type 'Tutorial' ou 'Astuces' indispensables à transmettre.",
      "Miser sur des formats 'Envoie cette vidéo à un pote qui...'.",
      "Publier des infographies animées contenant de la valeur très condensée."
    ],
    engagement: [
      "Raccourcir la durée des vidéos pour maximiser le taux de complétion (Watch Time).",
      "Proposer des astuces à forte valeur ajoutée incitant fortement à l'enregistrement (Save).",
      "Créer des boucles visuelles (Loop) parfaites pour que les spectateurs regardent deux fois."
    ],
    shareRate: [
      "Créer des vidéos de type 'Tutorial' ou 'Astuces' indispensables à transmettre.",
      "Miser sur des formats 'Envoie cette vidéo à un pote qui...'.",
      "Publier des infographies animées contenant de la valeur très condensée."
    ],
    virality: [
      "Créer un format de vidéo ciblé sur un public externe (hors de vos abonnés).",
      "Utiliser davantage de sons trending et de filtres pour forcer le push algorithmique.",
      "Varier radicalement les hashtags pour toucher de nouveaux segments de 'For You Page'."
    ],
    conversion: [
      "Structurer le profil avec une bio hyper claire et une série (playlist) explicite.",
      "Ajouter un appel à l'action 'Abonnez-vous' au moment le plus fort et utile de la vidéo.",
      "Créer des vidéos en plusieurs parties (Part 1, Part 2) pour forcer le suivi du compte."
    ],
    leader: [
      "Maintenir la régularité et la fréquence de publication actuelles.",
      "Tester des formats plus longs (1 min+) pour mieux monétiser cette audience captive.",
      "Rediriger stratégiquement ce trafic vers d'autres canaux de conversion (YouTube, Instagram)."
    ]
  };

  const adviceList = worstGap.key ? ACTION_ADVICE[worstGap.key] : ACTION_ADVICE.leader;

  return (
    <div className="bg-white dark:bg-[#111827]/80 border border-slate-200 dark:border-[#1F2937] backdrop-blur-xl rounded-[24px] p-6 shadow-sm dark:shadow-none w-full">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-inner">
            <TargetIcon className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Veille Concurrentielle (Multi-Comptes)</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Ajoutez jusqu'à 4 concurrents pour visualiser vos écarts.</p>
          </div>
        </div>
      </div>

      {/* INPUT AREA & BADGES */}
      <div className="mb-10">
        <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4 relative mb-4">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-teal-400 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#25F4EE]/50 focus:border-transparent transition-all shadow-inner"
              placeholder="Ex: https://www.tiktok.com/@concurrent"
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              disabled={competitors.length >= 4}
            />
          </div>
          <button
            type="submit"
            disabled={isAnalyzing || !competitorUrl || competitors.length >= 4}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyse...
              </>
            ) : (
              <>
                <Activity className="w-5 h-5" />
                Ajouter
              </>
            )}
          </button>
        </form>

        {/* Liste des concurrents actifs */}
        {competitors.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">Cibles actives :</span>
            {competitors.map(comp => (
              <div key={comp.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: comp.color }}></span>
                <span className="text-sm font-medium text-slate-800 dark:text-white">@{cleanUsername(comp.username)}</span>
                <button onClick={() => removeCompetitor(comp.id)} className="ml-1 text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {competitors.length >= 4 && (
              <span className="text-xs text-red-500 dark:text-red-400 ml-2">Limite de 4 atteinte.</span>
            )}
          </div>
        )}
      </div>

      {/* RESULTS SECTION */}
      {competitors.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* COMPARISON MATRIX */}
            <div className="bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-inner overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20 pb-4">
              <div className="flex items-center justify-between mb-6 min-w-[650px]">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-purple-500 dark:text-purple-400" /> Matrice de Performance Multi-Comptes
                </h3>
                <span className="text-xs text-slate-500 italic md:hidden animate-pulse">👉 Glissez pour voir +</span>
              </div>
              
              <div className="min-w-[650px]">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-200 dark:border-white/10">
                  <div className="w-[120px] shrink-0 text-xs font-bold text-slate-500 uppercase tracking-wider">KPI</div>
                  <div className="w-[100px] shrink-0 text-center text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Moi</div>
                  {competitors.map(comp => (
                    <div key={comp.id} className="w-[100px] shrink-0 text-center text-xs font-bold uppercase tracking-wider truncate px-1" style={{ color: comp.color }} title={`@${cleanUsername(comp.username)}`}>
                      @{cleanUsername(comp.username)}
                    </div>
                  ))}
                  <div className="w-[140px] shrink-0 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Écart</div>
                </div>

                <div className="flex flex-col">
                  {renderComparisonRow("Abonnés", myFollowers, 'followers', 'number', "Personnes qui suivent votre compte. Base d'audience fidèle.")}
                  {renderComparisonRow("Vues Totales", myViews, 'views', 'number', "Nombre total de visionnages sur l'ensemble des vidéos récentes.")}
                  {renderComparisonRow("Likes", myLikes, 'likes', 'number', "Mentions 'J'aime'. Indicateur basique d'appréciation du contenu.")}
                  {renderComparisonRow("Commentaires", myComments, 'comments', 'number', "Nombre de commentaires. Montre la capacité à créer du débat.")}
                  {renderComparisonRow("Partages", myShares, 'shares', 'number', "Nombre de partages. L'interaction la plus forte pour devenir viral.")}
                  {renderComparisonRow("Engagement (%)", myEngagement, 'engagement', 'percent', "Pourcentage d'interaction (Likes + Coms + Partages) par rapport aux vues.")}
                  {renderComparisonRow("Taux de Partage", myShareRate, 'shareRate', 'percent', "Pourcentage de personnes qui ont partagé la vidéo après l'avoir vue.")}
                  {renderComparisonRow("Viralité", myVirality, 'virality', 'multiplier', "Multiplicateur de portée : plus il est élevé, plus l'algorithme pousse vos vidéos en dehors de votre cercle d'abonnés.")}
                  {renderComparisonRow("Conversion Abo", myConversion, 'conversion', 'percent', "Capacité à transformer un simple spectateur en un nouvel abonné.")}
                </div>
              </div>
              
              <div className="mt-6 p-5 bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-200 dark:bg-purple-500/20 rounded-lg shrink-0">
                    <Zap className="w-5 h-5 text-purple-700 dark:text-purple-400" />
                  </div>
                  <div className="w-full">
                    <p className="text-sm font-bold text-purple-900 dark:text-white mb-1">
                      Plan d'Action Lumina IA
                    </p>
                    <p className="text-xs text-purple-800 dark:text-gray-300 mb-3">
                      {worstGap.label 
                        ? `Retard identifié sur : ${worstGap.label} (-${worstGap.percentage.toFixed(2)}%). Voici 3 actions immédiates pour combler cet écart :`
                        : `Vous êtes leader sur les indicateurs clés. Voici 3 actions pour consolider votre avance :`}
                    </p>
                    <ul className="space-y-2">
                      {adviceList.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-purple-900 dark:text-purple-200 font-medium bg-white/50 dark:bg-black/20 p-2.5 rounded-lg border border-purple-200/50 dark:border-white/5">
                          <span className="text-purple-600 dark:text-purple-400 font-bold shrink-0">{idx + 1}.</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* CHART 12 MONTHS MULTI-BAR */}
            <div className="bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-inner flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Comparatif de Publication (12 Mois)
              </h3>
              
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(100, 100, 100, 0.05)'}} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    <Bar dataKey="moi" name="Moi" fill="#25F4EE" radius={[4, 4, 0, 0]} barSize={competitors.length > 2 ? 6 : 12} />
                    {competitors.map(comp => (
                      <Bar key={comp.id} dataKey={comp.username} name={`@${cleanUsername(comp.username)}`} fill={comp.color} radius={[4, 4, 0, 0]} barSize={competitors.length > 2 ? 6 : 12} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Target Icon
const TargetIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
