import React, { useState } from 'react';
import { Users, Eye, ThumbsUp, Share2, Info, Video, Calendar, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

export const TikTokKpiCards = ({ tiktokData }) => {
  const [activeTooltip, setActiveTooltip] = useState(null);

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

  const renderTooltip = (id, title, explanation, calculation, benchmarks = null) => (
    <div 
      className="absolute top-4 right-4 z-30 group-hover:opacity-100 transition-opacity"
      onMouseEnter={() => setActiveTooltip(id)}
      onMouseLeave={() => setActiveTooltip(null)}
    >
      <button className="text-gray-500 hover:text-white transition-colors cursor-help">
        <Info size={16} />
      </button>
      {activeTooltip === id && (
        <div className="absolute right-0 top-6 w-56 bg-gray-900/95 backdrop-blur-2xl text-white text-xs rounded-xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-700 z-[100] animate-in fade-in zoom-in duration-200">
          <p className="font-bold mb-2 text-white text-[13px]">{title}</p>
          <p className="mb-3 text-gray-300 leading-relaxed">{explanation}</p>
          {benchmarks && (
            <div className="bg-black/50 rounded-lg p-2 mb-3 border border-white/5 space-y-1">
              {benchmarks.map((b, idx) => (
                <div key={idx} className="flex justify-between text-[10px]">
                  <span className={b.colorClass}>{b.label}</span>
                  <span className={b.isBold ? "text-gray-300 font-semibold" : "text-gray-400"}>{b.desc}</span>
                </div>
              ))}
            </div>
          )}
          <div className="bg-black/50 p-2 rounded-lg border border-gray-700">
            <span className="font-semibold text-gray-400 block mb-1">Calcul :</span> 
            <span className="text-gray-300 italic">{calculation}</span>
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
          {renderTooltip('total_videos', 'Total Vidéos', 'Combien de vidéos vous avez publiées sur votre compte.', 'Comptage exact du nombre de vidéos récupérées.')}
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
          {renderTooltip('vues', 'Vues Totales', 'Le cumul de toutes les vues générées.', 'Somme officielle des vues.')}
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
          {renderTooltip('abonnes', 'Total Abonnés', 'Nombre d\'utilisateurs abonnés.', 'Donnée directe fournie par TikTok.')}
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
          {renderTooltip('likes', 'Total Likes', 'Nombre cumulé de cœurs reçus.', 'Somme officielle (likes_count).')}
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
          {renderTooltip('partages', 'Partages', 'Combien de fois vos vidéos ont été envoyées.', 'Somme totale des partages.')}
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
