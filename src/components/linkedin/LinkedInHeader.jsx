import React from 'react';
import { ExternalLink, RefreshCw, Edit3, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { LinkedinIcon } from '../SocialIcons';

export const LinkedInHeader = ({ profile, syncStatus, onRefresh, isRefreshing, onOpenEditModal }) => {
  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface rounded-[28px] border border-lumina-lightBorder dark:border-lumina-darkBorder p-6 md:p-8 shadow-sm transition-all duration-300">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Profil Infos */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-tr from-[#0A66C2] via-blue-400 to-indigo-600 shadow-md">
              <img
                src={profile?.profilePictureUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
                alt={profile?.name || "Karamokho DRAMÉ"}
                className="w-full h-full rounded-full object-cover bg-white dark:bg-gray-800"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#0A66C2] text-white p-1.5 rounded-full shadow-lg border-2 border-white dark:border-[#121216]">
              <LinkedinIcon size={14} color="#FFFFFF" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {profile?.name || "Karamokho DRAMÉ"}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-[#0A66C2] dark:text-blue-400 border border-blue-500/20">
                <CheckCircle2 size={12} className="text-[#0A66C2]" />
                Profil Vérifié
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={12} />
                Données Zéro-Fake
              </span>
            </div>

            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
              {profile?.headline || "Graphiste & Développeur Webflow | Fondateur chez Karam Agency"}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">
                <strong className="text-[#0A66C2]">{profile?.followersCount?.toLocaleString('fr-FR') || "1 715"}</strong> abonnés
              </span>
              <span>•</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                <strong className="text-[#0A66C2]">{profile?.connectionsCount?.toLocaleString?.('fr-FR') || profile?.connectionsCount || "1 553"}</strong> relations
              </span>
              <span>•</span>
              <span>{profile?.location || "Paris, France"}</span>
            </div>
          </div>
        </div>

        {/* Boutons d'Action */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={onOpenEditModal}
            className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Edit3 size={14} />
            Mettre à jour les stats
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
            title="Synchroniser"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-[#0A66C2]" : ""} />
          </button>

          <a
            href={profile?.profileUrl || "https://www.linkedin.com/in/drmkaramokho"}
            target="_blank"
            rel="noreferrer"
            className="flex-1 lg:flex-none px-5 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            Voir sur LinkedIn
            <ExternalLink size={14} />
          </a>
        </div>

      </div>
    </div>
  );
};
