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

  const renderTooltip = (id, title, explanation, source, align = 'center') => {
    let positionClass = "left-1/2 -translate-x-1/2";
    if (align === 'left') positionClass = "right-0 md:right-auto md:left-0";
    if (align === 'right') positionClass = "right-0";

    return (
      <div className="absolute top-4 right-4 z-50">
        <button
          type="button"
          className="relative group/tooltip cursor-help p-1 text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setMobileModal({ title, explanation, source });
          }}
          aria-label={`Informations : ${title}`}
        >
          <Info size={16} />

          {/* Desktop Hover Tooltip (survol souris pur, orienté vers le haut, aucun clic requis) */}
          <div className={`hidden md:block absolute ${positionClass} bottom-full mb-2 w-64 p-3.5 bg-gray-900/98 dark:bg-black/98 border border-gray-700/80 dark:border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-xs text-left z-[100] pointer-events-none`}>
            <p className="font-bold mb-1.5 text-white text-[13px]">{title}</p>
            <p className="text-gray-300 dark:text-gray-300 leading-relaxed mb-2.5 text-xs">
              <span className="block font-semibold text-gray-400 dark:text-gray-400 mb-0.5">Ce que mesure ce chiffre :</span>
              {explanation}
            </p>
            {source && (
              <div className="bg-black/50 p-2 rounded-lg border border-white/5 text-[11px]">
                <span className="font-semibold text-gray-400 block mb-0.5">Origine de la donnée :</span>
                <span className="text-gray-300 italic">{source}</span>
              </div>
            )}
          </div>
        </button>
      </div>
    );
  };

  const cardStyle = "bg-white dark:bg-[#111827]/80 backdrop-blur-xl p-5 flex flex-col justify-between rounded-[24px] border border-slate-200 dark:border-[#1F2937] hover:border-slate-300 dark:hover:border-gray-600 transition-all duration-300 relative group hover:z-50 overflow-visible shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-sm";
  const iconStyle = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border";

  return (
    <div className="w-full relative z-10 hover:z-50 transition-all">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
        
        {/* Total Vidéos */}
        <div className={cardStyle}>
          {renderTooltip('total_videos', 'Total Vidéos', 'Le nombre total de vidéos actuellement publiées sur votre compte.', 'Récupéré en direct depuis l\'API officielle TikTok.', 'left')}
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className={cn(iconStyle, "bg-blue-500/10 border-blue-500/20")}>
              <Video className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-[13px] font-semibold text-slate-600 dark:text-gray-400 mb-1 uppercase tracking-wider">Vidéos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate" title={totalVideos}>{totalVideos}</p>
          </div>
        </div>

        {/* Vues Totales */}
        <div className={cardStyle}>
          {renderTooltip('vues', 'Vues Totales', 'Le cumul de toutes les vues générées par l\'ensemble de vos vidéos.', 'Récupéré en direct depuis l\'API officielle TikTok.', 'left')}
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className={cn(iconStyle, "bg-[#25F4EE]/10 border-[#25F4EE]/20")}>
              <Eye className="text-teal-700 dark:text-[#25F4EE]" size={20} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-[13px] font-semibold text-slate-600 dark:text-gray-400 mb-1 uppercase tracking-wider">Vues</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate" title={tiktokData.views}>{formatNumber(tiktokData.views)}</p>
          </div>
        </div>

        {/* Total Abonnés */}
        <div className={cardStyle}>
          {renderTooltip('abonnes', 'Total Abonnés', 'Le nombre de personnes abonnées à votre compte.', 'Récupéré en direct depuis l\'API officielle TikTok.', 'center')}
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className={cn(iconStyle, "bg-orange-500/10 border-orange-500/20")}>
              <Users className="text-orange-400" size={20} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-[13px] font-semibold text-slate-600 dark:text-gray-400 mb-1 uppercase tracking-wider">Abonnés</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate" title={tiktokData.followers}>{formatNumber(tiktokData.followers)}</p>
          </div>
        </div>

        {/* Total Likes */}
        <div className={cardStyle}>
          {renderTooltip('likes', 'Total Likes', 'Le nombre total de "J\'aime" reçus sur l\'ensemble de vos vidéos.', 'Récupéré en direct depuis l\'API officielle TikTok.', 'right')}
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className={cn(iconStyle, "bg-[#FE2C55]/10 border-[#FE2C55]/20")}>
              <ThumbsUp className="text-[#FE2C55]" size={20} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-[13px] font-semibold text-slate-600 dark:text-gray-400 mb-1 uppercase tracking-wider">Likes</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate" title={tiktokData.likes || tiktokData.totalLikes}>{formatNumber(tiktokData.likes || tiktokData.totalLikes)}</p>
          </div>
        </div>

        {/* Partages */}
        <div className={cardStyle}>
          {renderTooltip('partages', 'Partages', 'Le nombre de fois que l\'ensemble de vos vidéos ont été partagées.', 'Récupéré en direct depuis l\'API officielle TikTok.', 'right')}
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className={cn(iconStyle, "bg-green-500/10 border-green-500/20")}>
              <Share2 className="text-green-400" size={20} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-[13px] font-semibold text-slate-600 dark:text-gray-400 mb-1 uppercase tracking-wider">Partages</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate" title={tiktokData.shares || 0}>{formatNumber(tiktokData.shares || 0)}</p>
          </div>
        </div>

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
