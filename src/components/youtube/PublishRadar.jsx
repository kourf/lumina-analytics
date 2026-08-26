import React, { useState } from 'react';
import { Calendar, Info } from 'lucide-react';

export const PublishRadar = () => {
  const [showInfo, setShowInfo] = useState(false);

  // Données universelles pour la heatmap des heures de publication
  // 1 = Faible, 2 = Moyen, 3 = Fort, 4 = Prime Time
  const heatmapData = [
    { day: 'Lun', hours: [1, 1, 1, 2, 2, 1, 1, 1, 2, 3, 4, 3] }, // 8h, 10h, 12h, 14h, 16h, 18h, 20h
    { day: 'Mar', hours: [1, 1, 1, 2, 2, 1, 1, 1, 2, 3, 4, 3] },
    { day: 'Mer', hours: [1, 1, 2, 3, 2, 1, 2, 2, 3, 4, 4, 3] }, // Mercredi PM plus fort
    { day: 'Jeu', hours: [1, 1, 1, 2, 2, 1, 1, 1, 2, 3, 4, 3] },
    { day: 'Ven', hours: [1, 1, 1, 2, 2, 1, 1, 2, 3, 4, 4, 4] }, // Vendredi soir très fort
    { day: 'Sam', hours: [1, 2, 3, 4, 4, 3, 3, 3, 4, 4, 3, 2] }, // Week-end: matin et soir
    { day: 'Dim', hours: [1, 2, 3, 3, 3, 2, 2, 3, 4, 4, 4, 2] }, // Dimanche soir ultra prime time
  ];

  const timeLabels = ['8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];

  const getColor = (intensity) => {
    switch (intensity) {
      case 1: return 'bg-red-50 dark:bg-red-500/5';
      case 2: return 'bg-red-200 dark:bg-red-500/20';
      case 3: return 'bg-red-400 dark:bg-red-500/50';
      case 4: return 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] dark:bg-red-500 dark:shadow-[0_0_10px_rgba(239,68,68,0.5)]';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/10 transition-all duration-300 p-6 rounded-3xl border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm relative group h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10">
            <Calendar size={20} className="text-orange-500" />
          </div>
          <div>
            <h3 className="text-gray-900 dark:text-white font-bold text-lg">Radar de Publication</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Heatmap des "Prime Times" francophones</p>
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

      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Header des heures */}
          <div className="flex ml-10 mb-2">
            {timeLabels.map((time, i) => (
              <div key={i} className="flex-1 text-center text-[10px] text-gray-400 font-medium">
                {time}
              </div>
            ))}
          </div>

          {/* Grille de la heatmap */}
          <div className="space-y-1.5">
            {heatmapData.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-8 text-[11px] font-semibold text-gray-500 dark:text-gray-400 text-right">
                  {row.day}
                </span>
                <div className="flex flex-1 gap-1">
                  {/* On regroupe les colonnes pour simplifier l'affichage (par bloc de 2h) */}
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((colIndex) => {
                    // On prend la valeur max du bloc de 2h (ex: entre 8h et 10h)
                    // L'array a 12 éléments (de 8h à 22h, etc). Simplification pour l'affichage visuel:
                    const intensity = row.hours[colIndex] || 1; 
                    return (
                      <div 
                        key={colIndex} 
                        className={`flex-1 h-6 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer ${getColor(intensity)}`}
                        title={`${row.day} vers ${timeLabels[colIndex]} - ${intensity === 4 ? 'Prime Time !' : intensity === 3 ? 'Très bon' : 'Moyen'}`}
                      ></div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-gray-500 dark:text-gray-400 border-t border-lumina-lightBorder dark:border-lumina-darkBorder pt-4">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-50 dark:bg-red-500/5"></div> Faible</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-500/20"></div> Moyen</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-400 dark:bg-red-500/50"></div> Bon</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-600 dark:bg-red-500"></div> Prime Time</div>
      </div>

      {showInfo && (
        <div className="absolute top-12 right-6 w-72 bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-2xl text-xs z-50 shadow-xl border border-gray-700 animate-fade-in">
          <p className="font-semibold mb-2">Comment lire ce tableau ?</p>
          <p className="text-gray-300 leading-relaxed mb-2">
            Plus la case est rouge vif, plus il y a de monde connecté sur YouTube à ce moment précis ! 
          </p>
          <p className="text-gray-300 leading-relaxed font-semibold text-red-400">
            Astuce : Publie ta vidéo environ 2 heures AVANT une zone très rouge. Ainsi, quand le pic d'audience arrivera, ta vidéo sera déjà prête et recommandée par l'algorithme.
          </p>
        </div>
      )}
    </div>
  );
};

