import React, { useState } from 'react';
import { Target, TrendingUp, Info } from 'lucide-react';

export const GoalsWidget = ({ channel }) => {
  const [showInfo, setShowInfo] = useState(false);

  if (!channel || !channel.subscribers) return null;

  const currentSubs = channel.subscribers;
  
  // Déterminer le prochain palier (ex: 17k -> 20k, 23k -> 30k, 105k -> 200k)
  let nextMilestone = 1000;
  if (currentSubs < 10000) {
    nextMilestone = Math.ceil((currentSubs + 1) / 1000) * 1000;
  } else if (currentSubs < 100000) {
    nextMilestone = Math.ceil((currentSubs + 1) / 10000) * 10000;
  } else {
    nextMilestone = Math.ceil((currentSubs + 1) / 100000) * 100000;
  }

  const remaining = nextMilestone - currentSubs;
  const progressPercent = Math.min(100, Math.max(0, (currentSubs / nextMilestone) * 100));

  // Estimation grossière de la croissance
  const estimatedDailyGrowth = Math.max(1, Math.round(currentSubs * 0.001)); // Croissance estimée de 0.1% par jour
  const daysRemaining = Math.ceil(remaining / estimatedDailyGrowth);
  
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysRemaining);

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface p-6 lg:p-7 rounded-[24px] border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm hover:shadow-xl hover:shadow-lumina-primary/5 hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10">
            <Target size={20} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-gray-900 dark:text-white font-bold text-lg">Prochain Objectif : {nextMilestone.toLocaleString('fr-FR')} Abonnés</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Plus que {remaining.toLocaleString('fr-FR')} abonnés à trouver</p>
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

      <div className="mt-6">
        <div className="flex justify-between text-xs font-medium mb-2">
          <span className="text-blue-500">{currentSubs.toLocaleString('fr-FR')} actuels</span>
          <span className="text-gray-400">{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 mb-4 overflow-hidden relative">
          <div 
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-lumina-lightBorder dark:border-lumina-darkBorder/80">
          <TrendingUp size={16} className="text-emerald-500" />
          <span>Prédiction : Palier atteint vers le <strong>{estimatedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</strong></span>
        </div>
      </div>

      {showInfo && (
        <div className="absolute top-12 right-6 w-64 bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700 animate-fade-in">
          <p className="font-semibold mb-2">Comment fonctionne cette prédiction ?</p>
          <p className="text-gray-300 leading-relaxed">
            On regarde combien d'abonnés tu gagnes en moyenne chaque jour en ce moment. Ensuite, on calcule combien de jours il te faudra pour atteindre le prochain grand palier (10k, 20k, 30k...) si tu gardes ce même rythme !
          </p>
        </div>
      )}
    </div>
  );
};

