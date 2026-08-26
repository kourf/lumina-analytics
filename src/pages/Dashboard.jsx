import React from 'react';
import { MOCK_DATA } from '../data/mockData';
import { StatCard } from '../components/StatCard';
import { Sparkles, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard = ({ data }) => {
  const global = data ? data.global : MOCK_DATA.global;
  const sourceData = data || MOCK_DATA;

  // Récupération des vraies données si disponibles (priorité à l'API)
  const realYouTubeSubs = sourceData.youtubeAPI?.channel?.subscribers || sourceData.youtube?.subscribers || 0;
  const realYouTubeViews = sourceData.youtubeAPI?.channel?.totalViews || sourceData.youtube?.views || 0;
  
  const totalAudience = (global?.totalFollowers || 0) - (sourceData.youtube?.subscribers || 0) + realYouTubeSubs;
  const totalViewsCumul = (global?.totalViews || 0) - (sourceData.youtube?.views || 0) + realYouTubeViews;

  // Aggregate some mock chart data for the global view safely
  const globalChartData = sourceData.tiktok?.chartData?.map((d, i) => ({
    date: d.date,
    value: d.views + (sourceData.youtube?.chartData?.[i]?.views || 0) + (sourceData.instagram?.chartData?.[i]?.followers || 0),
  })) || [];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-24">
      
      <section>
        <h2 className="text-2xl font-headline-lg font-bold mb-1">Vue d'ensemble</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Performances cumulées sur tous vos réseaux</p>
      </section>

      {/* AI Summary Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl p-6 shadow-lg shadow-indigo-500/20 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <Sparkles className="text-yellow-300" size={22} />
          <h3 className="font-bold text-lg">Analyse de la semaine</h3>
        </div>
        <p className="text-[15px] opacity-95 relative z-10 leading-relaxed font-medium">
          {global?.weeklySummary}
        </p>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Audience Totale" 
          value={totalAudience} 
          growth={global?.followersGrowth} 
        />
        <StatCard 
          title="Vues Cumulées" 
          value={totalViewsCumul} 
          growth={global?.viewsGrowth} 
        />
        <StatCard 
          title="Engagement Moyen" 
          value={global?.avgEngagementRate || 0} 
          growth={global?.engagementGrowth}
          suffix="%" 
        />
        <StatCard 
          title="Score IA" 
          value={global?.aiScore || 0} 
          suffix="/10"
        />
      </section>

      <section className="bg-lumina-lightSurface dark:bg-lumina-darkSurface rounded-[24px] p-6 shadow-sm border border-lumina-lightBorder dark:border-lumina-darkBorder hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/10 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 size={20} className="text-lumina-primary" />
            Croissance de l'audience
          </h3>
          <span className="text-xs font-semibold text-lumina-primary bg-lumina-primary/10 px-3 py-1 rounded-full">7 derniers jours</span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={globalChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', backgroundColor: 'var(--tw-colors-lumina-darkSurface, #121216)', color: '#fff' }}
                itemStyle={{ color: '#2563EB', fontWeight: 'bold' }}
                formatter={(value) => [value.toLocaleString('fr-FR'), "Interactions"]}
              />
              <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorGlobal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

    </div>
  );
};

