import React, { useEffect, useState } from 'react';
import {
  Radio, Users, Heart, Sparkles, MessageSquare,
  Award, Clock, Eye, Activity, RefreshCw, AlertCircle
} from 'lucide-react';
import { useTikTokLiveSocket } from '../../hooks/useTikTokLiveSocket';
import { db } from '../../config/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '../../lib/utils';

export function TikTokLiveHub({ liveData: propLiveData, onRefresh, isRefreshing }) {
  // State 1: Active Live (from Socket)
  const socket = useTikTokLiveSocket(undefined, propLiveData);
  const isLive = socket.isSocketConnected ? socket.isLive : Boolean(propLiveData?.isLive);

  // State 2: Offline Archives (from Firestore)
  const [archives, setArchives] = useState([]);
  const [loadingArchives, setLoadingArchives] = useState(false);

  useEffect(() => {
    if (!isLive) {
      const fetchArchives = async () => {
        setLoadingArchives(true);
        try {
          const archivesRef = collection(db, 'tiktok_archives');
          const q = query(archivesRef, orderBy('startedAt', 'desc'), limit(3));
          const snapshot = await getDocs(q);
          const fetchedArchives = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setArchives(fetchedArchives);
        } catch (error) {
          console.error("Error fetching TikTok archives:", error);
        } finally {
          setLoadingArchives(false);
        }
      };
      fetchArchives();
    }
  }, [isLive]);

  // Formatter for numbers
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  };

  // Safe KPI extractors
  const currentViewers = isLive ? (socket.isSocketConnected ? socket.metrics.viewers : (propLiveData?.viewers || 0)) : 0;
  const peakViewers = isLive ? (socket.isSocketConnected ? socket.metrics.peakViewers : (propLiveData?.peakViewers || 0)) : 0;
  const likes = isLive ? (socket.isSocketConnected ? socket.metrics.likes : (propLiveData?.likes || 0)) : 0;
  const commentsCount = isLive ? (socket.isSocketConnected ? socket.metrics.comments : (propLiveData?.comments || 0)) : 0;
  const duration = isLive ? (socket.isSocketConnected ? socket.metrics.durationStr : (propLiveData?.durationStr || '00:00')) : '00:00';
  const newFollowers = isLive ? (socket.isSocketConnected ? socket.metrics.newFollowers : (propLiveData?.newFollowers || 0)) : 0;
  const topQuestions = isLive ? (socket.isSocketConnected ? (socket.metrics.topQuestions || []) : (propLiveData?.topQuestions || [])) : [];
  const topContributor = isLive ? (socket.isSocketConnected ? socket.metrics.topContributor : (propLiveData?.topContributor || null)) : null;

  return (
    <div className="w-full bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 md:p-8 overflow-hidden relative shadow-2xl">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-br from-[#25F4EE]/10 via-blue-500/5 to-purple-500/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative",
            isLive
              ? "bg-gradient-to-br from-[#FE2C55]/20 to-rose-900/40 border border-[#FE2C55]/50 animate-pulse-slow"
              : "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
          )}>
            {isLive && <div className="absolute -inset-1 bg-[#FE2C55]/20 blur-md rounded-2xl animate-pulse"></div>}
            <Radio className={cn("w-7 h-7 relative z-10", isLive ? "text-[#FE2C55]" : "text-slate-400")} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              TikTok Live Hub
              {isLive ? (
                <span className="bg-[#FE2C55]/20 text-[#FE2C55] px-3 py-1 rounded-full text-[11px] font-bold border border-[#FE2C55]/30 tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FE2C55]"></span>
                  EN DIRECT
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-[11px] font-bold border border-slate-700 tracking-widest uppercase">
                  HORS LIGNE
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
              {isLive
                ? "Analyse en temps réel de votre diffusion en cours."
                : "Consultez l'historique et les performances de vos derniers lives."}
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Actualiser
        </button>
      </div>

      {/* Main Content - Bento Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {isLive ? (
          // --- ACTIVE LIVE STATE ---
          <>
            {/* Primary KPI: Audience & Engagement (Left, span 8) */}
            <div className="col-span-1 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">

              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-[#25F4EE]/30 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#25F4EE]/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#25F4EE]" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-300">Audience en Direct</h3>
                </div>
                <div className="flex items-end gap-4">
                  <div className="text-5xl font-black text-white">{formatNumber(currentViewers)}</div>
                  <div className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                    Pic: <span className="text-white font-medium">{formatNumber(peakViewers)}</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#25F4EE] to-transparent opacity-50"></div>
              </div>

              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-[#FE2C55]/30 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#FE2C55]/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-[#FE2C55]" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-300">Engagement & Likes</h3>
                </div>
                <div className="flex items-end gap-4">
                  <div className="text-5xl font-black text-white">{formatNumber(likes)}</div>
                  <div className="text-sm text-emerald-400 mb-1 font-medium flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    +{(likes / (Math.max(1, currentViewers))).toFixed(1)} / spectateur
                  </div>
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2 grid grid-cols-3 gap-6">
                 <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                    <div className="text-slate-400 text-xs font-semibold mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-purple-400"/> Durée</div>
                    <div className="text-2xl font-bold text-white">{duration}</div>
                 </div>
                 <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                    <div className="text-slate-400 text-xs font-semibold mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-400"/> Messages</div>
                    <div className="text-2xl font-bold text-white">{formatNumber(commentsCount)}</div>
                 </div>
                 <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                    <div className="text-slate-400 text-xs font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400"/> Nv. Abonnés</div>
                    <div className="text-2xl font-bold text-white">{formatNumber(newFollowers)}</div>
                 </div>
              </div>
            </div>

            {/* Smart Features: Chat & Contributor (Right, span 4) */}
            <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
              {/* Top Contributor */}
              <div className="bg-gradient-to-b from-amber-500/10 to-slate-900/50 border border-amber-500/20 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-semibold text-amber-400">Top Contributeur</h3>
                </div>
                {topContributor ? (
                  <div className="flex items-center gap-4">
                    <img src={topContributor.avatarUrl || '/api/placeholder/48/48'} alt={topContributor.nickname} className="w-12 h-12 rounded-full border-2 border-amber-400/50" />
                    <div>
                      <div className="font-bold text-white">{topContributor.nickname}</div>
                      <div className="text-xs text-amber-400/80 mt-0.5">{topContributor.coins} pièces</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic">En attente de contributeurs...</div>
                )}
              </div>

              {/* Chat Insights */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 flex-1 min-h-[160px]">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-semibold text-slate-300">Questions Fréquentes</h3>
                </div>
                {topQuestions.length > 0 ? (
                  <ul className="space-y-3">
                    {topQuestions.map((q, i) => (
                      <li key={i} className="text-sm text-slate-300 bg-white/5 rounded-lg p-2.5 line-clamp-2">
                        "{q}"
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-slate-500 italic pb-8">
                    Le chat est analysé en temps réel...
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // --- OFFLINE STATE (Archives) ---
          <div className="col-span-1 lg:col-span-12">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Dernières Archives</h3>
              {archives.length > 0 && (
                <div className="text-sm text-slate-400">Les 3 derniers lives enregistrés</div>
              )}
            </div>

            {loadingArchives ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Chargement des archives...
              </div>
            ) : archives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {archives.map((archive, idx) => (
                  <div key={archive.id || idx} className="bg-slate-900/50 border border-white/5 hover:border-slate-700 transition-all rounded-2xl p-6 group">
                    <div className="text-xs font-bold text-slate-500 mb-4 bg-slate-800/50 inline-block px-3 py-1 rounded-full">
                      {new Date(archive.startedAt || archive.started_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Eye className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium">Vues totales</span>
                        </div>
                        <span className="font-bold text-white">{formatNumber(archive.views || archive.totalViews || 0)}</span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Users className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-medium">Nv. Abonnés</span>
                        </div>
                        <span className="font-bold text-white">{formatNumber(archive.newFollowers || archive.followers || 0)}</span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Heart className="w-4 h-4 text-rose-400" />
                          <span className="text-sm font-medium">Likes</span>
                        </div>
                        <span className="font-bold text-white">{formatNumber(archive.likes || archive.totalLikes || 0)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium">Durée</span>
                        </div>
                        <span className="font-bold text-white">{archive.durationStr || archive.duration || '00:00'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-white/5 border-dashed rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                  <Radio className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Aucune archive disponible</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Vos prochains lives apparaîtront ici une fois terminés et enregistrés dans la base de données.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TikTokLiveHub;
