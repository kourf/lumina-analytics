import React, { useState } from 'react';
import { Sparkles, Target, Clock, TrendingUp, Check, Copy, Zap, MessageCircle } from 'lucide-react';

export const LinkedInStrategyLab = ({ profile, insights }) => {
  const [copiedKey, setCopiedKey] = useState(null);

  const recommendations = [
    {
      title: "Format Carrousel Document (5-8 slides)",
      description: "Les carrousels PDF partagés sur LinkedIn génèrent 3.4x plus d'enregistrements et d'impressions auprès des fondateurs de startups et directeurs marketing.",
      category: "Format",
      badge: "Priorité #1",
      icon: TrendingUp
    },
    {
      title: "Fenêtre d'Autorité B2B (Mardi & Jeudi 8h30)",
      description: "Le créneau optimal pour toucher les décideurs et CTOs en recherche de refonte Webflow se situe entre 8h00 et 10h00 le mardi et jeudi matin.",
      category: "Timing",
      badge: "Timing Idéal",
      icon: Clock
    },
    {
      title: "CTA d'Audit Webflow en Commentaire Épinglé",
      description: "Terminer chaque post par une question ouverte invitant au débat, puis épingler un commentaire : 'Besoin d'un audit de votre site actuel ? Lien en bio de mon profil.'",
      category: "Conversion",
      badge: "Lead Gen",
      icon: Target
    }
  ];

  const postHooks = [
    {
      title: "Hook Déconstruction d'un Site Client",
      text: "On a analysé pourquoi le site de ce client générait 0 lead malgré 10 000 visites/mois. Le problème n'était pas le trafic, mais la hiérarchie visuelle. Voici les 3 ajustements faits en 48h sur Webflow : 🧵👇"
    },
    {
      title: "Hook Storytelling Agence & Expertise",
      text: "Créer un site vitrine en 2026 sans Design System, c'est comme construire une maison sans fondations. Voici la méthode exacte qu'on applique chez Karam Agency pour garantir un site évolutif :"
    },
    {
      title: "Hook Conseils Carrousel & Outils",
      text: "5 fonctionnalités méconnues de Webflow qui nous font gagner 15h par projet client (et rendent les animations 60fps fluides) 🚀"
    }
  ];

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-lumina-lightSurface dark:bg-lumina-darkSurface rounded-[28px] border border-lumina-lightBorder dark:border-lumina-darkBorder p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-[#0A66C2]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Laboratoire Stratégique IA & Recommandations LinkedIn
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Analyses prescriptives basées sur le positionnement de Karamokho DRAMÉ ({profile?.followersCount || 842} abonnés)
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-[#0A66C2] dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5 self-start sm:self-auto">
          <Zap size={13} /> Modèle FinOps Token-Optimized
        </span>
      </div>

      {/* Recommandations Stratégiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        {recommendations.map((rec, idx) => {
          const Icon = rec.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-gray-50 dark:bg-[#15151c] border border-gray-200/70 dark:border-gray-800 flex flex-col justify-between hover:border-[#0A66C2]/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-[#0A66C2]">
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
                <Check className="w-3.5 h-3.5" /> Prêt pour application
              </div>
            </div>
          );
        })}
      </div>

      {/* Générateur d'Accroches LinkedIn Copywriting */}
      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageCircle size={16} className="text-[#0A66C2]" />
          Accroches LinkedIn Recommandées (Prêtes à publier)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {postHooks.map((hook, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white dark:bg-[#1A1A22] border border-gray-200/80 dark:border-gray-800 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 block mb-1">
                  {hook.title}
                </span>
                <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">
                  "{hook.text}"
                </p>
              </div>

              <button
                onClick={() => handleCopy(hook.text, idx)}
                className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-xs font-semibold text-[#0A66C2] hover:underline"
              >
                <span className="flex items-center gap-1">
                  {copiedKey === idx ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  {copiedKey === idx ? "Copié !" : "Copier le texte"}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
