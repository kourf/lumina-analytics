import React, { useState } from 'react';
import { Users, Eye, ThumbsUp, Share2, Info, Video, Calendar, ShieldCheck, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

export const TikTokKpiCards = ({ tiktokData }) => {
  const [mobileModal, setMobileModal] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  if (!tiktokData) return null;

  if (tiktokData.isDataMissing) {
    return (
      <div className="w-full relative z-[60] bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8 text-red-400">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-red-500" />
          Synchronisation API TikTok : Données Manquantes
        </h3>
        <p className="text-sm opacity-90 mb-4">
          Impossible de récupérer les KPIs globaux (followers, vues, etc.). Le retour de l'API TikTok ou de la base de données (Firestore) est vide, invalide ou incomplet.
        </p>
        <div className="bg-black/40 p-4 rounded-xl font-mono text-xs border border-red-500/10 overflow-x-auto">
          <code>
            // Technical Error Context (copy to developer):<br/>
            - Followers: {tiktokData.followers === null ? 'NULL (Error)' : tiktokData.followers}<br/>
            - Total Views: {tiktokData.views === null ? 'NULL (Error)' : tiktokData.views}<br/>
            - Videos Parsed: {tiktokData.recentVideos?.length || 0}<br/>
            - Firestore Sync Path: 'users/karamokho' -&gt; 'tiktokAPI' / 'tiktok'
          </code>
        </div>
      </div>
    );
  }

  const videosList = tiktokData.recentVideos || [];
  const totalVideos = tiktokData.videoAnalytics?.totalVideosAnalyzed || videosList.length || 0;

  const cardStyle = "bg-white dark:bg-[#111827]/80 backdrop-blur-xl p-5 flex flex-col justify-between rounded-[24px] border border-slate-200 dark:border-[#1F2937] hover:border-slate-300 dark:hover:border-gray-600 transition-all duration-300 relative group overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-sm min-h-[145px]";
  const iconStyle = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border";

  const kpis = [
    {
      id: 'total_videos',
      title: 'Total Vidéos',
      label: 'Vidéos',
      value: totalVideos,
      displayValue: totalVideos,
      explanation: 'Le nombre total de vidéos actuellement publiées sur votre compte TikTok.',
      source: "API officielle TikTok",
      icon: <Video className="text-blue-600 dark:text-blue-400" size={20} />,
      iconBg: "bg-blue-500/10 border-blue-500/20",
      accentBorder: "border-blue-500/50"
    },
    {
      id: 'vues',
      title: 'Vues Totales',
      label: 'Vues',
      value: tiktokData.views,
      displayValue: formatNumber(tiktokData.views),
      explanation: "Le cumul de toutes les vues générées par l'ensemble de vos vidéos publiées.",
      source: "API officielle TikTok",
      icon: <Eye className="text-teal-700 dark:text-[#25F4EE]" size={20} />,
      iconBg: "bg-[#25F4EE]/10 border-[#25F4EE]/20",
      accentBorder: "border-[#25F4EE]/50"
    },
    {
      id: 'abonnes',
      title: 'Total Abonnés',
      label: 'Abonnés',
      value: tiktokData.followers,
      displayValue: formatNumber(tiktokData.followers),
      explanation: 'Le nombre de personnes actuellement abonnées à votre compte.',
      source: "API officielle TikTok",
      icon: <Users className="text-orange-400" size={20} />,
      iconBg: "bg-orange-500/10 border-orange-500/20",
      accentBorder: "border-orange-500/50"
    },
    {
      id: 'likes',
      title: 'Total Likes',
      label: 'Likes',
      value: tiktokData.likes || tiktokData.totalLikes,
      displayValue: formatNumber(tiktokData.likes || tiktokData.totalLikes),
      explanation: "Le cumul des mentions 'J'aime' reçues sur l'ensemble de vos vidéos.",
      source: "API officielle TikTok",
      icon: <ThumbsUp className="text-[#FE2C55]" size={20} />,
      iconBg: "bg-[#FE2C55]/10 border-[#FE2C55]/20",
      accentBorder: "border-[#FE2C55]/50"
    },
    {
      id: 'partages',
      title: 'Total Partages',
      label: 'Partages',
      value: tiktokData.shares || 0,
      displayValue: formatNumber(tiktokData.shares || 0),
      explanation: "Le nombre de fois que vos vidéos ont été partagées ou envoyées par les utilisateurs.",
      source: "API officielle TikTok",
      icon: <Share2 className="text-green-400" size={20} />,
      iconBg: "bg-green-500/10 border-green-500/20",
      accentBorder: "border-green-500/50"
    }
  ];

  return (
    <div className="w-full relative z-10 transition-all">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
        {kpis.map((kpi) => (
          <div 
            key={kpi.id} 
            className={cardStyle}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Header Carte : Icône + Bouton Info */}
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className={cn(iconStyle, kpi.iconBg)}>
                {kpi.icon}
              </div>
              <button
                type="button"
                onMouseEnter={() => setHoveredCard(kpi.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileModal(kpi);
                }}
                className="cursor-help p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                aria-label={`Informations : ${kpi.title}`}
                title="Passer la souris pour voir l'explication"
              >
                <Info size={16} />
              </button>
            </div>

            {/* Contenu Standard de la Carte */}
            <div className="relative z-10">
              <p className="text-[13px] font-semibold text-slate-600 dark:text-gray-400 mb-1 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate" title={kpi.value}>{kpi.displayValue}</p>
            </div>

            {/* Encart Pédagogique Intra-Carte au survol (Strictement confiné à la carte, 0 chevauchement, 0 débordement) */}
            {hoveredCard === kpi.id && (
              <div 
                className={cn(
                  "absolute inset-0 z-40 bg-slate-950/98 border rounded-[24px] p-4 flex flex-col justify-between shadow-2xl animate-in fade-in duration-150 text-left backdrop-blur-md",
                  kpi.accentBorder
                )}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{kpi.title}</span>
                    <span className="text-xs font-mono font-bold text-teal-400">{kpi.displayValue}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug mb-1">
                    {kpi.explanation}
                  </p>
                </div>
                <div className="text-[10px] text-gray-400 italic bg-black/60 rounded px-2 py-1 border border-white/5 truncate">
                  Source : {kpi.source}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Pédagogique Mobile (100% visible et adapté sur smartphone, aucun débordement) */}
      {mobileModal && (
        <div 
          className="fixed inset-0 z-[9999] md:hidden flex items-end justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setMobileModal(null)}
        >
          <div 
            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-white text-sm">{mobileModal.title}</h4>
              </div>
              <button 
                onClick={() => setMobileModal(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              <span className="block font-semibold text-slate-400 mb-1">Ce que mesure ce chiffre :</span>
              {mobileModal.explanation}
            </p>

            {mobileModal.source && (
              <div className="bg-black/50 p-2.5 rounded-lg border border-white/5 text-[11px]">
                <span className="font-semibold text-slate-400 block mb-0.5">Origine de la donnée :</span>
                <span className="text-slate-300 italic">{mobileModal.source}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
