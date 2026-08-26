import React, { useMemo, useState } from 'react';
import { Tag, AlertTriangle } from 'lucide-react';

export const CompetitorKeywords = ({ competitors }) => {
  const [showWarning, setShowWarning] = useState(false);

  // Fonction pour extraire et compter les mots-clés
  const keywordData = useMemo(() => {
    if (!competitors || competitors.length === 0) return [];

    const stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'à', 'en', 'dans', 'pour', 'que', 'qui', 'sur', 'ce', 'se', 'pas', 'plus', 'avec', 'ou', 'au', 'ne', 'il', 'elle', 'on', 'est', 'sont', 'faire', 'tout', 'tous', 'comment', 'pourquoi', 'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses', 'cette', 'ces'];
    
    const wordCounts = {};

    competitors.forEach(comp => {
      if (!comp.videos) return;
      comp.videos.forEach(video => {
        if (!video.title) return;
        
        // Nettoyage du titre
        const cleanTitle = video.title.toLowerCase()
          .replace(/[.,!?()[\]{}:;"']/g, ' ')
          .replace(/\|/g, ' ')
          .replace(/-/g, ' ');
        
        const words = cleanTitle.split(/\s+/);
        
        words.forEach(word => {
          if (word.length > 3 && !stopWords.includes(word)) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
          }
        });
      });
    });

    // Transformer en array et trier
    return Object.entries(wordCounts)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30); // Garder le top 30
  }, [competitors]);

  if (!competitors || competitors.length === 0) return null;

  // Calculer la taille de la police en fonction de la fréquence
  const maxVal = keywordData.length > 0 ? keywordData[0].value : 1;
  const minVal = keywordData.length > 0 ? keywordData[keywordData.length - 1].value : 1;

  const getFontSize = (value) => {
    // Échelle entre 0.8rem et 2.5rem
    const minSize = 0.8;
    const maxSize = 2.5;
    if (maxVal === minVal) return minSize;
    const size = minSize + ((value - minVal) / (maxVal - minVal)) * (maxSize - minSize);
    return `${size}rem`;
  };

  const getColor = (index) => {
    const colors = [
      'text-blue-500', 'text-indigo-500', 'text-purple-500', 
      'text-pink-500', 'text-rose-500', 'text-orange-500', 
      'text-amber-500', 'text-emerald-500', 'text-teal-500', 'text-cyan-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/10 transition-all duration-300 p-6 rounded-3xl border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm relative overflow-hidden h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10">
            <Tag size={20} className="text-purple-500" />
          </div>
          <div>
            <h3 className="text-gray-900 dark:text-white font-bold text-lg">Nuage de Mots-Clés</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Lexique des concurrents analysés</p>
          </div>
        </div>
        <button 
          onMouseEnter={() => setShowWarning(true)}
          onMouseLeave={() => setShowWarning(false)}
          className="text-amber-400 hover:text-amber-500 transition-colors"
        >
          <AlertTriangle size={18} />
        </button>
      </div>

      {showWarning && (
        <div className="absolute top-12 right-6 w-72 bg-amber-50 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 p-4 rounded-2xl text-xs z-50 shadow-xl border border-amber-200 dark:border-amber-700/50 animate-fade-in">
          <p className="font-semibold mb-2 flex items-center gap-1"><AlertTriangle size={14}/> Attention aux données tests</p>
          <p className="leading-relaxed">
            Ce nuage analyse les titres des chaînes actuellement dans votre liste de concurrents. 
            Si vous avez ajouté des chaînes hors de votre niche (ex: gaming) pour tester, ce nuage sera faussé.
          </p>
          <p className="mt-2 font-semibold">
            Supprimez les chaînes tests et n'ajoutez que des vraies agences / chaînes webflow pour un lexique 100% pertinent !
          </p>
        </div>
      )}

      {keywordData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Pas assez de données pour générer le nuage.
        </div>
      ) : (
        <div className="flex-1 flex flex-wrap justify-center items-center gap-x-4 gap-y-2 p-4 content-center">
          {keywordData.map((kw, i) => (
            <span 
              key={i} 
              className={`font-bold transition-transform hover:scale-110 cursor-default ${getColor(i)} opacity-${Math.max(60, 100 - (i * 2))}`}
              style={{ fontSize: getFontSize(kw.value), lineHeight: '1.2' }}
              title={`Apparaît ${kw.value} fois`}
            >
              {kw.text}
            </span>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-lumina-lightBorder dark:border-lumina-darkBorder text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Basé sur {competitors.length} concurrent(s)</p>
      </div>
    </div>
  );
};

