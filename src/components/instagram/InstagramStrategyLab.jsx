import React from 'react';
import { Sparkles, Clock, Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import { MetricExplainerTooltip } from './MetricExplainerTooltip';

export const InstagramStrategyLab = ({ profile, insights }) => {
  const recommendations = [
    {
      title: "Dominance des Reels courts (15-30s)",
      description: "Pour un compte de 481 abonnés, le format Reel court permet de franchir les limites de l'audience captive et de capter des profils qualifiés sans publicité.",
      category: "Format",
      icon: TrendingUp,
      badge: "Priorité #1"
    },
    {
      title: "Fenêtre optimale d'attention",
      description: "Pic de réactivité de l'audience francophone entre 18h30 et 21h00 du mardi au vendredi. Privilégiez un hook visuel dès les 2 premières secondes.",
      category: "Timing",
      icon: Clock,
      badge: "Timing Idéal"
    },
    {
      title: "Appel à l'action orienté Sauvegardes & DM",
      description: "Inciter les spectateurs à enregistrer les tutoriels ou à commenter un mot-clé précis pour recevoir une ressource en message privé démultiplie l'autorité.",
      category: "Conversion",
      icon: Target,
      badge: "Levier Business"
    }
  ];

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface rounded-[28px] border border-lumina-lightBorder dark:border-lumina-darkBorder p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Laboratoire Stratégique & Recommandations de Croissance
            </h3>
            <MetricExplainerTooltip
              title="Intelligence Décisionnelle"
              definition="Recommandations concrètes calibrées pour la taille d'audience certifiée de @karam.drm (481 abonnés, 24 posts)."
              businessUtility="Évite les tâtonnements stratégiques en orientant immédiatement les efforts sur les leviers à plus fort impact pour franchir le cap des 1 000 abonnés."
              formula="Optimisation basée sur les standards d'acquisition Instagram 2026"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Conseils stratégiques adaptés au profil vérifié @karam.drm (481 abonnés)
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          Plan d'action B2B
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        {recommendations.map((rec, index) => {
          const Icon = rec.icon;
          return (
            <div
              key={index}
              className="p-5 rounded-2xl bg-gray-50 dark:bg-lumina-darkElevated/40 border border-gray-200/70 dark:border-lumina-darkBorder flex flex-col justify-between hover:border-purple-500/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                    {rec.badge}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                  {rec.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                  {rec.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-800 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Action recommandée
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
