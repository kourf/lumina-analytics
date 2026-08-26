import React from 'react';
import { FileText, Lock, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';

export const LinkedInPostsPerformance = ({ posts }) => {
  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface rounded-[28px] border border-lumina-lightBorder dark:border-lumina-darkBorder p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="font-extrabold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={20} className="text-[#0A66C2]" />
            Dernières Publications & Performance de Contenu
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Suivi des posts et réactions sur LinkedIn
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 self-start sm:self-auto flex items-center gap-1.5">
          <Lock size={12} />
          Donnée non obtenue publiquement
        </span>
      </div>

      <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#15151c] border border-dashed border-gray-300 dark:border-gray-800 text-center flex flex-col items-center justify-center py-10">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <ShieldAlert size={24} />
        </div>
        
        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
          Statistiques détaillées des publications non obtenues
        </h4>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed mb-5">
          <strong>Raison :</strong> LinkedIn verrouille l'accès aux métriques précises de chaque post (impressions, clics, taux de conversion) derrière le compte administrateur. Aucune fausse donnée ou estimation inventée n'est affichée ici afin de garantir 100% d'intégrité analytique.
        </p>

        <a
          href="https://www.linkedin.com/in/drmkaramokho/recent-activity/all/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-bold transition-all shadow-md"
        >
          Consulter l'activité en direct sur LinkedIn
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};
