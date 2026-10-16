import React from 'react';
import { Link } from 'react-router-dom';
import { MOCK_DATA } from '../data/mockData';
import { StatCard } from '../components/StatCard';
import { Sparkles, BarChart2, Radio, Users, Clock, Video, Eye, ExternalLink, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyInspiration } from '../components/DailyInspiration';
import { TwitchIcon, TikTokIcon, YoutubeIcon, DiscordIcon } from '../components/SocialIcons';
import { CREATOR_LIVE_ACCOUNTS } from '../services/multiLiveAlertService';
import { cn } from '../lib/utils';

export const Dashboard = ({ data }) => {
  const global = data ? data.global : MOCK_DATA.global;
  const sourceData = data || MOCK_DATA;

  // Agrégation temps réel de l'urbanisation SI (YouTube, TikTok, Instagram, LinkedIn, Discord, Twitch)
  const realYouTubeSubs = Number(sourceData.youtubeAPI?.channel?.subscribers ?? sourceData.youtube?.subscribers ?? 0);
  const realTikTokFollowers = Number(sourceData.tiktokAPI?.followers ?? sourceData.tiktok?.followers ?? 6393);
  const realInstagramFollowers = Number(sourceData.instagramAPI?.profile?.followersCount ?? sourceData.instagram?.followers ?? 481);
  const realLinkedInFollowers = Number(sourceData.linkedinAPI?.profile?.followersCount ?? sourceData.linkedin?.followers ?? 1715);
  const realDiscordMembers = Number(sourceData.discordAPI?.totalMembers ?? 208);
  const realTwitchFollowers = Number(sourceData.twitchLiveAPI?.followers ?? 25);

  const totalAudience =
    realYouTubeSubs +
    realTikTokFollowers +
    realInstagramFollowers +
    realLinkedInFollowers +
    realDiscordMembers +
    realTwitchFollowers;

  const realYouTubeViews = Number(
    sourceData.youtubeAPI?.channel?.publicChannelViews ??
    sourceData.youtubeAPI?.channel?.totalViews ??
    sourceData.youtube?.views ??
    0
  );
  const realTikTokViews = Number(
    sourceData.tiktokAPI?.views ??
    sourceData.tiktokAPI?.totalViews ??
    sourceData.tiktok?.views ??
    300080
  );
  const realTwitchVodViews = Number(sourceData.twitchLiveAPI?.totalVodViews ?? 63);
  const totalViewsCumul = realYouTubeViews + realTikTokViews + realTwitchVodViews;

  const ttLikes = Number(sourceData.tiktokAPI?.likes ?? sourceData.tiktokAPI?.totalLikes ?? 17100);
  const ttComments = Number(sourceData.tiktokAPI?.totalComments ?? sourceData.tiktokAPI?.comments ?? 1120);
  const ttShares = Number(sourceData.tiktokAPI?.shares ?? sourceData.tiktokAPI?.totalShares ?? 798);
  const ttEngRate = realTikTokViews > 0 ? ((ttLikes + ttComments + ttShares) / realTikTokViews) * 100 : 0;
  const ytEngRate = Number(sourceData.youtubeAPI?.channel?.globalEngagementRate ?? 0);
  const realAvgEngagement = Number(
    (ytEngRate > 0 && ttEngRate > 0
      ? (ttEngRate + ytEngRate) / 2
      : ttEngRate || ytEngRate || global?.avgEngagementRate || 0
    ).toFixed(2)
  );

  const twitchLive = sourceData.twitchLiveAPI || {};
  const tiktokLive = sourceData.tiktokLiveAPI || {};
  const youtubeLive = sourceData.youtubeLiveAPI || {};

  // Aggregate some mock chart data for the global view safely
  const globalChartData = sourceData.tiktok?.chartData?.map((d, i) => ({
    date: d.date,
    value: d.views + (sourceData.youtube?.chartData?.[i]?.views || 0) + (sourceData.instagram?.chartData?.[i]?.followers || 0),
  })) || [];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-24">
      
      <section>
        <h2 className="text-2xl font-headline-lg font-bold mb-1">Vue d'ensemble</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Performances cumulées en temps réel sur tous vos réseaux (TikTok, YouTube, Twitch, Discord, LinkedIn, Instagram)</p>
      </section>

      {/* Module de Motivation Quotidienne */}
      <DailyInspiration />

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
          value={realAvgEngagement} 
          growth={global?.engagementGrowth}
          suffix="%" 
        />
        <StatCard 
          title="Score IA" 
          value={global?.aiScore || 0} 
          suffix="/10"
        />
      </section>

      {/* RECOMMANDATION 3 : CARTE DÉDIÉE "TWITCH LIVE & CROISSANCE (karam_drm)" & RADAR MULTI-STREAM */}
      <section className="bg-lumina-lightSurface dark:bg-lumina-darkSurface rounded-[24px] p-6 shadow-sm border border-[#9146FF]/30 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#9146FF]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-200/70 dark:border-white/10 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#9146FF] text-white flex items-center justify-center shadow-lg shadow-[#9146FF]/30 shrink-0">
              <TwitchIcon size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-gray-900 dark:text-white">
                  Twitch Live &amp; Croissance (karam_drm)
                </h3>
                <span
                  className={cn(
                    'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1',
                    twitchLive.isLive
                      ? 'bg-[#FE2C55] text-white shadow-sm'
                      : 'bg-[#9146FF]/15 text-[#9146FF] dark:text-[#A970FF] border border-[#9146FF]/30'
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      twitchLive.isLive ? 'bg-white animate-ping' : 'bg-[#9146FF]'
                    )}
                  />
                  {twitchLive.isLive ? `EN DIRECT (${twitchLive.viewers || 0} spectateurs)` : 'SYNCHRONISÉ 0-QUOTA'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Catégorie : <strong className="text-[#9146FF] dark:text-[#A970FF]">{twitchLive.game || 'Just Chatting'}</strong> • Dernier titre : <span className="italic">"{twitchLive.title || 'On crée un site ensembe'}"</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/twitch"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-gray-900 dark:text-white text-xs font-bold transition-all"
            >
              <span>Ouvrir l'onglet Twitch</span>
              <ArrowRight size={14} />
            </Link>
            <a
              href={CREATOR_LIVE_ACCOUNTS.twitch.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#9146FF] hover:bg-[#7c32e8] text-white text-xs font-black transition-all shadow-md"
            >
              <span>🟣 CLIQUER ICI : LIVE TWITCH</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 relative z-10">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold">
              <span>Followers Twitch</span>
              <Users size={15} className="text-[#9146FF]" />
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white font-mono mt-1.5">
              {realTwitchFollowers}
            </p>
            <p className="text-[10px] text-emerald-500 font-mono mt-0.5">@karam_drm certifié</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold">
              <span>Heures Streamées</span>
              <Clock size={15} className="text-emerald-500" />
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white font-mono mt-1.5">
              {Number(twitchLive.totalStreamedHours ?? 20.7)}h
            </p>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
              Sur {Number(twitchLive.totalVideosCount ?? 9)} lives archivés
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold">
              <span>Vues Replays VOD</span>
              <Eye size={15} className="text-amber-500" />
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white font-mono mt-1.5">
              {realTwitchVodViews}
            </p>
            <p className="text-[10px] text-amber-500 font-mono mt-0.5">Catalogue VOD actif</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold">
              <span>Statut Multi-Stream</span>
              <Radio size={15} className="text-[#FE2C55]" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1',
                  tiktokLive.isLive ? 'bg-[#FE2C55] text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                )}
              >
                <TikTokIcon size={10} /> TT
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1',
                  youtubeLive.isLive ? 'bg-[#FF0000] text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                )}
              >
                <YoutubeIcon size={10} /> YT
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1',
                  twitchLive.isLive ? 'bg-[#9146FF] text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                )}
              >
                <TwitchIcon size={10} /> TW
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono mt-1">Relié à Discord @here</p>
          </div>
        </div>
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
