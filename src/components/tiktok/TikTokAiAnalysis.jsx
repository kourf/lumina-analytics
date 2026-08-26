import React, { useMemo } from 'react';
import { Bot, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';

export const TikTokAiAnalysis = ({ tiktokData }) => {
  if (!tiktokData) return null;

  const analysis = useMemo(() => {
    const totalInteractions = (tiktokData.totalLikes || tiktokData.likes) + (tiktokData.totalComments || 0) + (tiktokData.shares || 0);
    const engagementRate = tiktokData.views > 0 ? (totalInteractions / tiktokData.views) * 100 : 0;
    const avgViews = tiktokData.videoAnalytics?.avgViews || 0;
    const isActive = tiktokData.recentVideos && tiktokData.recentVideos.length > 0;

    let positives = [];
    let negatives = [];
    let macro = "";
    let meso = "";
    let tips = [];

    // Logique de Diagnostic Positif/Négatif
    if (engagementRate >= 5) {
      positives.push(`Excellent taux d'engagement (${engagementRate.toFixed(1)}%). Votre communauté est extrêmement réactive.`);
    } else if (engagementRate >= 2) {
      positives.push(`Bon taux d'engagement (${engagementRate.toFixed(1)}%). La communauté interagit de façon constante.`);
    } else {
      negatives.push(`Le taux d'engagement (${engagementRate.toFixed(1)}%) est perfectible. Il faut inciter davantage à l'action (Commentaires/Partages).`);
    }

    if (avgViews > 10000) {
      positives.push("Moyenne de vues excellente, l'algorithme TikTok met régulièrement votre contenu en avant.");
    } else if (avgViews < 1000 && isActive) {
      negatives.push("La moyenne de vues est encore faible. Travailler les 3 premières secondes (le hook) est crucial.");
    }

    // Analyse de l'Audience (Vision globale)
    let conversionStatus = tiktokData.views > 50000 ? "un trafic massif" : "une audience grandissante";
    macro = `Au total, vos vidéos ont généré ${new Intl.NumberFormat('fr-FR').format(tiktokData.views)} vues. Vous avez réussi à attirer ${conversionStatus}. Le but maintenant n'est plus seulement d'avoir des vues, mais de donner envie à ces personnes de cliquer sur votre lien en bio pour découvrir votre agence et vos services.`;

    // Analyse du Contenu (Focus sur le contenu actuel)
    let shareDynamism = tiktokData.shares > 1000 ? "Vos abonnés partagent beaucoup vos vidéos, ce qui prouve qu'ils trouvent vos conseils utiles." : "Pour que vos vidéos soient plus recommandées, il faut encourager vos spectateurs à les partager ou les enregistrer.";
    meso = `Sur vos dernières vidéos, l'algorithme remarque vos efforts. ${shareDynamism} N'oubliez pas : chaque vidéo éducative ou tutoriel doit se terminer par une invitation claire à travailler avec vous (ex: "Lien dans ma bio pour un audit gratuit").`;

    // Conseils d'expert (Lives et Vente)
    tips = [
      "🎤 Conseil de Conversion Live : Le format 'Build in Public' est extrêmement puissant pour le B2B (Création de sites internet). Les spectateurs voient votre expertise en temps réel.",
      "📌 Actions recommandées pendant le Live : Épinglez un commentaire 'Vous voulez un site comme celui-ci ? Lien dans ma bio pour travailler ensemble.'",
      "🗣️ Toutes les 15 minutes, rappelez verbalement l'offre : 'Si vous bloquez sur votre propre stratégie digitale, réservez un appel gratuit avec Karam Agency via ma bio.'"
    ];

    if (!isActive) {
      negatives.push("Aucune vidéo récente détectée. La régularité est le premier critère de l'algorithme TikTok.");
    }

    if (positives.length === 0) positives.push("Votre présence sur la plateforme est le premier pas vers la monétisation.");
    if (negatives.length === 0) negatives.push("Maintenez cette dynamique, aucun point critique majeur à signaler.");

    return { positives, negatives, macro, meso, tips };
  }, [tiktokData]);

  return (
    <div className="col-span-full border border-lumina-lightBorder dark:border-lumina-darkBorder bg-white/50 dark:bg-[#111111]/50 backdrop-blur-xl rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.02)] mb-8">
      {/* Header AI */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-inner">
          <Bot size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white font-headline-lg flex items-center gap-2">
            Lumina AI - Diagnostic Expert
            <span className="text-[10px] bg-indigo-900/50 text-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Pro Max</span>
          </h2>
          <p className="text-blue-100 text-sm mt-1">Analyse stratégique générée en temps réel pour vendre vos services.</p>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Colonne Gauche : Diagnostic & Checklist */}
        <div className="space-y-6">
          {/* Leak Alert (Alerte Déperdition) */}
          {tiktokData.views > 10000 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 rounded-r-xl shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle size={24} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-orange-800 dark:text-orange-300 font-bold text-sm">Alerte de Déperdition B2B</h4>
                  <p className="text-orange-700 dark:text-orange-400 text-sm mt-1">
                    ⚠️ {new Intl.NumberFormat('fr-FR').format(tiktokData.views)} vues globales détectées, mais le taux de redirection vers Karam Agency semble bloqué. Le Call-to-Action sur votre profil TikTok manque de clarté.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-emerald-500" /> Points Forts
            </h3>
            <ul className="space-y-3">
              {analysis.positives.map((item, i) => (
                <li key={i} className="flex gap-3 text-gray-600 dark:text-gray-300 text-sm">
                  <span className="text-emerald-500 flex-shrink-0">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-amber-500" /> Axes d'Amélioration
            </h3>
            <ul className="space-y-3">
              {analysis.negatives.map((item, i) => (
                <li key={i} className="flex gap-3 text-gray-600 dark:text-gray-300 text-sm">
                  <span className="text-amber-500 flex-shrink-0">!</span> {item}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Pre-Live Checklist */}
          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
            <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target size={16} /> Checklist Avant-Live (Build in Public)
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Le lien vers Karam Agency est bien visible dans la bio ?</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Un commentaire avec un CTA B2B est prêt à être épinglé ?</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">L'objectif commercial du jour est clairement défini ?</span>
              </label>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Stratégie & Meso/Macro & CTA Gen */}
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-[#1A1A20] p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Target size={16} /> Audit du compte TikTok
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
              {analysis.macro}
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {analysis.meso}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Lightbulb size={16} /> Recommandations Tactiques
            </h3>
            <ul className="space-y-4">
              {analysis.tips.map((tip, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Generator */}
          <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Bot size={64} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 relative z-10">
              Générateur de CTA (Copywriting B2B)
            </h3>
            <p className="text-gray-400 text-sm mb-4 relative z-10">À épingler dans le chat de votre prochain Live :</p>
            <div className="bg-white/10 border border-white/20 p-3 rounded-lg text-white text-sm italic relative z-10">
              "Vous aimez ce design Webflow ? Je peux créer le vôtre. Prenez un RDV d'audit 100% gratuit via le lien dans ma bio TikTok !"
            </div>
            <button className="mt-4 w-full bg-white text-black hover:bg-gray-200 transition-colors py-2 rounded-lg text-sm font-bold shadow-lg relative z-10" onClick={() => alert("CTA copié dans le presse-papier !")}>
              Générer une nouvelle accroche
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
