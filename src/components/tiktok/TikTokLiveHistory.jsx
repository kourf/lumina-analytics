import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, Users, TrendingUp, Clock, Heart, MessageSquare, UserPlus, Flame, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

// Tick personnalisé à 2 lignes (Date en haut, Heure en bas)
const CustomXAxisTick = ({ x, y, payload }) => {
  if (!payload || !payload.value) return null;
  const parts = String(payload.value).split(' • ');
  const datePart = parts[0] || payload.value;
  const timePart = parts[1] || '';

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="#9CA3AF" fontSize={11} fontWeight="600">
        {datePart}
      </text>
      {timePart && (
        <text x={0} y={0} dy={26} textAnchor="middle" fill="#6B7280" fontSize={10} fontFamily="ui-monospace, monospace">
          {timePart}
        </text>
      )}
    </g>
  );
};

export const TikTokLiveHistory = ({ historyArchives = [], onSelectLive }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeMetric, setActiveMetric] = useState('viewers'); // 'viewers' | 'likes' | 'comments' | 'followers'

  // Calcul des statistiques globales sur tous les lives archivés (Toujours au sommet !)
  const totals = useMemo(() => {
    if (!historyArchives || !Array.isArray(historyArchives)) return { likes: 0, comments: 0, followers: 0, peakMax: 0 };
    return historyArchives.reduce((acc, live) => {
      acc.likes += (live.totalLikes || live.likes || 0);
      acc.comments += (live.totalComments || live.comments || 0);
      acc.followers += (live.followers || live.newFollowers || 0);
      acc.peakMax = Math.max(acc.peakMax, live.peakViewers || 0);
      return acc;
    }, { likes: 0, comments: 0, followers: 0, peakMax: 0 });
  }, [historyArchives]);

  // 1. Ordre chronologique strict pour le graphique : PLUS ANCIEN à GAUCHE -> PLUS RÉCENT à DROITE
  const chartData = useMemo(() => {
    if (!historyArchives || !Array.isArray(historyArchives)) return [];
    return [...historyArchives]
      .sort((a, b) => new Date(a.date || a.startedAt || 0) - new Date(b.date || b.startedAt || 0))
      .map((session, index) => {
        const d = new Date(session.date || session.startedAt || Date.now());
        const dateFormatted = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        const timeFormatted = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');

        return {
          name: `${dateFormatted} • ${timeFormatted}`,
          dateFormatted,
          timeFormatted,
          fullDate: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          fullTime: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          peakViewers: session.peakViewers || 0,
          avgViewers: session.avgViewers || 0,
          likes: session.totalLikes || session.likes || 0,
          comments: session.totalComments || session.comments || 0,
          followers: session.followers || session.newFollowers || 0,
          duration: session.durationStr || session.duration || '00m',
          originalDate: session.date || session.startedAt,
          id: session.id || `${d.getTime()}_${index}`,
          sessionRaw: session,
          index
        };
      });
  }, [historyArchives]);

  // 2. Ordre antéchronologique pour le tableau (plus récent en haut)
  const tableData = useMemo(() => {
    if (!historyArchives || !Array.isArray(historyArchives)) return [];
    return [...historyArchives].sort((a, b) => new Date(b.date || b.startedAt || 0) - new Date(a.date || a.startedAt || 0));
  }, [historyArchives]);

  if (!historyArchives || historyArchives.length === 0) return null;

  // Métrique courante pour les barres
  const currentMetricKey = activeMetric === 'viewers' ? 'peakViewers' : activeMetric === 'likes' ? 'likes' : activeMetric === 'comments' ? 'comments' : 'followers';
  const currentGradientId = activeMetric === 'viewers' ? 'colorViewers' : activeMetric === 'likes' ? 'colorLikes' : activeMetric === 'comments' ? 'colorComments' : 'colorFollowers';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#111827]/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[220px] space-y-2.5">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <p className="text-white text-xs font-bold capitalize">{data.fullDate}</p>
              <p className="text-[11px] text-[#25F4EE] font-mono mt-0.5">Live débuté à {data.fullTime}</p>
            </div>
            <span className="text-[11px] text-gray-300 font-mono bg-white/5 px-2 py-1 rounded-md flex items-center gap-1 shrink-0 ml-2">
              <Clock size={11} /> {data.duration}
            </span>
          </div>

          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex items-center justify-between text-gray-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <TrendingUp size={13} className="text-[#FE2C55]" /> Pic Viewers :
              </span>
              <span className="font-bold text-white font-mono">{data.peakViewers}</span>
            </div>

            <div className="flex items-center justify-between text-gray-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Users size={13} className="text-orange-400" /> Moyenne :
              </span>
              <span className="font-bold text-white font-mono">{data.avgViewers}</span>
            </div>

            <div className="flex items-center justify-between text-gray-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Heart size={13} className="text-[#FE2C55]" /> Likes reçus :
              </span>
              <span className="font-bold text-[#FE2C55] font-mono">{new Intl.NumberFormat('fr-FR').format(data.likes)}</span>
            </div>

            <div className="flex items-center justify-between text-gray-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <MessageSquare size={13} className="text-blue-400" /> Commentaires :
              </span>
              <span className="font-bold text-blue-400 font-mono">{new Intl.NumberFormat('fr-FR').format(data.comments)}</span>
            </div>

            <div className="flex items-center justify-between text-gray-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <UserPlus size={13} className="text-emerald-400" /> Abonnés acquis :
              </span>
              <span className="font-bold text-emerald-400 font-mono">+{data.followers}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 text-center">
            <span className="text-[10px] text-[#25F4EE] font-medium flex items-center justify-center gap-1">
              <Sparkles size={10} /> Cliquer pour l'analyse complète
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-6 bg-white dark:bg-[#111827]/80 p-6 lg:p-8 rounded-[24px] border border-slate-200 dark:border-[#1F2937] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-sm relative overflow-hidden group transition-all duration-300 backdrop-blur-xl">
      
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#FE2C55]/5 blur-3xl -mr-32 -mt-32 rounded-full pointer-events-none group-hover:bg-[#FE2C55]/10 transition-all duration-700"></div>

      <div className="relative z-10 space-y-6">
        
        {/* Header & Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FE2C55]/10 flex items-center justify-center border border-[#FE2C55]/20">
              <Calendar className="w-5 h-5 text-[#FE2C55]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Historique des Lives (Archives)
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20 font-mono">
                  {historyArchives.length} lives
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                <span>Analyses consolidées</span>
                <span className="text-slate-300 dark:text-gray-700">•</span>
                <span className="text-teal-600 dark:text-[#25F4EE] font-medium flex items-center gap-1">
                  <Sparkles size={11} /> Cliquez sur une session pour ouvrir le rapport détaillé
                </span>
              </p>
            </div>
          </div>

          {/* Onglets sélecteur de métrique pour le graphique */}
          <div className="flex items-center bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200 dark:border-white/5 text-xs font-medium">
            <button
              onClick={() => setActiveMetric('viewers')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                activeMetric === 'viewers'
                  ? "bg-white dark:bg-[#1F2937] text-slate-900 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"
              )}
            >
              <TrendingUp size={13} className="text-[#FE2C55]" />
              <span>Viewers</span>
            </button>

            <button
              onClick={() => setActiveMetric('likes')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                activeMetric === 'likes'
                  ? "bg-white dark:bg-[#1F2937] text-slate-900 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"
              )}
            >
              <Heart size={13} className="text-[#FE2C55]" />
              <span>Likes</span>
            </button>

            <button
              onClick={() => setActiveMetric('comments')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                activeMetric === 'comments'
                  ? "bg-white dark:bg-[#1F2937] text-slate-900 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"
              )}
            >
              <MessageSquare size={13} className="text-blue-400" />
              <span>Commentaires</span>
            </button>

            <button
              onClick={() => setActiveMetric('followers')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                activeMetric === 'followers'
                  ? "bg-white dark:bg-[#1F2937] text-slate-900 dark:text-white shadow-sm font-bold"
                  : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"
              )}
            >
              <UserPlus size={13} className="text-emerald-400" />
              <span>Abonnés</span>
            </button>
          </div>
        </div>

        {/* KPI Strip Synthèse des Vies */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <span>Pic Max Record</span>
              <Flame size={14} className="text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">{totals.peakMax}</p>
          </div>

          <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <span>Total Likes Lives</span>
              <Heart size={14} className="text-[#FE2C55]" />
            </div>
            <p className="text-2xl font-black text-[#FE2C55] font-mono mt-2">{new Intl.NumberFormat('fr-FR').format(totals.likes)}</p>
          </div>

          <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <span>Total Commentaires</span>
              <MessageSquare size={14} className="text-blue-400" />
            </div>
            <p className="text-2xl font-black text-blue-500 dark:text-blue-400 font-mono mt-2">{new Intl.NumberFormat('fr-FR').format(totals.comments)}</p>
          </div>

          <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <span>Abonnés Acquis</span>
              <UserPlus size={14} className="text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">+{totals.followers}</p>
          </div>
        </div>

        {/* Légende Chronologique explicite */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-gray-500 px-1">
          <span>👈 Lives les plus anciens</span>
          <span className="font-medium text-slate-600 dark:text-gray-400">Chronologie par date et heure (Gauche ➔ Droite)</span>
          <span>Lives les plus récents 👉</span>
        </div>

        {/* Graphique (Bar Chart Chronologique avec 2 lignes d'axes : Date + Heure) */}
        <div className="h-72 w-full bg-slate-50/50 dark:bg-black/20 rounded-2xl p-4 border border-slate-200 dark:border-white/5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              onClick={(state) => {
                if (state && state.activePayload && state.activePayload.length && onSelectLive) {
                  onSelectLive(state.activePayload[0].payload.sessionRaw);
                }
              }}
              onMouseMove={(state) => {
                if (state.isTooltipActive) setActiveIndex(state.activeTooltipIndex);
                else setActiveIndex(null);
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <defs>
                {/* Dégradé Viewers */}
                <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FE2C55" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#FE2C55" stopOpacity={0.2}/>
                </linearGradient>

                {/* Dégradé Likes */}
                <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FE2C55" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#FF6584" stopOpacity={0.2}/>
                </linearGradient>

                {/* Dégradé Commentaires */}
                <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.2}/>
                </linearGradient>

                {/* Dégradé Abonnés */}
                <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#34D399" stopOpacity={0.2}/>
                </linearGradient>
              </defs>

              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                interval={0}
                tick={<CustomXAxisTick />}
              />
              <YAxis 
                stroke="#6B7280" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                dx={-5}
              />
              <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} content={<CustomTooltip />} />
              <Bar 
                dataKey={currentMetricKey} 
                radius={[6, 6, 0, 0]} 
                fill={`url(#${currentGradientId})`}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={activeIndex === index ? (activeMetric === 'comments' ? '#60A5FA' : activeMetric === 'followers' ? '#34D399' : '#FF416C') : `url(#${currentGradientId})`} 
                    className="transition-all duration-300 cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tableau Détaché Défilant avec tous les indicateurs et action pour ouvrir l'analyse */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#2F2F2F] bg-slate-50/50 dark:bg-[#0A0A0E]">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-[#121218] border-b border-slate-200 dark:border-[#2F2F2F] text-slate-500 dark:text-[#A3A3A3] text-xs uppercase tracking-wider font-semibold">
                <th className="p-4">Date & Heure de début</th>
                <th className="p-4 text-right">Durée</th>
                <th className="p-4 text-right">Viewers (Moy / Pic)</th>
                <th className="p-4 text-right text-[#FE2C55]">Likes</th>
                <th className="p-4 text-right text-blue-500 dark:text-blue-400">Commentaires</th>
                <th className="p-4 text-right text-emerald-600 dark:text-emerald-400">Abonnés</th>
                <th className="p-4 text-right">Rapport</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#2F2F2F] text-xs md:text-sm">
              {tableData.map((session, i) => {
                const dateObj = new Date(session.date || session.startedAt || Date.now());
                const likes = session.totalLikes || session.likes || 0;
                const comments = session.totalComments || session.comments || 0;
                const followers = session.followers || session.newFollowers || 0;
                const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');

                return (
                  <tr 
                    key={session.id || i} 
                    onClick={() => onSelectLive && onSelectLive(session)}
                    className="hover:bg-slate-100/70 dark:hover:bg-white/5 transition-all duration-200 group cursor-pointer"
                  >
                    <td className="p-4 text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="font-semibold flex items-center gap-2 group-hover:text-teal-600 dark:group-hover:text-[#25F4EE] transition-colors">
                        <span>{dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-[#25F4EE] font-mono">
                          {timeStr}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5">
                        {session.title || 'Session Live TikTok'}
                      </div>
                    </td>

                    <td className="p-4 text-slate-600 dark:text-gray-400 text-right whitespace-nowrap font-mono text-xs">
                      {session.durationStr || session.duration || '-'}
                    </td>

                    <td className="p-4 text-right whitespace-nowrap font-mono">
                      <span className="text-slate-600 dark:text-gray-400">{session.avgViewers || 0}</span>
                      <span className="text-slate-400 dark:text-gray-600 mx-1">/</span>
                      <span className="text-[#FE2C55] font-bold">{session.peakViewers || 0}</span>
                    </td>

                    <td className="p-4 text-right whitespace-nowrap font-mono font-semibold text-[#FE2C55]">
                      <div className="flex items-center justify-end gap-1">
                        <Heart size={12} className="text-[#FE2C55]" />
                        {new Intl.NumberFormat('fr-FR').format(likes)}
                      </div>
                    </td>

                    <td className="p-4 text-right whitespace-nowrap font-mono font-semibold text-blue-600 dark:text-blue-400">
                      <div className="flex items-center justify-end gap-1">
                        <MessageSquare size={12} className="text-blue-500 dark:text-blue-400" />
                        {new Intl.NumberFormat('fr-FR').format(comments)}
                      </div>
                    </td>

                    <td className="p-4 text-right whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      <div className="flex items-center justify-end gap-1">
                        <UserPlus size={12} className="text-emerald-500 dark:text-emerald-400" />
                        +{followers}
                      </div>
                    </td>

                    {/* Bouton d'Action Propre et Minimaliste */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/60 dark:bg-white/5 group-hover:bg-[#25F4EE]/10 border border-slate-300/60 dark:border-white/10 group-hover:border-[#25F4EE]/30 text-xs font-semibold text-slate-700 dark:text-gray-300 group-hover:text-[#25F4EE] transition-all shadow-sm">
                        <span>Analyse</span>
                        <ChevronRight size={13} className="text-slate-400 dark:text-gray-500 group-hover:text-[#25F4EE] group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default TikTokLiveHistory;
