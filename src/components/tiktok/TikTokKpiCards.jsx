import React, { useState, useEffect, useRef } from 'react';
import { Users, Eye, ThumbsUp, Share2, Info, Video, Calendar, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};


export const TikTokKpiCards = ({ tiktokData }) => {
  const [activePopover, setActivePopover] = useState(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setActivePopover(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverRef]);


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
  
  let avgVideosPerMonth = tiktokData.videoAnalytics?.avgVideosPerMonth || 0;
  if (videosList.length > 1 && !avgVideosPerMonth) {
     const dates = videosList.map(v => new Date(v.date).getTime()).sort((a, b) => a - b);
     const oldest = dates[0];
     const newest = dates[dates.length - 1];
     const msPerMonth = 1000 * 60 * 60 * 24 * 30.44;
     const monthsDiff = (newest - oldest) / msPerMonth;
     if (monthsDiff > 0) {
        avgVideosPerMonth = (videosList.length / monthsDiff).toFixed(1);
     }
  }


  const renderPopover = (id, title, explanation, source) => (
    <div 
      className="absolute top-4 right-4 z-50"
    >
      <button
        className="text-gray-500 hover:text-white transition-colors cursor-pointer p-1"
        onClick={(e) => {
          e.stopPropagation();
          setActivePopover(activePopover === id ? null : id);
        }}
        aria-label="Information"
      >
        <Info size={16} />
      </button>
      {activePopover === id && (
        <div ref={popoverRef} className="absolute right-0 top-6 w-64 bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md rounded-xl p-3.5 z-50 animate-in fade-in zoom-in duration-200">
          <p className="font-bold mb-2 text-white text-[13px]">{title}</p>
          <p className="mb-3 text-slate-300 leading-relaxed text-xs">
            <span className="block font-semibold text-slate-400 mb-1">Ce que mesure ce chiffre :</span>
            {explanation}
          </p>
          <div className="bg-black/40 p-2 rounded-lg border border-slate-700/50 text-xs">
            <span className="font-semibold text-slate-400 block mb-1">Origine de la donnée :</span>
            <span className="text-slate-300 italic">{source}</span>
          </div>
        </div>
      )}
    </div>
  );

  const cardStyle = "bg-white dark:bg-[#111827]/80 backdrop-blur-xl p-5 flex flex-col justify-between rounded-[24px] border border-slate-200 dark:border-[#1F2937] hover:border-slate-300 dark:hover:border-gray-600 transition-all duration-300 relative group hover:z-50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-sm";
  const iconStyle = "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border";

  return (
    <div className="w-full relative z-[60]">
      {/* KPI Cards (Title/Header moved to unified parent block) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
        
        {/* Total Vidéos */}
        <div className={cardStyle}>
          {renderPopover('total_videos', 'Total Vidéos', 'Le nombre total de vidéos actuellement publiées sur votre compte.', 'Récupéré en direct depuis l\'API officielle TikTok.')}
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
          {renderPopover('vues', 'Vues Totales', 'Le cumul de toutes les vues générées par l\'ensemble de vos vidéos.', 'Récupéré en direct depuis l\'API officielle TikTok.')}
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
          {renderPopover('abonnes', 'Total Abonnés', 'Le nombre de personnes abonnées à votre compte.', 'Récupéré en direct depuis l\'API officielle TikTok.')}
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
          {renderPopover('likes', 'Total Likes', 'Le nombre total de "J\'aime" reçus sur l\'ensemble de vos vidéos.', 'Récupéré en direct depuis l\'API officielle TikTok.')}
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
          {renderPopover('partages', 'Partages', 'Le nombre de fois que l\'ensemble de vos vidéos ont été partagées.', 'Récupéré en direct depuis l\'API officielle TikTok.')}
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
    </div>
  );
};
