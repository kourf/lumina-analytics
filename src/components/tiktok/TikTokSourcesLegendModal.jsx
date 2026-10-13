import React from 'react';
import { X, ShieldCheck, Film, Users, Radio, Sparkles, Clock, CheckCircle2, Heart, ExternalLink } from 'lucide-react';

export const TikTokSourcesLegendModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-[#0E131F] border border-slate-700/80 rounded-[28px] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto text-left relative scrollbar-thin scrollbar-thumb-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow discret d'ambiance */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#25F4EE]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Header Modal */}
        <div className="flex items-start justify-between gap-4 mb-6 pb-5 border-b border-white/10 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#25F4EE]/10 text-teal-300 border border-[#25F4EE]/30 flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[#25F4EE]" />
                Transparence & Qualité des Données
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Origine des Données & Cadences d'Actualisation
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              Pour vous offrir des statistiques fiables et transparentes, Lumina synchronise vos données selon 4 piliers complémentaires.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
            aria-label="Fermer la légende"
          >
            <X size={20} />
          </button>
        </div>

        {/* 4 Piliers Clairs */}
        <div className="space-y-4 relative z-10">

          {/* Pilier 1 : Catalogue Vidéos & Vues */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Film size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">1. Catalogue Vidéos & Vues Officielles</h4>
                  <p className="text-[11px] text-slate-400">Total vidéos, vues cumulées, partages et historique des publications</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-mono shrink-0 self-start sm:self-center">
                <Clock size={12} />
                <span>Toutes les 30 min (ou en 1 clic)</span>
              </div>
            </div>
            <div className="text-xs text-slate-300 space-y-1.5 pl-0 sm:pl-[46px] leading-relaxed">
              <p>
                <strong className="text-white">Source :</strong> Connexion directe avec l'API officielle TikTok pour Créateurs (v2 OAuth2).
              </p>
              <p className="text-slate-400">
                L'API certifie chaque vidéo individuellement avec son titre, sa date exacte et ses compteurs officiels. L'actualisation automatique toutes les 30 minutes garantit des données fraîches tout en respectant les quotas stricts imposés par TikTok. Vous pouvez aussi forcer la mise à jour à tout moment via le bouton « Actualiser ».
              </p>
            </div>
          </div>

          {/* Pilier 2 : Profil & Likes */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-[#FE2C55] shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">2. Profil & Communauté (@karam.drame)</h4>
                  <p className="text-[11px] text-slate-400">Total d'abonnés réels (6 392) et Likes du profil (17,1k)</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FE2C55]/10 text-pink-300 border border-[#FE2C55]/20 text-xs font-mono shrink-0 self-start sm:self-center">
                <Clock size={12} />
                <span>Toutes les 5 minutes</span>
              </div>
            </div>
            <div className="text-xs text-slate-300 space-y-2 pl-0 sm:pl-[46px] leading-relaxed">
              <p>
                <strong className="text-white">Source :</strong> Données officielles du profil public TikTok synchronisées en quasi temps réel.
              </p>
              <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-[11px] text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <Heart size={13} className="text-[#FE2C55]" />
                  <span>Précision sur l'affichage des Likes (17,1k) :</span>
                </div>
                <p className="text-slate-400">
                  Sur votre profil dans l'application TikTok, vos mentions « J'aime » sont affichées au format arrondi <strong className="text-white">17,1k</strong>. Lumina Analytics respecte scrupuleusement cette même convention pour éviter toute divergence visuelle.
                </p>
                <p className="text-slate-400">
                  La somme de vos 75 vidéos actuelles totalise 16 971 likes. L'écart d'environ 129 likes provient des likes cumulés lors de vos lives passés ainsi que d'anciennes publications archivées que TikTok continue d'intégrer dans le compteur global de votre profil.
                </p>
              </div>
            </div>
          </div>

          {/* Pilier 3 : Direct Streaming (TikTok LIVE) */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <Radio size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">3. Événements en Direct (TikTok LIVE)</h4>
                  <p className="text-[11px] text-slate-400">Détection de statut live, spectateurs en direct, audience cumulée, likes et partages de session</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 text-xs font-mono shrink-0 self-start sm:self-center">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                <span>Temps Réel (&lt; 1s)</span>
              </div>
            </div>
            <div className="text-xs text-slate-300 space-y-1.5 pl-0 sm:pl-[46px] leading-relaxed">
              <p>
                <strong className="text-white">Source :</strong> Surveillance continue de la passerelle de streaming TikTok LIVE.
              </p>
              <p className="text-slate-400">
                Dès que vous démarrez un live sur TikTok, la bannière rouge apparaît instantanément au sommet de votre tableau de bord. Vos spectateurs en direct, pics d'audience et interactions de session sont retransmis sans décalage.
              </p>
            </div>
          </div>

          {/* Pilier 4 : Analyse Stratégique */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">4. Analyse Stratégique & Ratios Intelligents</h4>
                  <p className="text-[11px] text-slate-400">Taux d'engagement, vues médianes, portée organique, conversion abonnés et graphiques chronologiques</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-mono shrink-0 self-start sm:self-center">
                <Clock size={12} />
                <span>Instantané (&lt; 50ms)</span>
              </div>
            </div>
            <div className="text-xs text-slate-300 space-y-1.5 pl-0 sm:pl-[46px] leading-relaxed">
              <p>
                <strong className="text-white">Source :</strong> Moteur d'analyse décisionnelle Lumina Analytics calculé en direct sur votre catalogue de vidéos.
              </p>
              <p className="text-slate-400">
                Ces indicateurs avancés ne sont pas fournis nativement par l'application TikTok : ils sont recalculés instantanément par Lumina à partir de l'historique complet de vos vidéos. Dès qu'une nouvelle vidéo est synchronisée ou que vos vues augmentent, l'ensemble des graphiques et ratios s'ajuste immédiatement.
              </p>
            </div>
          </div>

        </div>

        {/* Footer avec rappel de politique */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <p className="text-[11px] text-slate-400 text-center sm:text-left flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>Toutes les cadences respectent scrupuleusement les politiques et quotas de TikTok.</span>
          </p>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#25F4EE] hover:bg-[#25F4EE]/90 text-slate-950 font-bold text-xs transition-all shadow-lg hover:shadow-cyan-500/20"
          >
            Fermer la légende
          </button>
        </div>

      </div>
    </div>
  );
};

export default TikTokSourcesLegendModal;
