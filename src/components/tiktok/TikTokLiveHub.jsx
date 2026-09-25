import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Users, 
  Heart, 
  Sparkles, 
  MessageSquare, 
  RefreshCw, 
  Sliders, 
  Award, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

const MOCK_LIVE_DATA = {
  creator: '@karam.drame',
  title: 'Masterclass Audit & Stratégie Growth Analytics',
  status: 'live',
  startedAt: '19:30',
  duration: '42m 15s',
  kpis: {
    viewers: 1420,
    peakViewers: 1890,
    totalLikes: 48600,
    likesPerMinute: 850,
    newFollowers: 312,
    diamonds: 8950
  },
  audienceTimeline: [
    { time: '19:30', viewers: 350 },
    { time: '19:40', viewers: 820 },
    { time: '19:50', viewers: 1240 },
    { time: '20:00', viewers: 1890 },
    { time: '20:10', viewers: 1420 }
  ],
  recentChat: [
    { id: 1, user: 'Sophie_Audit', comment: 'Excellente explication sur les ratios de rentabilité !', badge: 'Membre VIP' },
    { id: 2, user: 'Karim_Tech', comment: 'Tu utilises quel outil pour automatiser les calculs ?', badge: '' },
    { id: 3, user: 'Alex_Growth', comment: 'Je viens de m abonner ! Merci pour le live.', badge: 'Nouveau' },
    { id: 4, user: 'Lina_Design', comment: 'La grille Bento est super propre visuellement.', badge: 'Top Donateur' }
  ],
  topDonators: [
    { rank: 1, user: 'Lina_Design', diamonds: 3500, gift: 'Lion TikTok' },
    { rank: 2, user: 'Marc_Finance', diamonds: 2100, gift: 'Fusée Galactique' },
    { rank: 3, user: 'Yanis_Pro', diamonds: 1450, gift: 'Couronne Royale' }
  ],
  growthTips: [
    'Moment opportun pour lancer le CTA d inscription à la newsletter.',
    'Le taux d engagement a dépassé 8.4 % lors de la démonstration en direct.',
    'Pic de chat détecté : activez le mode Q&A pour maintenir la rétention.'
  ]
};

export default function TikTokLiveHub({ liveStreamData = null }) {
  const [useSimulation, setUseSimulation] = useState(!liveStreamData?.isLive);
  const [data, setData] = useState(MOCK_LIVE_DATA);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (liveStreamData && liveStreamData.isLive && !useSimulation) {
      setData(liveStreamData);
    } else {
      setData(MOCK_LIVE_DATA);
    }
  }, [liveStreamData, useSimulation]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="space-y-6 w-full text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Radio className={`w-6 h-6 ${data.status === 'live' ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
            {data.status === 'live' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-wide">TikTok Live Hub — Bento Grid</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {data.creator}
              </span>
            </div>
            <p className="text-xs text-slate-400">Supervision en direct et télémétrie de diffusion</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setUseSimulation(!useSimulation)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              useSimulation 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-sm'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{useSimulation ? 'Mode Simulation V1' : 'Flux API Temps Réel'}</span>
          </button>

          <button
            onClick={handleManualRefresh}
            title="Rafraîchir les métriques"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        
        <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Radio className="w-32 h-32 text-red-500" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>EN DIRECT</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Durée : {data.duration}</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-white leading-tight mb-2">{data.title}</h3>
          <p className="text-xs text-slate-400">Diffusion ciblée : France, Suisse, Belgique • Algorithme For You actif</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Audience Direct</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-white font-mono">{data.kpis.viewers.toLocaleString()}</div>
            <div className="flex items-center space-x-1 text-xs text-cyan-400 mt-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Pic : {data.kpis.peakViewers.toLocaleString()} spectateurs</span>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-cyan-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (data.kpis.viewers / data.kpis.peakViewers) * 100)}%` }} 
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Mentions J'aime</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-white font-mono">{data.kpis.totalLikes.toLocaleString()}</div>
            <div className="text-xs text-rose-400 font-semibold mt-1">
              +{data.kpis.likesPerMinute.toLocaleString()} likes / min
            </div>
          </div>
          <div className="text-[11px] text-slate-500">Flux d'interaction en progression positive</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Abonnés Générés</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-white font-mono">+{data.kpis.newFollowers}</div>
            <div className="text-xs text-purple-400 font-semibold mt-1">
              Taux de conversion : 21.9 %
            </div>
          </div>
          <div className="text-[11px] text-slate-500">Nouveaux followers issus de la suggestion For You</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Diamants Récoltés</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-white font-mono">{data.kpis.diamonds.toLocaleString()}</div>
            <div className="text-xs text-amber-400 font-semibold mt-1">
              Équivalent direct monétisable
            </div>
          </div>
          <div className="text-[11px] text-slate-500">Distribution par 3 contributeurs majeurs</div>
        </div>

        <div className="md:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Flux du Chat en Direct</span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3" />
              <span>Modération IA Active</span>
            </div>
          </div>
          <div className="space-y-2.5 overflow-y-auto max-h-48 pr-1 font-sans">
            {data.recentChat.map((msg) => (
              <div key={msg.id} className="text-xs p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold text-indigo-300 mr-2">{msg.user} :</span>
                  <span className="text-slate-300">{msg.comment}</span>
                </div>
                {msg.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 shrink-0 font-medium">
                    {msg.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/40 border border-indigo-900/50 shadow-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">Conseils Growth en Temps Réel (Lumina AI)</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.growthTips.map((tip, index) => (
              <div key={index} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
