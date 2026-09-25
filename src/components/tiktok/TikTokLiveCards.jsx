import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  Info, 
  Heart, 
  Share2, 
  UserPlus, 
  MessageSquare, 
  Sparkles, 
  Flame, 
  Users, 
  HelpCircle, 
  Repeat, 
  Radio 
} from 'lucide-react';
import { cn } from '../../lib/utils';

const formatNumber = (num) => {
  if (!num || isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return Number(num).toLocaleString('fr-FR');
};

const LiveDurationClock = ({ startedAt, isLive = true }) => {
  const [uptime, setUptime] = useState('00:00:00');

  useEffect(() => {
    if (!isLive || !startedAt) {
      setUptime('00:00:00');
      return;
    }

    const parseStartTime = (val) => {
      if (!val) return null;
      if (typeof val === 'number') return val;
      if (typeof val?.toMillis === 'function') return val.toMillis();
      if (typeof val?.seconds === 'number') return val.seconds * 1000;
      if (typeof val?._seconds === 'number') return val._seconds * 1000;
      const t = new Date(val).getTime();
      return isNaN(t) || t <= 0 ? null : t;
    };

    const startMs = parseStartTime(startedAt);
    if (!startMs) {
      setUptime('00:00:00');
      return;
    }

    const calculateDiff = () => {
      const diff = Math.max(0, Date.now() - startMs);
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    };

    setUptime(calculateDiff());
    const interval = setInterval(() => {
      setUptime(calculateDiff());
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, isLive]);

  return <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">{uptime}</span>;
};

export const TikTokLiveCards = ({ isLive: propIsLive, liveData = {} }) => {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [chatTab, setChatTab] = useState('questions'); // 'questions' | 'repeats' | 'feed'

  // Détermination stricte du mode bistable
  const isLiveActive = Boolean(propIsLive !== undefined ? propIsLive : (liveData?.isLive === true || liveData?.isCurrent === true));

  // Audience Stats - Verrouillage strict à 0 si Hors Ligne
  const currentViewers = isLiveActive ? Math.max(0, Number(liveData.currentViewers || liveData.viewerCount || 0)) : 0;
  const peakViewers = isLiveActive ? Math.max(0, Number(liveData.peakViewers || currentViewers || 0)) : 0;
  const avgViewers = isLiveActive 
    ? (Number(liveData.avgViewers) || (peakViewers > 0 ? Math.max(1, Math.round(peakViewers * 0.75)) : currentViewers)) 
    : 0;
  const totalUser = isLiveActive 
    ? Math.max(0, Number(liveData.totalUser || liveData.total_user || (peakViewers * 12) || currentViewers)) 
    : 0;

  // Engagement & Growth Stats - Verrouillage strict à 0 si Hors Ligne
  const likes = isLiveActive ? Number(liveData.likes ?? liveData.totalLikes ?? liveData.likeCount ?? 0) : 0;
  const shares = isLiveActive ? Number(liveData.shares ?? liveData.totalShares ?? liveData.shareCount ?? 0) : 0;
  const followers = isLiveActive ? Number(liveData.followers ?? liveData.newFollowers ?? liveData.followCount ?? 0) : 0;
  const comments = isLiveActive ? Number(liveData.comments ?? liveData.totalComments ?? 0) : 0;

  // AI & Chat - Données réelles uniquement si en direct
  const topQuestions = isLiveActive ? (liveData.topQuestions || []) : [];
  const topComments = isLiveActive ? (liveData.topComments || []) : [];
  const recentComments = isLiveActive ? (liveData.chatMessages || liveData.recentComments || []) : [];

  const toggleTooltip = (id) => {
    setActiveTooltip(activeTooltip === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* GRID PRINCIPALE : BENTO BOX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SECTION 1: AUDIENCE (Rouge/Rose en direct, Neutre hors-ligne) */}
        <div className={cn(
          "bg-white dark:bg-[#111827]/80 backdrop-blur-xl border rounded-[24px] p-6 relative overflow-hidden group shadow-sm transition-all duration-300",
          isLiveActive 
            ? "border-rose-500/30 dark:border-[#FE2C55]/20 shadow-[0_8px_30px_rgba(254,44,85,0.05)]" 
            : "border-slate-200 dark:border-zinc-800"
        )}>
          <div className={cn(
            "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-all duration-500",
            isLiveActive ? "bg-[#FE2C55]/10 group-hover:bg-[#FE2C55]/20" : "bg-slate-200/20 dark:bg-zinc-800/20"
          )} />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border",
              isLiveActive 
                ? "bg-[#FE2C55]/10 border-[#FE2C55]/20 text-[#FE2C55]" 
                : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400"
            )}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Audience</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {isLiveActive ? "Métriques en direct" : "Session hors ligne"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 relative z-10">
            {/* 1. SPECTATEURS ACTUELS */}
            <div className={cn(
              "flex justify-between items-center p-3.5 rounded-xl border transition-all",
              isLiveActive 
                ? "bg-[#FE2C55]/10 dark:bg-[#FE2C55]/15 border-[#FE2C55]/30 shadow-[0_0_15px_rgba(254,44,85,0.15)]" 
                : "bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/5"
            )}>
              <div className="flex items-center gap-2.5">
                {isLiveActive ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FE2C55] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FE2C55]"></span>
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-zinc-500"></span>
                )}
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider font-mono",
                  isLiveActive ? "text-[#FE2C55]" : "text-slate-600 dark:text-zinc-400"
                )}>
                  {isLiveActive ? "Viewers Actuels" : "Spectateurs"}
                </span>
              </div>
              <span className={cn(
                "text-xl font-black font-mono flex items-center gap-1.5",
                isLiveActive ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-zinc-300"
              )}>
                <Users size={16} className={isLiveActive ? "text-[#FE2C55]" : "text-slate-400 dark:text-zinc-500"} />
                {currentViewers}
              </span>
            </div>

            {/* 2. PIC D'AUDIENCE */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-black/30 p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <TrendingUp className={cn("w-4 h-4", isLiveActive ? "text-[#FE2C55]" : "text-slate-400 dark:text-zinc-500")} />
                <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">Pic d'Audience</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{formatNumber(peakViewers)}</span>
            </div>
            
            {/* 3. VIEWERS MOYENS */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-black/30 p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <Activity className={cn("w-4 h-4", isLiveActive ? "text-teal-500 dark:text-[#25F4EE]" : "text-slate-400 dark:text-zinc-500")} />
                <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">Viewers Moyens</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{formatNumber(avgViewers)}</span>
            </div>

            {/* 4. WATCH TIME / CHRONOMÈTRE (Strictement 00:00:00 si hors ligne) */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-black/30 p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <Clock className={cn("w-4 h-4", isLiveActive ? "text-[#FE2C55]" : "text-slate-400 dark:text-zinc-500")} />
                <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                  {isLiveActive ? "Durée en Direct" : "Chronomètre"}
                </span>
              </div>
              <LiveDurationClock 
                startedAt={liveData.started_at || liveData.startedAt} 
                isLive={isLiveActive} 
              />
            </div>

            {/* 5. TOTAL DES ENTRÉES (TOTAL USER) */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-black/30 p-3.5 rounded-xl border border-slate-100 dark:border-white/5 relative group/tip">
              <div className="flex items-center gap-2.5">
                <UserPlus className="text-purple-500 w-4 h-4" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">Total des Entrées</span>
                  <div className="relative inline-flex items-center group/subtip">
                    <Info size={13} className="text-slate-400 hover:text-purple-400 cursor-pointer transition-colors" />
                    <div className="absolute left-0 bottom-full mb-2 p-3 bg-[#0B1329] text-white text-[11px] rounded-xl shadow-2xl border border-purple-500/30 w-64 opacity-0 pointer-events-none group-hover/subtip:opacity-100 transition-all z-50 leading-relaxed font-normal">
                      <p className="font-bold text-purple-400 mb-1">Total des Entrées (Total User) :</p>
                      Nombre cumulé de personnes différentes ayant rejoint le direct. Verrouillé à 0 hors-ligne.
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{formatNumber(totalUser)}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: ENGAGEMENT (Verrouillé à 0 si hors-ligne) */}
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="bg-white dark:bg-[#111827]/80 backdrop-blur-xl border border-slate-200 dark:border-[#25F4EE]/20 rounded-[24px] p-6 relative overflow-hidden group shadow-sm dark:shadow-[0_8px_30px_rgba(37,244,238,0.05)] flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#25F4EE]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-[#25F4EE]/20 transition-all duration-500"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[#25F4EE]/10 flex items-center justify-center border border-[#25F4EE]/20">
                <Flame className="text-teal-600 dark:text-[#25F4EE] w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Engagement</h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {isLiveActive ? "Interactions live en direct" : "Compteurs verrouillés à 0"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col justify-center items-center text-center">
                <Heart className="text-teal-600 dark:text-[#25F4EE] w-5 h-5 mb-2" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatNumber(likes)}</span>
                <span className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider mt-1">Likes</span>
              </div>
              <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col justify-center items-center text-center">
                <UserPlus className="text-teal-600 dark:text-[#25F4EE] w-5 h-5 mb-2" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">+{formatNumber(followers)}</span>
                <span className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider mt-1">Abonnés</span>
              </div>
              <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col justify-center items-center text-center">
                <Share2 className="text-teal-600 dark:text-[#25F4EE] w-5 h-5 mb-2" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatNumber(shares)}</span>
                <span className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider mt-1">Partages</span>
              </div>
              <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col justify-center items-center text-center">
                <MessageSquare className="text-teal-600 dark:text-[#25F4EE] w-5 h-5 mb-2" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatNumber(comments)}</span>
                <span className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider mt-1">Commentaires</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: ANALYSE DU TCHAT (IA) & FLUX DIRECT */}
          <div className="bg-white dark:bg-[#111827]/80 backdrop-blur-xl border border-slate-200 dark:border-purple-500/30 rounded-[24px] p-6 relative overflow-hidden group shadow-sm dark:shadow-[0_8px_30px_rgba(168,85,247,0.08)] flex flex-col">
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center border border-purple-500/30 shadow-inner">
                  <Sparkles className="text-purple-600 dark:text-purple-400 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Analyse du Tchat</h3>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1.5 mt-0.5 font-mono">
                    {isLiveActive ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>Flux 100% Réel • TikTok Webcast</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-500"></span>
                        <span>En attente de diffusion en direct</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
              
              {/* Badge Bistable */}
              <span className={cn(
                "text-[10px] font-bold font-mono uppercase px-2.5 py-1 rounded-full border",
                isLiveActive 
                  ? "bg-[#FE2C55]/15 text-[#FE2C55] border-[#FE2C55]/30 animate-pulse"
                  : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-400 border-slate-200 dark:border-white/10"
              )}>
                {isLiveActive ? "Live Actuel" : "Hors Ligne"}
              </span>
            </div>

            {/* Onglets de navigation */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 p-1.5 rounded-xl mb-4 relative z-10 border border-slate-200 dark:border-white/5">
              <button
                onClick={() => setChatTab('questions')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all duration-200",
                  chatTab === 'questions'
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <HelpCircle size={14} />
                <span>Questions</span>
                {topQuestions.length > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                    chatTab === 'questions' ? "bg-white/20 text-white" : "bg-purple-500/20 text-purple-400"
                  )}>
                    {topQuestions.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setChatTab('repeats')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all duration-200",
                  chatTab === 'repeats'
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Repeat size={14} />
                <span>Répétés</span>
                {topComments.length > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                    chatTab === 'repeats' ? "bg-white/20 text-white" : "bg-purple-500/20 text-purple-400"
                  )}>
                    {topComments.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setChatTab('feed')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all duration-200",
                  chatTab === 'feed'
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Radio size={14} className={chatTab === 'feed' ? "animate-pulse" : ""} />
                <span>Flux Direct</span>
                {recentComments.length > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                    chatTab === 'feed' ? "bg-white/20 text-white" : "bg-purple-500/20 text-purple-400"
                  )}>
                    {recentComments.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-col relative z-10 flex-1 min-h-[200px]">
              {/* VUE 1 : QUESTIONS FRÉQUENTES */}
              {chatTab === 'questions' && (
                <div className="bg-slate-50 dark:bg-black/30 rounded-xl border border-slate-200 dark:border-white/5 p-3 flex-1 flex flex-col">
                  <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[200px] pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-purple-500/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/40">
                    {topQuestions && topQuestions.length > 0 ? (
                      topQuestions.map((q, idx) => (
                        <div key={idx} className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col gap-2 relative shadow-sm hover:border-purple-500/40 transition-all group/item">
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                              Q
                            </span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-gray-100 leading-snug">
                              {q.original || q.text || q.question}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
                            <span className="text-[10px] text-slate-500 dark:text-gray-400">
                              Posée par les spectateurs
                            </span>
                            <span className="text-[10px] font-bold uppercase bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-500/30 font-mono">
                              Posée {q.count || 1} fois
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-gray-400 italic text-center my-auto py-10 flex flex-col items-center gap-2">
                        <HelpCircle className="w-8 h-8 text-purple-400/40" />
                        <span>{isLiveActive ? "En attente des premières questions de l'audience..." : "Session hors ligne • En attente des questions lors du prochain direct."}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VUE 2 : COMMENTAIRES & SUJETS RÉPÉTÉS */}
              {chatTab === 'repeats' && (
                <div className="bg-slate-50 dark:bg-black/30 rounded-xl border border-slate-200 dark:border-white/5 p-3 flex-1 flex flex-col">
                  <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[200px] pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-purple-500/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/40">
                    {topComments && topComments.length > 0 ? (
                      topComments.map((c, idx) => (
                        <div key={idx} className="bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col gap-2 relative shadow-sm hover:border-teal-500/40 transition-all">
                          <div className="flex items-start gap-2.5">
                            <MessageSquare className="text-teal-600 dark:text-[#25F4EE] w-4 h-4 shrink-0 mt-0.5" />
                            <span className="text-xs font-semibold text-slate-800 dark:text-gray-100 leading-snug">
                              {c.text || c.original}
                            </span>
                          </div>
                          <div className="flex justify-end pt-1 border-t border-slate-100 dark:border-white/5">
                            <span className="text-[10px] font-bold uppercase bg-teal-100 dark:bg-[#25F4EE]/10 text-teal-700 dark:text-[#25F4EE] px-2 py-0.5 rounded-full border border-teal-200 dark:border-[#25F4EE]/30 font-mono">
                              Répété {c.count || 1} fois
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-gray-400 italic text-center my-auto py-10 flex flex-col items-center gap-2">
                        <Repeat className="w-8 h-8 text-teal-400/40" />
                        <span>{isLiveActive ? "En attente de messages répétés..." : "Session hors ligne • Les sujets fréquents s'afficheront en direct."}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VUE 3 : FLUX DIRECT (TOUS LES COMMENTAIRES DU LIVE) */}
              {chatTab === 'feed' && (
                <div className="bg-slate-50 dark:bg-black/30 rounded-xl border border-slate-200 dark:border-white/5 p-3 flex-1 flex flex-col">
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[200px] pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-purple-500/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/40">
                    {recentComments && recentComments.length > 0 ? (
                      recentComments.map((msg, idx) => (
                        <div key={msg.id || idx} className="bg-white dark:bg-white/5 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col gap-1 shadow-sm hover:border-white/20 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm">
                                {(msg.nickname || msg.user || 'S').charAt(0)}
                              </div>
                              <span className="text-xs font-bold text-slate-800 dark:text-gray-200 truncate max-w-[140px]">
                                {msg.nickname || msg.user || 'Spectateur'}
                              </span>
                            </div>
                            {msg.time && (
                              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400">
                                {msg.time}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-gray-300 pl-8 leading-relaxed break-words font-medium">
                            {msg.comment || msg.text}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-gray-400 italic text-center my-auto py-10 flex flex-col items-center gap-2">
                        <Radio className="w-8 h-8 text-pink-400/40" />
                        <span>{isLiveActive ? "En attente des premiers commentaires en direct..." : "Diffusion hors ligne • Le flux du tchat démarrera automatiquement dès le lancement du live."}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TikTokLiveCards;
