import React from 'react';
import { Sparkles, RefreshCw, ExternalLink, ShieldCheck, Lock } from 'lucide-react';
import { InstagramIcon } from '../SocialIcons';
import { MetricExplainerTooltip } from './MetricExplainerTooltip';

export const InstagramHeader = ({ profile, syncStatus, onRefresh, isRefreshing, onOpenMetaModal }) => {
  const isConnected = profile?.isConnectedViaMeta;
  const followersCount = profile?.followersCount ?? 481;
  const followsCount = profile?.followsCount ?? 389;
  const mediaCount = profile?.mediaCount ?? 24;

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-lumina-lightSurface dark:bg-lumina-darkSurface border border-lumina-lightBorder dark:border-lumina-darkBorder p-6 md:p-8 shadow-sm transition-all duration-300">
      {/* Halo de fond Instagram Gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#E1306C]/10 via-[#833AB4]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        {/* Profil info */}
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl p-1 bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] shadow-md shadow-pink-500/20">
              <img
                src={profile?.profilePictureUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={profile?.username || 'Instagram Profile'}
                className="w-full h-full object-cover rounded-xl bg-gray-100 dark:bg-gray-800"
              />
            </div>
            <div
              className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full border-2 border-white dark:border-[#121216] flex items-center justify-center text-[10px] font-bold shadow ${
                isConnected ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}
              title={isConnected ? 'Connecté via Meta Graph API' : 'Données publiques non authentifiées'}
            >
              {isConnected ? <ShieldCheck className="w-3.5 h-3.5" /> : '!'}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>@{profile?.username || 'karam.drm'}</span>
                <a
                  href={`https://www.instagram.com/${profile?.username || 'karam.drm'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-lg text-gray-400 hover:text-[#E1306C] transition-colors"
                  title="Ouvrir sur Instagram"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isConnected ? 'Meta Graph API Validée' : 'Mode Extraction Publique'}
              </span>
              <MetricExplainerTooltip
                title="Statut d'Audit Instagram"
                definition="Indique le mode d'extraction utilisé pour recueillir les données de @karam.drm (Extraction publique directe vs API Meta OAuth2)."
                businessUtility="Permet de distinguer les données certifiées publiques (abonnés, likes, vues Reels) des métriques privées réservées au créateur."
                benchmarks={[
                  { label: "Extraction Publique", range: "Abonnés, Likes, Comms, Reels", colorClass: "bg-amber-500" },
                  { label: "Meta Graph API", range: "Reach, Saves, Impressions privées", colorClass: "bg-emerald-500" }
                ]}
              />
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-xl line-clamp-2">
              {profile?.biography || 'Créateur de contenu & Stratégie digitale | Tech, IA & Business'}
            </p>

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span><strong>{mediaCount}</strong> publications</span>
              <span>•</span>
              <span><strong>{followersCount.toLocaleString('fr-FR')}</strong> abonnés</span>
              <span>•</span>
              <span><strong>{followsCount}</strong> abonnements</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {!isConnected && (
            <button
              onClick={onOpenMetaModal}
              className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DD2A7B] to-[#8134AF] hover:opacity-95 text-white text-xs font-semibold shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              Débloquer Reach & Saves
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-lumina-darkElevated hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-semibold border border-gray-200 dark:border-lumina-darkBorder transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>
    </div>
  );
};
