import React, { useState } from 'react';
import { FlaskConical, Play, Sparkles, CheckCircle2, Info } from 'lucide-react';

export const AILab = () => {
  const [idea, setIdea] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [titles, setTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleGenerate = () => {
    if (!idea) return;
    
    setIsAnalyzing(true);
    
    // Simulation d'une génération IA qui dure 2s
    setTimeout(() => {
      // Pour la démo, on simule des titres générés à partir de l'idée
      const generated = [
        { id: 1, text: `Pourquoi ${idea || "ceci"} va tout changer en 2026`, score: 98 },
        { id: 2, text: `J'ai testé ${idea || "cette idée"} pendant 30 jours (Bilan)`, score: 94 },
        { id: 3, text: `Le secret caché de ${idea || "cette méthode"}`, score: 89 },
        { id: 4, text: `Ne faites pas ça avec ${idea || "votre projet"} !`, score: 85 },
        { id: 5, text: `Le guide ultime : ${idea || "comment réussir"}`, score: 78 }
      ];
      
      setTitles(generated);
      setIsAnalyzing(false);
      setSelectedTitle(null);
    }, 2000);
  };

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/10 transition-all duration-300 p-6 rounded-3xl border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
            <FlaskConical size={20} className="text-indigo-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-gray-900 dark:text-white font-bold text-lg">Laboratoire IA (Titres)</h3>
              <div className="relative">
                <Info 
                  size={16} 
                  className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors"
                  onClick={() => setShowInfo(!showInfo)}
                />
                {showInfo && (
                  <div className="absolute top-full left-0 md:left-1/2 md:-translate-x-1/2 mt-2 w-64 md:w-72 bg-gray-900 dark:bg-gray-800 text-white p-3 rounded-xl text-xs z-50 shadow-xl border border-gray-700 text-left font-normal normal-case animate-fade-in">
                    <strong>Comment ça marche ? 🤖</strong><br /><br />
                    C'est simple : j'analyse en permanence les titres qui font le plus de vues chez tes concurrents. <br /><br />
                    Ensuite, je mélange ton idée avec les "mots magiques" qui marchent en ce moment sur YouTube pour te créer un titre irrésistible !
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Générez des titres ultra-performants</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">De quoi parle votre vidéo ?</label>
          <textarea 
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Ex: Je présente un nouveau site Webflow que j'ai fait pour une agence..."
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all resize-none h-24"
          />
        </div>

        <button 
          onClick={handleGenerate}
          disabled={!idea || isAnalyzing}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
            ${(!idea) ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed' : 
              'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30'}`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Création des titres...
            </>
          ) : (
            <>
              <Sparkles size={16} fill="currentColor" /> Générer 5 titres optimisés
            </>
          )}
        </button>
      </div>

      {titles.length > 0 && !isAnalyzing && (
        <div className="mt-6 pt-4 border-t border-lumina-lightBorder dark:border-lumina-darkBorder animate-fade-in">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Titres recommandés</h4>
          
          <div className="space-y-2">
            {titles.map((title, index) => (
              <div 
                key={title.id}
                onClick={() => setSelectedTitle(title.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedTitle === title.id 
                    ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-700 shadow-sm' 
                    : 'bg-white border-gray-100 hover:border-indigo-200 dark:bg-gray-800/50 dark:border-gray-700 dark:hover:border-indigo-800'
                }`}
              >
                <div className="flex items-center gap-3 pr-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    selectedTitle === title.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <p className={`text-sm font-medium ${selectedTitle === title.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {title.text}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                    index === 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' : 
                    index < 3 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 
                    'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    Score: {title.score}
                  </span>
                  {selectedTitle === title.id && <CheckCircle2 size={18} className="text-indigo-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

