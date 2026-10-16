import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Radio, Clock, Video, Eye, ExternalLink, RefreshCw,
  Sparkles, ShieldCheck, Info, HelpCircle, Compass, Lightbulb,
  Play, BarChart3, Activity, CheckCircle2, Layers, Tv, Flame,
  Calendar, ArrowUpRight, Bell
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { TwitchIcon, TikTokIcon, YoutubeIcon, DiscordIcon } from '../components/SocialIcons';
import {
  CREATOR_LIVE_ACCOUNTS,
  DISCORD_ALERT_TARGET,
  checkTwitchLiveStatus,
  checkMultiPlatformLiveStatus,
  formatDurationSeconds
} from '../services/multiLiveAlertService';

// Composant Réutilisable d'Infobulle Pédagogique
const SectionInfoTooltip = ({ title, definition, utility, align = 'left', width = 'w-[300px] sm:w-[340px]' }) => {
  return (
    <div className="relative inline-flex items-center group/infotip z-30">
      <button
        type="button"
        className="text-slate-400 hover:text-[#9146FF] dark:hover:text-[#A970FF] transition-colors p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10"
        title="Cliquez ou survolez pour voir l'explication"
      >
        <Info size={14} />
      </button>

      <div
        className={cn(
          'absolute top-full mt-2.5 p-4 bg-[#0B1329] text-white text-[11px] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/20 opacity-0 pointer-events-none group-hover/infotip:opacity-100 transition-all duration-200 z-[999] backdrop-blur-2xl space-y-2.5',
          width,
          align === 'right' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'
        )}
      >
        <div className="flex items-center gap-1.5 border-b border-white/15 pb-1.5 font-bold text-[#A970FF] text-xs">
          <HelpCircle size={13} className="text-[#A970FF]" />
          <span>{title}</span>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1">
            <Compass size={11} className="text-emerald-400" />
            C'est quoi ?
          </p>
          <p className="text-gray-200 leading-relaxed text-[11px]">{definition}</p>
        </div>

        <div className="space-y-1 bg-white/5 p-2.5 rounded-xl border border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1">
            <Lightbulb size={11} className="text-amber-400" />
            Utilité pour vous (Dirigeant) :
          </p>
          <p className="text-gray-300 leading-relaxed text-[10px]">{utility}</p>
        </div>
      </div>
    </div>
  );
};

export const TwitchDashboard = ({ data }) => {
  const [twitchState, setTwitchState] = useState(() => ({
    isLive: Boolean(data?.twitchLiveAPI?.isLive),
    status: data?.twitchLiveAPI?.isLive ? 'LIVE' : 'OFFLINE',
    userId: data?.twitchLiveAPI?.userId || '740554414',
    displayName: data?.twitchLiveAPI?.displayName || 'karam_drm',
    description:
      data?.twitchLiveAPI?.description || 'Le créatif préféré derrière ton outil préféré.',
    accountCreatedAt: data?.twitchLiveAPI?.accountCreatedAt || '2021-11-06T17:12:52Z',
    streamId: data?.twitchLiveAPI?.streamId || null,
    title: data?.twitchLiveAPI?.title || 'On crée un site ensembe',
    viewers: Number(data?.twitchLiveAPI?.viewers || 0),
    game: data?.twitchLiveAPI?.game || 'Just Chatting',
    gameBoxArtUrl:
      data?.twitchLiveAPI?.gameBoxArtUrl ||
      'https://static-cdn.jtvnw.net/ttv-boxart/509658-285x380.jpg',
    previewImageUrl:
      data?.twitchLiveAPI?.previewImageUrl ||
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_karam_drm-640x360.jpg',
    followers: Number(data?.twitchLiveAPI?.followers ?? 25),
    avatarUrl:
      data?.twitchLiveAPI?.avatarUrl ||
      'https://static-cdn.jtvnw.net/jtv_user_pictures/ab914d68-d93b-4289-948d-aec685dcfafa-profile_image-300x300.png',
    startedAt: data?.twitchLiveAPI?.startedAt || null,
    totalVideosCount: Number(data?.twitchLiveAPI?.totalVideosCount ?? 9),
    totalVodViews: Number(data?.twitchLiveAPI?.totalVodViews ?? 63),
    totalStreamedHours: Number(data?.twitchLiveAPI?.totalStreamedHours ?? 20.7),
    avgStreamDurationMinutes: Number(data?.twitchLiveAPI?.avgStreamDurationMinutes ?? 138),
    vods: Array.isArray(data?.twitchLiveAPI?.vods) ? data.twitchLiveAPI.vods : [],
    clips: Array.isArray(data?.twitchLiveAPI?.clips) ? data.twitchLiveAPI.clips : [],
    liveUrl: CREATOR_LIVE_ACCOUNTS.twitch.liveUrl,
    profileUrl: CREATOR_LIVE_ACCOUNTS.twitch.profileUrl
  }));

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeChartMetric, setActiveChartMetric] = useState('views'); // 'views' | 'duration'
  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  const syncTwitchData = async (force = false) => {
    setIsRefreshing(true);
    try {
      const [twRes] = await Promise.allSettled([
        checkTwitchLiveStatus('karam_drm'),
        checkMultiPlatformLiveStatus({ forceRefresh: force, syncFirestore: true })
      ]);
      if (twRes.status === 'fulfilled' && twRes.value && !twRes.value.preserveExisting) {
        setTwitchState((prev) => ({
          ...prev,
          ...twRes.value
        }));
        setLastSyncTime(new Date());
      }
    } catch (e) {
      console.debug('Sync Twitch GQL:', e.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    syncTwitchData(false);
    const interval = setInterval(() => syncTwitchData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  // Calcul du temps écoulé si en direct
  const liveUptimeFormatted = useMemo(() => {
    if (!twitchState.isLive || !twitchState.startedAt) return null;
    const diffSec = Math.max(
      0,
      Math.floor((Date.now() - new Date(twitchState.startedAt).getTime()) / 1000)
    );
    return formatDurationSeconds(diffSec);
  }, [twitchState.isLive, twitchState.startedAt, lastSyncTime]);

  // Données chronologiques des VODs pour le graphique Recharts (du plus ancien à gauche au plus récent à droite)
  const chartData = useMemo(() => {
    const vodsList = twitchState.vods || [];
    if (vodsList.length === 0) return [];
    return [...vodsList]
      .reverse()
      .map((v, idx) => {
        const d = v.publishedAt ? new Date(v.publishedAt) : null;
        const shortDate = d
          ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
          : `Live #${idx + 1}`;
        const durationMin = Math.round((v.lengthSeconds || 0) / 60);
        return {
          id: v.id,
          date: shortDate,
          fullDate: d
            ? d.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : shortDate,
          title: v.title,
          views: Number(v.views || 0),
          durationMin,
          durationFormatted: v.durationFormatted || formatDurationSeconds(v.lengthSeconds),
          game: v.game || 'Just Chatting'
        };
      });
  }, [twitchState.vods]);

  const parentHostname =
    typeof window !== 'undefined' && window.location?.hostname
      ? window.location.hostname
      : 'lumina-analytics-kd-2026.web.app';

  return (
    <div className="flex flex-col gap-8 pb-24 max-w-[1600px] mx-auto w-full min-h-screen px-4 md:px-8 animate-fade-in">
      {/* 1. HERO BANNER TWITCH OFFICIEL : karam_drm */}
      <div className="w-full bg-white dark:bg-[#111827]/90 rounded-[28px] border border-slate-200 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-none relative overflow-hidden backdrop-blur-2xl transition-all duration-300">
        {/* Couverture Ambiance Twitch Purple Glow */}
        <div className="h-36 md:h-48 w-full relative overflow-hidden bg-gradient-to-r from-[#1F1137] via-[#3B176B] to-[#18112B]">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#9146FF]/35 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
          <div className="absolute top-0 right-10 w-96 h-96 bg-[#A970FF]/25 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>

          <div
            className="absolute inset-0 opacity-10 mix-blend-overlay"
            style={{
              backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />

          {/* Statuts Sync & Badges */}
          <div className="absolute top-4 right-6 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => syncTwitchData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 border border-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] text-gray-200 transition-all active:scale-95 shadow-sm cursor-pointer"
              title="Synchroniser en direct via Twitch GraphQL (0 quota)"
            >
              <RefreshCw size={12} className={cn('text-[#A970FF]', isRefreshing && 'animate-spin')} />
              <span>{isRefreshing ? 'Synchronisation...' : 'Sync Temps Réel (GQL 0-Quota)'}</span>
            </button>

            <div
              className={cn(
                'flex items-center gap-2 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm border',
                twitchState.isLive
                  ? 'bg-red-500/25 border-red-500/50 text-red-200'
                  : 'bg-[#9146FF]/25 border-[#9146FF]/50 text-purple-200'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  twitchState.isLive ? 'bg-red-400 animate-ping' : 'bg-[#A970FF]'
                )}
              ></span>
              <span className="text-xs font-black uppercase tracking-wider">
                {twitchState.isLive ? `EN DIRECT (${twitchState.viewers} spectateurs)` : 'VEILLE ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Contenu Profil Chaîne Twitch */}
        <div className="px-6 md:px-8 pb-7 flex flex-col lg:flex-row lg:items-end justify-between relative mt-[-45px] md:mt-[-55px] gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
            {/* Avatar Officiel Twitch */}
            <div className="relative shrink-0">
              <img
                src={twitchState.avatarUrl}
                alt={twitchState.displayName}
                className={cn(
                  'w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover border-4 bg-[#18181B] shadow-2xl',
                  twitchState.isLive
                    ? 'border-[#FE2C55] shadow-[0_10px_30px_rgba(254,44,85,0.4)]'
                    : 'border-white dark:border-[#111827] shadow-[0_10px_30px_rgba(145,70,255,0.4)]'
                )}
              />
              <span
                className={cn(
                  'absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md flex items-center gap-1',
                  twitchState.isLive ? 'bg-[#FE2C55]' : 'bg-[#9146FF]'
                )}
              >
                <TwitchIcon size={11} />
                {twitchState.isLive ? 'LIVE' : 'TWITCH'}
              </span>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {twitchState.displayName}
                </h1>
                <span className="inline-flex items-center gap-1 bg-[#9146FF]/10 dark:bg-[#9146FF]/20 text-[#9146FF] dark:text-[#A970FF] border border-[#9146FF]/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  <ShieldCheck size={13} />
                  Chaîne Créateur Certifiée
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  <Radio size={13} />
                  Relié au Studio d'Alerte Discord (@here)
                </span>
              </div>

              <p className="text-xs md:text-sm text-slate-600 dark:text-gray-300 max-w-xl leading-relaxed">
                {twitchState.description} • Catégorie principale :{' '}
                <span className="font-bold text-[#9146FF] dark:text-[#A970FF]">
                  {twitchState.game || 'Just Chatting'}
                </span>
              </p>

              {/* Badges Données Réelles */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1 text-xs">
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-3 py-1.5 rounded-xl font-medium text-slate-700 dark:text-gray-300">
                  <Users size={13} className="text-[#9146FF]" />
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {twitchState.followers}
                  </span>{' '}
                  Followers
                </div>
                <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-[#9146FF]/10 border border-purple-200 dark:border-[#9146FF]/20 px-3 py-1.5 rounded-xl font-medium text-[#9146FF] dark:text-[#A970FF]">
                  <Video size={13} />
                  <span className="font-bold font-mono">{twitchState.totalVideosCount}</span> VODs Archivées
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl font-medium text-emerald-700 dark:text-emerald-400">
                  <Clock size={13} />
                  <span className="font-bold font-mono">{twitchState.totalStreamedHours}h</span> Streamées
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'Action Explicites */}
          <div className="shrink-0 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowEmbeddedPlayer((v) => !v)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-white/10"
            >
              <Tv size={15} className="text-[#9146FF]" />
              <span>{showEmbeddedPlayer ? 'Masquer le Lecteur Live' : 'Lecteur Live Intégré'}</span>
            </button>

            <a
              href={CREATOR_LIVE_ACCOUNTS.twitch.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#9146FF] hover:bg-[#7c32e8] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-[0_4px_20px_rgba(145,70,255,0.4)] hover:shadow-[0_6px_25px_rgba(145,70,255,0.6)] active:scale-95 group"
            >
              <span>🟣 CLIQUER ICI : REJOINDRE LE LIVE TWITCH</span>
              <ArrowUpRight
                size={15}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </a>
          </div>
        </div>
      </div>

      {/* 2. LECTEUR TWITCH INTÉGRÉ (SI ACTIVÉ PAR L'UTILISATEUR) */}
      {showEmbeddedPlayer && (
        <div className="bg-[#0E0E10] rounded-[24px] p-4 sm:p-6 border border-[#9146FF]/30 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <TwitchIcon size={18} className="text-[#9146FF]" />
              <span>Flux Vidéo & Chat Direct Twitch (karam_drm)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowEmbeddedPlayer(false)}
              className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded-lg bg-white/5"
            >
              Fermer l'aperçu vidéo
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10">
              <iframe
                src={`https://player.twitch.tv/?channel=karam_drm&parent=${parentHostname}&parent=localhost&muted=true`}
                title="Twitch Live Player karam_drm"
                className="w-full h-full"
                allowFullScreen
              />
            </div>
            <div className="h-[400px] lg:h-auto w-full rounded-xl overflow-hidden bg-[#18181B] border border-white/10">
              <iframe
                src={`https://www.twitch.tv/embed/karam_drm/chat?darkpopout&parent=${parentHostname}&parent=localhost`}
                title="Twitch Live Chat karam_drm"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. MONITEUR DE SESSION EN DIRECT & SYNCHRONISATION MULTI-STREAM */}
      <div
        className={cn(
          'rounded-[24px] p-6 lg:p-7 border transition-all',
          twitchState.isLive
            ? 'bg-gradient-to-r from-[#9146FF]/15 via-[#111827] to-[#FE2C55]/10 border-[#9146FF]/40 shadow-[0_0_35px_rgba(145,70,255,0.15)]'
            : 'bg-white dark:bg-[#111827]/80 border-slate-200 dark:border-white/10'
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Miniature Live / Dernier Stream */}
          <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-white/10 group">
            <img
              src={twitchState.previewImageUrl}
              alt={twitchState.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span
                className={cn(
                  'px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1.5 shadow-md',
                  twitchState.isLive ? 'bg-[#FE2C55]' : 'bg-slate-800/90'
                )}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    twitchState.isLive ? 'bg-white animate-ping' : 'bg-slate-400'
                  )}
                />
                {twitchState.isLive ? 'EN DIRECT SUR TWITCH' : 'DERNIÈRE SESSION ARCHIVÉE'}
              </span>
              {liveUptimeFormatted && (
                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-black/70 text-white backdrop-blur-md">
                  ⏱️ {liveUptimeFormatted}
                </span>
              )}
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
              <div>
                <p className="text-white font-black text-sm sm:text-base line-clamp-1">
                  {twitchState.title || 'On crée un site ensembe'}
                </p>
                <p className="text-xs text-purple-300 font-semibold">{twitchState.game}</p>
              </div>
              <a
                href={CREATOR_LIVE_ACCOUNTS.twitch.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#9146FF] hover:bg-[#7c32e8] text-white text-[11px] font-black px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-1.5 shrink-0"
              >
                <span>Ouvrir le Stream</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Détails Multi-Stream & Liaison Discord */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#9146FF]/15 text-[#9146FF] dark:text-[#A970FF] border border-[#9146FF]/30">
                  Architecture 0-Quota • Twitch GraphQL
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Synchronisé avec Discord {DISCORD_ALERT_TARGET.channelName}
                </span>
              </div>
              <Link
                to="/discord"
                className="text-xs font-bold text-[#5865F2] dark:text-[#7983F5] hover:underline flex items-center gap-1"
              >
                <Bell size={13} />
                <span>Configurer l'alerte Discord @here →</span>
              </Link>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {twitchState.isLive
                ? `🔴 Live en cours : "${twitchState.title}"`
                : `Dernier Live diffusé : "${twitchState.title}"`}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
              Votre chaîne Twitch <strong>karam_drm</strong> est reliée en temps réel au radar multi-plateformes Lumina. Dès que vous lancez votre live sur OBS / Restream, le studio regroupe automatiquement <strong>TikTok</strong>, <strong>YouTube</strong> et <strong>Twitch</strong> dans une seule annonce <code>@here</code> avec bouton de transfert explicite.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                <p className="text-[10px] font-mono uppercase text-slate-400">Statut Diffusion</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      twitchState.isLive ? 'bg-emerald-400 animate-ping' : 'bg-purple-400'
                    )}
                  />
                  {twitchState.isLive ? `${twitchState.viewers} Spectateurs Live` : 'Prêt pour le prochain Live'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                <p className="text-[10px] font-mono uppercase text-slate-400">Catégorie Twitch</p>
                <p className="text-sm font-black text-[#9146FF] dark:text-[#A970FF] mt-0.5 truncate">
                  {twitchState.game || 'Just Chatting'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                <p className="text-[10px] font-mono uppercase text-slate-400">Fin de Live Discord</p>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Auto-Replay Actif ✓
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. LES 6 KPIS STRATÉGIQUES TWITCH (100% CERTIFIÉS GRAPHQL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1 : Followers */}
        <div className="bg-white dark:bg-[#111827]/80 p-5 rounded-[22px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
              Followers Twitch
              <SectionInfoTooltip
                title="Abonnés (Followers) Twitch"
                definition="Nombre total de membres inscrits qui suivent votre chaîne officielle karam_drm."
                utility="Mesurer la croissance de votre communauté sur Twitch au fil de vos sessions de live-coding."
              />
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#9146FF]/10 text-[#9146FF] dark:text-[#A970FF] flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {twitchState.followers.toLocaleString('fr-FR')}
            </p>
            <p className="text-[11px] text-emerald-500 font-semibold mt-1">
              Communauté active @karam_drm
            </p>
          </div>
        </div>

        {/* KPI 2 : Spectateurs En Direct */}
        <div className="bg-white dark:bg-[#111827]/80 p-5 rounded-[22px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
              Spectateurs Live
              <SectionInfoTooltip
                title="Spectateurs Simultanés"
                definition="Nombre de personnes qui regardent votre direct Twitch à cet instant précis."
                utility="Suivre l'impact immédiat de vos annonces Discord @here sur l'audience en direct."
              />
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <Radio size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {twitchState.isLive ? twitchState.viewers : 0}
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              {twitchState.isLive ? '🔴 En direct maintenant' : 'Hors ligne'}
            </p>
          </div>
        </div>

        {/* KPI 3 : VODs Archivées */}
        <div className="bg-white dark:bg-[#111827]/80 p-5 rounded-[22px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
              Lives & VODs
              <SectionInfoTooltip
                title="Catalogue de Rediffusions (VODs)"
                definition="Nombre de sessions lives complètes archivées et disponibles en replay sur votre chaîne Twitch."
                utility="Valoriser votre régularité et offrir un replay automatique aux membres Discord qui ont manqué le direct."
              />
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Video size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {twitchState.totalVideosCount}
            </p>
            <p className="text-[11px] text-indigo-400 font-semibold mt-1">
              Archives VOD publiques
            </p>
          </div>
        </div>

        {/* KPI 4 : Heures Streamées */}
        <div className="bg-white dark:bg-[#111827]/80 p-5 rounded-[22px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
              Heures Streamées
              <SectionInfoTooltip
                title="Volume Horaire de Diffusion"
                definition="Total des heures de direct cumulées sur l'ensemble de vos lives archivés."
                utility="Mesurer votre investissement en live-coding et votre progression vers le statut Twitch Affiliate."
              />
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {twitchState.totalStreamedHours}h
            </p>
            <p className="text-[11px] text-emerald-500 font-semibold mt-1">
              Sur les {twitchState.totalVideosCount} derniers lives
            </p>
          </div>
        </div>

        {/* KPI 5 : Vues Replays VOD */}
        <div className="bg-white dark:bg-[#111827]/80 p-5 rounded-[22px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
              Vues Replays VOD
              <SectionInfoTooltip
                title="Vues Cumulées sur les Rediffusions"
                definition="Nombre total de visionnages enregistrés sur vos replays VOD Twitch."
                utility="Identifier quelles sessions de création de site attirent le plus de spectateurs en rediffusion."
              />
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Eye size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {twitchState.totalVodViews.toLocaleString('fr-FR')}
            </p>
            <p className="text-[11px] text-amber-500 font-semibold mt-1">
              Audience Replay asynchrone
            </p>
          </div>
        </div>

        {/* KPI 6 : Durée Moyenne / Live */}
        <div className="bg-white dark:bg-[#111827]/80 p-5 rounded-[22px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
              Durée Moyenne
              <SectionInfoTooltip
                title="Durée Moyenne par Session Live"
                definition="Temps moyen passé en direct lors de chaque session Twitch."
                utility="Optimiser le format de vos sessions de création Webflow pour maximiser la rétention."
              />
            </span>
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatDurationSeconds((twitchState.avgStreamDurationMinutes || 0) * 60)}
            </p>
            <p className="text-[11px] text-pink-400 font-semibold mt-1">
              Format Long Live-Coding
            </p>
          </div>
        </div>
      </div>

      {/* 5. GRAPHIQUE CHRONOLOGIQUE DES LIVES TWITCH (VUES VOD & DURÉE EN MINUTES) */}
      <div className="bg-white dark:bg-[#111827]/80 rounded-[24px] p-6 lg:p-8 border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 size={19} className="text-[#9146FF]" />
                Historique de Performance des Sessions Twitch
              </h3>
              <SectionInfoTooltip
                title="Analyse Chronologique des Sessions Twitch"
                definition="Ce graphique retrace chacune de vos sessions Twitch de la plus ancienne (à gauche) à la plus récente (à droite)."
                utility="Comparer l'audience Replay et l'endurance de diffusion d'un live à l'autre."
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Données certifiées extraites en temps réel du catalogue GraphQL de <strong>karam_drm</strong>
            </p>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 self-start">
            <button
              type="button"
              onClick={() => setActiveChartMetric('views')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                activeChartMetric === 'views'
                  ? 'bg-[#9146FF] text-white shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Vues Replay VOD
            </button>
            <button
              type="button"
              onClick={() => setActiveChartMetric('duration')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                activeChartMetric === 'duration'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Durée du Live (min)
            </button>
          </div>
        </div>

        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTwitchViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9146FF" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#A970FF" stopOpacity={0.25} />
                </linearGradient>
                <linearGradient id="colorTwitchDuration" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#34D399" stopOpacity={0.25} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#9CA3AF" fontSize={11} />
              <YAxis
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (activeChartMetric === 'duration' ? `${val}m` : val)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#0B1329]/95 backdrop-blur-2xl border border-white/15 p-4 rounded-2xl shadow-2xl min-w-[230px] space-y-2">
                        <p className="text-white text-xs font-bold border-b border-white/10 pb-1.5">
                          {d.fullDate}
                        </p>
                        <p className="text-[11px] text-purple-300 font-semibold truncate">{d.title}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-gray-300">
                            <span>Vues VOD :</span>
                            <span className="font-bold text-white font-mono">{d.views}</span>
                          </div>
                          <div className="flex justify-between text-gray-300">
                            <span>Durée du Stream :</span>
                            <span className="font-bold text-emerald-400 font-mono">
                              {d.durationFormatted} ({d.durationMin} min)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey={activeChartMetric === 'views' ? 'views' : 'durationMin'}
                radius={[6, 6, 0, 0]}
                fill={
                  activeChartMetric === 'views'
                    ? 'url(#colorTwitchViews)'
                    : 'url(#colorTwitchDuration)'
                }
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. CATALOGUE COMPLET DES VODS & REPLAYS TWITCH */}
      <div className="bg-white dark:bg-[#111827]/80 rounded-[24px] p-6 lg:p-8 border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Video size={19} className="text-[#9146FF]" />
                Catalogue des Rediffusions & Lives Twitch ({twitchState.vods?.length || 0} VODs)
              </h3>
              <SectionInfoTooltip
                title="Catalogue des VODs Twitch"
                definition="Liste complète de vos diffusions archivées sur Twitch avec durée exacte, nombre de vues et lien direct vers le replay."
                utility="Permettre d'accéder en 1 clic à n'importe quel replay et vérifier les rediffusions envoyées en fin de live sur Discord."
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Chaque fin de live met automatiquement à jour l'alerte Discord dans{' '}
              <code>{DISCORD_ALERT_TARGET.channelName}</code> avec le lien vers votre dernière VOD.
            </p>
          </div>

          <a
            href={`${CREATOR_LIVE_ACCOUNTS.twitch.profileUrl}/videos`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#9146FF] dark:text-[#A970FF] hover:underline flex items-center gap-1"
          >
            <span>Voir toutes les vidéos sur Twitch</span>
            <ExternalLink size={13} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(twitchState.vods || []).map((vod, index) => {
            const pubDate = vod.publishedAt
              ? new Date(vod.publishedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : 'Récent';

            return (
              <div
                key={vod.id || index}
                className="group rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 overflow-hidden flex flex-col justify-between hover:border-[#9146FF]/50 transition-all duration-300 shadow-sm hover:shadow-xl"
              >
                <div>
                  <div className="relative aspect-video bg-slate-900 overflow-hidden">
                    <img
                      src={vod.thumbnailUrl || twitchState.previewImageUrl}
                      alt={vod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#9146FF] text-white shadow">
                      {index === 0 && twitchState.isLive ? '🔴 EN COURS' : `VOD #${twitchState.vods.length - index}`}
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/80 text-white">
                      ⏱️ {vod.durationFormatted}
                    </span>
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/70 text-emerald-300 flex items-center gap-1">
                      <Eye size={11} /> {vod.views} vues
                    </span>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{pubDate}</span>
                      <span className="text-[#9146FF] dark:text-[#A970FF] font-semibold">
                        {vod.game || 'Just Chatting'}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                      {vod.title}
                    </h4>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-1">
                  <a
                    href={vod.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-[#9146FF]/10 hover:bg-[#9146FF] text-[#9146FF] dark:text-[#A970FF] hover:text-white text-xs font-black transition-all flex items-center justify-center gap-2"
                  >
                    <Play size={13} />
                    <span>🟣 CLIQUER ICI : VOIR LE REPLAY VOD ↗</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
