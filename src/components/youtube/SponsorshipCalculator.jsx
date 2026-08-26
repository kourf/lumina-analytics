import React, { useState } from 'react';
import { DollarSign, Info, Sparkles, TrendingUp } from 'lucide-react';

export const SponsorshipCalculator = ({ videos, channel }) => {
  const [showInfo, setShowInfo] = useState(false);

  if (!videos || videos.length === 0 || !channel) return null;

  // Calcul basé sur les 5 dernières vidéos (ou moins s'il n'y en a pas assez)
  const recentVideos = videos.slice(0, 5);
  const avgViews = recentVideos.reduce((acc, v) => acc + (v.views || 0), 0) / recentVideos.length;
  
  // CPM Estimé pour la niche B2B / Agence Web / Design : 20€ à 40€
  const minCPM = 20;
  const maxCPM = 40;

  // Multiplicateur d'engagement (Bonus si le taux d'engagement est bon)
  const engagementRate = channel.globalEngagementRate || 0;
  let engagementMultiplier = 1;
  if (engagementRate >= 6) engagementMultiplier = 1.3; // +30%
  else if (engagementRate >= 3) engagementMultiplier = 1.15; // +15%
  else if (engagementRate < 1) engagementMultiplier = 0.8; // -20%

  const minValue = Math.round((avgViews / 1000) * minCPM * engagementMultiplier);
  const maxValue = Math.round((avgViews / 1000) * maxCPM * engagementMultiplier);

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/10 transition-all duration-300 p-6 rounded-3xl border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-full -z-10"></div>
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-500/10">
            <DollarSign size={20} className="text-green-500" />
          </div>
          <div>
            <h3 className="text-gray-900 dark:text-white font-bold text-lg">Opportunité Sponsoring</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Estimation pour un placement de produit</p>
          </div>
        </div>
        <button 
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <Info size={18} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center py-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-yellow-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Valeur estimée par vidéo</span>
          <Sparkles size={16} className="text-yellow-500" />
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-display-kpi font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
            {minValue.toLocaleString('fr-FR')}€
          </span>
          <span className="text-xl font-medium text-gray-400">-</span>
          <span className="text-4xl font-display-kpi font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600">
            {maxValue.toLocaleString('fr-FR')}€
          </span>
        </div>
      </div>

      <div className="mt-auto border-t border-lumina-lightBorder dark:border-lumina-darkBorder pt-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <TrendingUp size={14} className="text-blue-500" />
            <span>Moyenne de {Math.round(avgViews).toLocaleString('fr-FR')} vues/vidéo</span>
          </div>
          <div className="px-2 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded text-[10px] font-bold">
            NICHE B2B
          </div>
        </div>
      </div>

      {showInfo && (
        <div className="absolute top-12 right-6 w-72 bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700 animate-fade-in">
          <p className="font-semibold mb-2">Comment est calculée cette somme ?</p>
          <p className="text-gray-300 leading-relaxed mb-2">
            Ta chaîne appartient à la niche <strong>Webflow / Agence Web / B2B</strong>. C'est l'une des niches les plus lucratives pour les marques (logiciels SaaS, B2B...).
          </p>
          <ul className="space-y-1 text-gray-400 mb-2">
            <li>• <strong>Vues moyennes :</strong> {Math.round(avgViews).toLocaleString()} (sur les 5 dernières)</li>
            <li>• <strong>CPM estimé (Coût pour mille) :</strong> 20€ à 40€</li>
            <li>• <strong>Bonus d'engagement :</strong> {engagementMultiplier === 1 ? "Aucun" : `x${engagementMultiplier} (Excellent taux !)`}</li>
          </ul>
          <p className="text-[10px] text-gray-500 italic">Formule : (Vues Moyennes / 1000) × CPM × Bonus Engagement</p>
        </div>
      )}
    </div>
  );
};

