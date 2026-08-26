import React from 'react';
import { Award, Lock, ExternalLink, ShieldAlert, Sparkles, Video, Layers, Image as ImageIcon } from 'lucide-react';

export const InstagramContentPerformance = ({ mediaList, isConnected, onOpenMetaModal }) => {
  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface rounded-[28px] border border-lumina-lightBorder dark:border-lumina-darkBorder p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="font-extrabold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Award size={20} className="text-[#E1306C]" />
            Dernières Publications & Performance de Contenu
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Suivi des posts, reels et carrousels sur Instagram
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 self-start sm:self-auto flex items-center gap-1.5">
          <Lock size={12} />
          Donnée non obtenue publiquement
        </span>
      </div>

      <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#15151c] border border-dashed border-gray-300 dark:border-gray-800 text-center flex flex-col items-center justify-center py-10">
        <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-[#E1306C] flex items-center justify-center mb-4">
          <ShieldAlert size={24} />
        </div>
        
        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
          Statistiques détaillées des médias non obtenues
        </h4>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed mb-5">
          <strong>Raison :</strong> Meta verrouille l'accès aux métriques individuelles des publications (lectures Reels, sauvegardes, partages en DM) derrière le compte créateur/professionnel connecté via Meta Graph API. Aucune fausse donnée ou estimation fictive n'est affichée ici afin de garantir 100% d'intégrité analytique.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://www.instagram.com/karam.drm/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DD2A7B] to-[#8134AF] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md"
          >
            Consulter les 24 publications sur Instagram
            <ExternalLink size={14} />
          </a>

          {!isConnected && (
            <button
              onClick={onOpenMetaModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all"
            >
              <Lock size={14} />
              Connecter Meta Graph API
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
