import React, { useState } from 'react';
import { StatCard } from '../components/StatCard';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Lightbulb, ExternalLink, Sparkles, TrendingUp, Target, Copy, Check, ShieldCheck, Zap } from 'lucide-react';

const keyToFrenchLabel = {
  members: "Membres",
  activeMembers: "Membres actifs",
  messagesSent: "Messages",
  activityRate: "Activité",
  subscribers: "Abonnés",
  views: "Vues",
  watchTime: "Heures",
  followers: "Abonnés",
  likes: "J'aime",
  engagement: "Engagement",
  connections: "Relations",
  impressions: "Impressions",
  profileViews: "Vues du profil",
  shares: "Partages",
  comments: "Commentaires",
  reactions: "Réactions"
};

export const PlatformPage = ({ name, data, color = '#0A66C2', icon: Icon, mainMetric, mainValue, chartKey, platformLink }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const growthValue = data[`${mainMetric?.toLowerCase()}Growth`] || 8.1;

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-24 max-w-7xl mx-auto">
      
      {/* Header Premium Google Stitch DNA */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-lumina-lightSurface via-white to-gray-50 dark:from-lumina-darkSurface dark:via-[#15151c] dark:to-lumina-darkElevated border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300 relative overflow-hidden" 
            style={{ backgroundColor: `${color}18`, color: color, borderColor: `${color}40`, borderWidth: 1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
            <Icon size={30} className="relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-headline-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
                {name} Analytics
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Certifié Live
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Dashboard de pilotage et intelligence stratégique multi-canaux
            </p>
          </div>
        </div>

        {platformLink && (
          <a 
            href={platformLink} 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm text-white shadow-lg transition-all duration-300 hover:opacity-95 hover:shadow-xl active:scale-95"
            style={{ backgroundColor: color }}
          >
            Accéder au profil {name}
            <ExternalLink size={16} />
          </a>
        )}
      </section>

      {/* Main Metric Hero Banner */}
      <div 
        className="rounded-[28px] p-7 md:p-8 shadow-sm relative overflow-hidden border border-lumina-lightBorder dark:border-lumina-darkBorder group transition-all duration-300 hover:shadow-xl"
        style={{ 
          background: `linear-gradient(135deg, ${color}15 0%, rgba(255,255,255,0.02) 60%, ${color}08 100%)` 
        }}
      >
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ backgroundColor: color }}></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-white/70 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10" style={{ color }}>
                {mainMetric || 'Audience Globale'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                <ShieldCheck size={14} className="text-emerald-500" /> Données synchronisées
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display-kpi font-extrabold text-gray-900 dark:text-white tracking-tight">
              {mainValue?.toLocaleString('fr-FR')}
            </h2>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <TrendingUp size={14} /> +{growthValue}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs période précédente (7 jours)</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400">Score de Portée</span>
              <span className="text-sm font-extrabold text-gray-900 dark:text-white">9.4 / 10</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400">Conversion Bio</span>
              <span className="text-sm font-extrabold text-emerald-500">Haute traction</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(data).map(([key, value]) => {
          if (typeof value !== 'object' && !key.toLowerCase().includes('growth') && key !== mainMetric?.toLowerCase()) {
            return (
              <StatCard 
                key={key}
                title={keyToFrenchLabel[key] || (key.charAt(0).toUpperCase() + key.slice(1))} 
                value={value} 
                suffix={key === 'activityRate' || key === 'engagement' || key === 'engagementRate' ? '%' : ''}
              />
            );
          }
          return null;
        })}
      </section>

      {/* Chart Section */}
      {data.chartData && (
        <section className="bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 rounded-[28px] p-6 md:p-8 shadow-sm border border-lumina-lightBorder dark:border-lumina-darkBorder">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={20} style={{ color }} />
                Évolution Hebdomadaire ({keyToFrenchLabel[chartKey] || chartKey})
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Courbe d'engagement et dynamique de traction sur 7 jours
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 self-start sm:self-auto">
              Pic le Jeudi / Vendredi
            </span>
          </div>

          <div className="h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`colorGrad${name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dx={-5} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111116',
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    boxShadow: '0 20px 30px -10px rgba(0,0,0,0.5)', 
                    padding: '12px 16px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: color, fontWeight: 'bold' }}
                  formatter={(val) => [val.toLocaleString('fr-FR'), keyToFrenchLabel[chartKey] || chartKey]}
                />
                <Area type="monotone" dataKey={chartKey} stroke={color} strokeWidth={4} fillOpacity={1} fill={`url(#colorGrad${name})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* AI Strategy Lab & Recommendations */}
      <section className="bg-gradient-to-br from-lumina-lightSurface to-gray-50 dark:from-lumina-darkSurface dark:to-[#15151c] rounded-[28px] p-6 md:p-8 border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Laboratoire Stratégique IA & Recommandations {name}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Conseils prescriptifs générés par l'IA pour maximiser la conversion B2B et l'engagement
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
              <Zap size={14} /> Modèle FinOps Token-Optimized
            </span>
          </div>
        </div>

        {/* Recommendations list */}
        {data.recommendations && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {data.recommendations.map((rec, index) => (
              <div 
                key={index} 
                className="p-5 rounded-2xl bg-white dark:bg-[#1A1A22] border border-gray-200/70 dark:border-gray-800 flex flex-col justify-between hover:border-indigo-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                      #{index + 1}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      Priorité Haute
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug mb-2">
                    Action Stratégique #{index + 1}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {rec}
                  </p>
                </div>

                <button 
                  onClick={() => handleCopy(rec, index)}
                  className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    {copiedIndex === index ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {copiedIndex === index ? "Copié !" : "Copier l'action"}
                  </span>
                  <span className="text-[10px] text-gray-400">Prêt</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
