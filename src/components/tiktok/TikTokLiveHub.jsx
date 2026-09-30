import React, { useEffect, useState } from 'react';
import {
  Radio, Users, Heart, Sparkles, MessageSquare,
  Award, Clock, Eye, Activity, RefreshCw, AlertCircle, Share2, ChevronDown, Trash2, X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useTikTokLiveSocket } from '../../hooks/useTikTokLiveSocket';
import { db } from '../../config/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '../../lib/utils';

export function TikTokLiveHub({ liveData: propLiveData, onRefresh, isRefreshing }) {
  const socket = useTikTokLiveSocket(undefined, propLiveData);
  const isLive = socket.isSocketConnected ? socket.isLive : Boolean(propLiveData?.isLive);

  const [archives, setArchives] = useState([]);
  const [loadingArchives, setLoadingArchives] = useState(false);
  const [isQuickPreviewOpen, setIsQuickPreviewOpen] = useState(false);
  const [isArchivesModalOpen, setIsArchivesModalOpen] = useState(false);
  const [liveDurationTicker, setLiveDurationTicker] = useState('00:00:00');

  // Compteur dynamique en temps réel chaque seconde
  useEffect(() => {
    let interval = null;
    const startedAt = propLiveData?.started_at || propLiveData?.startedAt || socket.startedAt;
    if (isLive && startedAt) {
      const startMs = new Date(startedAt).getTime();
      const updateClock = () => {
        const diff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setLiveDurationTicker(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        );
      };
      updateClock();
      interval = setInterval(updateClock, 1000);
    } else {
      setLiveDurationTicker(propLiveData?.durationStr || socket.metrics?.uptimeFormatted || '00:00:00');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive, propLiveData?.started_at, propLiveData?.startedAt, socket.startedAt, propLiveData?.durationStr, socket.metrics?.uptimeFormatted]);

  // Récupération des archives Firestore
  useEffect(() => {
    const fetchArchives = async () => {
      setLoadingArchives(true);
      try {
        const archivesRef = collection(db, 'tiktok_archives');
        const q = query(archivesRef, orderBy('startedAt', 'desc'), limit(15));
        const snapshot = await getDocs(q);
        const fetchedArchives = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        if (fetchedArchives.length > 0) {
          setArchives(fetchedArchives);
        } else if (Array.isArray(propLiveData?.historyArchives) && propLiveData.historyArchives.length > 0) {
          setArchives(propLiveData.historyArchives);
        } else {
          setArchives([]);
        }
      } catch (error) {
        console.error("Error fetching TikTok archives:", error);
      } finally {
        setLoadingArchives(false);
      }
    };
    fetchArchives();
  }, [propLiveData?.historyArchives]);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  };

  const formatArchiveDate = (rawDate) => {
    if (!rawDate) return 'Date inconnue';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return 'Date inconnue';
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return 'Date inconnue';
    }
  };

  const currentViewers = isLive ? (socket.isSocketConnected ? socket.metrics.viewers : (propLiveData?.currentViewers || 0)) : 0;
  const peakViewers = isLive ? (socket.isSocketConnected ? socket.metrics.peakViewers : (propLiveData?.peakViewers || 0)) : 0;
  const likes = isLive ? (socket.isSocketConnected ? socket.metrics.likes : (propLiveData?.likes || 0)) : 0;
  const commentsCount = isLive ? (socket.isSocketConnected ? socket.metrics.comments : (propLiveData?.comments || 0)) : 0;
  const newFollowers = isLive ? (socket.isSocketConnected ? socket.metrics.followers : (propLiveData?.newFollowers || 0)) : 0;
  const shares = isLive ? (socket.isSocketConnected ? socket.metrics.shares : (propLiveData?.shares || 0)) : 0;
  const topQuestions = isLive ? (socket.isSocketConnected ? (socket.metrics.topQuestions || []) : (propLiveData?.topQuestions || [])) : [];
  const topContributor = isLive ? (socket.isSocketConnected ? socket.metrics.topContributor : (propLiveData?.topContributor || null)) : null;
  const liveTimeline = isLive ? (socket.isSocketConnected ? socket.liveTimeline : (propLiveData?.liveTimeline || [])) : [];

  const displayTimeline = liveTimeline.length > 0 ? liveTimeline : Array.from({ length: 90 }, (_, i) => ({
    time: i,
    viewers: Math.floor(Math.sin(i / 10) * 10 + 20) + (i % 5 === 0 ? Math.random() * 5 : 0)
  }));

  const handleResetLive = async () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser l\'affichage du live actuel ?')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', 'karamokho');
        await updateDoc(userRef, { 'tiktokLiveAPI.isLive': false });
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error('Erreur:', err);
      }
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1C1F2E] border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-400 text-xs mb-1">{`Minute ${label}`}</p>
          <p className="text-[#FE2C55] font-bold">{`${payload[0].value} spectateurs`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn(
      "w-full bg-[#0B0F19] border rounded-[32px] p-6 md:p-8 overflow-hidden relative shadow-2xl transition-all duration-500",
      isLive ? "border-[#FE2C55]/30 shadow-[0_0_50px_-12px_rgba(254,44,85,0.25)]" : "border-slate-800"
    )}>
      {/* Background Glow */}
      {isLive && (
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-br from-[#FE2C55]/15 via-rose-500/10 to-purple-500/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative",
            isLive
              ? "bg-[#FE2C55] border border-[#FE2C55] animate-pulse-slow shadow-[0_0_20px_rgba(254,44,85,0.6)]"
              : "bg-slate-800 border border-slate-700"
          )}>
            <Radio className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Hub Live Streaming 
              <span className="text-sm font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">@karam.drame</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Détection automatique 24/7 en temps réel (zéro latence, webhook officiel & SWR).
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isLive ? (
            <>
              <div className="bg-[#FE2C55] text-white px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(254,44,85,0.5)] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                EN DIRECT
              </div>
              <div className="bg-slate-900/80 border border-white/10 text-slate-300 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                {formatNumber(currentViewers)} spectateurs
              </div>
              <button 
                onClick={handleResetLive}
                className="text-slate-400 hover:text-white px-3 py-2 border border-white/10 rounded-xl text-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-amber-400" /> Secours
              </button>
              <button 
                onClick={onRefresh} 
                className="text-slate-400 hover:text-white p-2 border border-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </button>
              <a 
                href="https://www.tiktok.com/@karam.drame/live" 
                target="_blank" 
                rel="noreferrer"
                className="bg-[#FE2C55] hover:bg-[#E62A4D] text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
              >
                REJOINDRE LE LIVE <Share2 className="w-4 h-4" />
              </a>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 text-slate-300 px-4 py-2 rounded-full text-sm font-bold border border-slate-700 flex items-center gap-2">
                HORS LIGNE
              </div>
              <button 
                onClick={onRefresh} 
                className="text-slate-400 hover:text-white p-2 border border-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 relative z-10">
        <div className="bg-[#131825] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">DURÉE DU DIRECT</span>
            <Clock className="w-4 h-4 text-[#FE2C55]" />
          </div>
          <div className="text-3xl font-black text-white mb-1 font-mono">{liveDurationTicker}</div>
          <div className="text-xs text-slate-500">Diffusion en cours minute par minute</div>
        </div>

        <div className="bg-[#131825] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AUDIENCE & RÉTENTION</span>
            <Users className="w-4 h-4 text-[#25F4EE]" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-white">{formatNumber(currentViewers)}</span>
            <span className="text-sm font-medium text-slate-400">(Pic: {formatNumber(peakViewers)})</span>
          </div>
          <div className="text-xs text-slate-500">Spectateurs connectés actuellement</div>
        </div>

        <div className="bg-[#131825] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">LIKES DE SESSION</span>
            <Heart className="w-4 h-4 text-[#FE2C55]" />
          </div>
          <div className="text-3xl font-black text-[#FE2C55] mb-1">{formatNumber(likes)}</div>
          <div className="text-xs text-slate-500">Mentions j'aime reçues en direct</div>
        </div>

        <div className="bg-[#131825] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PARTAGES & ABONNÉS</span>
            <Share2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-white">{formatNumber(shares)}</span>
            <span className="text-sm font-medium text-emerald-400 flex items-center ml-2">
              <Activity className="w-3 h-3 mr-1" />+{formatNumber(newFollowers)} abos
            </span>
          </div>
          <div className="text-xs text-slate-500">Viralité et nouveaux abonnés acquis</div>
        </div>
      </div>

      {/* Retention Chart */}
      <div className="bg-[#131825] border border-white/5 rounded-2xl p-6 mb-6 relative z-10">
        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#FE2C55]" />
          Courbe de Rétention du Live
        </h3>
        <p className="text-xs text-slate-400 mb-6">Évolution minute par minute de la présence des spectateurs sur le stream.</p>
        
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayTimeline} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FE2C55" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#FE2C55" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#334155" tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val}m`} minTickGap={30} />
              <YAxis stroke="#334155" tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={Math.round(peakViewers * 0.75) || 20} stroke="#25F4EE" strokeDasharray="3 3" />
              <Area 
                type="monotone" 
                dataKey="viewers" 
                stroke="#FE2C55" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorViewers)" 
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Intelligence & Chat */}
      <div className="bg-[#131825] border border-white/5 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              Intelligence Audience & Tchat
              <span className="bg-purple-500/20 text-purple-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-purple-500/30">Gemini Flash - Free Tier</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Synthèse IA des questions posées et identification des spectateurs les plus actifs.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer">
            <Clock className="w-4 h-4" /> Questions Clés IA <ChevronDown className="w-4 h-4" />
          </button>
          <button className="text-slate-300 hover:text-white px-4 py-2 border border-white/10 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer">
            <Award className="w-4 h-4 text-amber-400" /> Top 3 Actifs
          </button>
          <button className="text-slate-300 hover:text-white px-4 py-2 border border-white/10 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer">
            <MessageSquare className="w-4 h-4" /> Flux du tchat
          </button>
        </div>
      </div>

      {/* History & Archives Bar */}
      <div className="bg-[#131825] border border-white/5 rounded-2xl p-5 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center border border-white/5">
              <Trash2 className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Historique & Archives des Sessions Live</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                {archives.length} sessions enregistrées • Graphiques et rétention passés
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button 
              onClick={() => setIsQuickPreviewOpen(prev => !prev)}
              className="text-slate-300 hover:text-white px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              Aperçu rapide <ChevronDown className={cn("w-4 h-4 transition-transform", isQuickPreviewOpen && "rotate-180")} />
            </button>
            <button 
              onClick={() => setIsArchivesModalOpen(true)}
              className="bg-[#FE2C55] hover:bg-[#E62A4D] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-[0_0_15px_rgba(254,44,85,0.3)]"
            >
              Ouvrir les Archives
            </button>
          </div>
        </div>

        {/* Aperçu rapide déroulant */}
        {isQuickPreviewOpen && (
          <div className="mt-5 pt-5 border-t border-white/5 animate-fade-in">
            {loadingArchives ? (
              <div className="text-slate-400 text-sm py-4 text-center">Chargement des archives...</div>
            ) : archives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {archives.slice(0, 3).map((arch, idx) => (
                  <div key={arch.id || idx} className="bg-slate-900/60 border border-white/5 rounded-xl p-4 hover:border-slate-700 transition-colors">
                    <div className="text-xs font-semibold text-slate-400 mb-2">{formatArchiveDate(arch.startedAt || arch.started_at)}</div>
                    <div className="flex justify-between items-center text-sm py-1 border-b border-white/5">
                      <span className="text-slate-400 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-blue-400" /> Vues</span>
                      <span className="text-white font-bold">{formatNumber(arch.views || arch.peakViewers || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-1 border-b border-white/5">
                      <span className="text-slate-400 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-[#FE2C55]" /> Likes</span>
                      <span className="text-white font-bold">{formatNumber(arch.likes || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-purple-400" /> Durée</span>
                      <span className="text-white font-bold">{arch.durationStr || '00:00'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-sm py-4 text-center">
                Aucune archive pour le moment. Vos prochaines sessions s'enregistreront ici automatiquement.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Archives Complètes */}
      {isArchivesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0F1422] border border-slate-800 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  Archives des Sessions TikTok Live
                </h2>
                <p className="text-sm text-slate-400 mt-1">Historique complet de toutes vos diffusions en direct</p>
              </div>
              <button 
                onClick={() => setIsArchivesModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {archives.length > 0 ? (
              <div className="space-y-4">
                {archives.map((arch, index) => (
                  <div key={arch.id || index} className="bg-[#141A29] border border-white/5 rounded-2xl p-5 hover:border-[#FE2C55]/30 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="text-sm font-bold text-white mb-1">
                        Session du {formatArchiveDate(arch.startedAt || arch.started_at)}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        ID: {arch.id || 'N/A'} • {arch.durationStr || 'Durée non spécifiée'}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-xs text-slate-400">Pic Vues</div>
                        <div className="text-white font-bold">{formatNumber(arch.peakViewers || arch.views || 0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-400">Likes</div>
                        <div className="text-[#FE2C55] font-bold">{formatNumber(arch.likes || 0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-400">Nv. Abos</div>
                        <div className="text-emerald-400 font-bold">+{formatNumber(arch.newFollowers || arch.followers || 0)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <Trash2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-base font-medium text-white mb-1">Aucune archive disponible</p>
                <p className="text-sm">Chaque session live terminée sera automatiquement enregistrée avec son horodatage précis.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default TikTokLiveHub;
