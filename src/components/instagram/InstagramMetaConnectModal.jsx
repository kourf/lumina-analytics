import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Lock, ExternalLink, Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const InstagramMetaConnectModal = ({ isOpen, onClose, onSaveToken }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError('Veuillez entrer un jeton d’accès Meta valide.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      if (onSaveToken) {
        await onSaveToken(tokenInput.trim());
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la validation du jeton.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl rounded-[32px] bg-lumina-lightSurface dark:bg-lumina-darkSurface border border-lumina-lightBorder dark:border-lumina-darkBorder p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#DD2A7B] to-[#8134AF] text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Débloquer Meta Graph API
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Portée (Reach), Impressions & Sauvegardes réelles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-4 space-y-4 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Règle Zéro-Fake :</strong> Meta verrouille les données de portée par utilisateur. Pour les afficher, votre compte Instagram @karam.drm doit être un compte Professionnel / Créateur lié à Meta for Developers.
            </span>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-gray-900 dark:text-white">Procédure en 3 étapes :</p>
            <ol className="list-decimal pl-4 space-y-1.5 text-gray-600 dark:text-gray-400">
              <li>Assurez-vous que <strong>@karam.drm</strong> est configuré en compte <em>Professionnel / Créateur</em>.</li>
              <li>Ouvrez le <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-blue-500 underline inline-flex items-center gap-0.5">Meta Graph API Explorer <ExternalLink className="w-3 h-3" /></a>.</li>
              <li>Générez un jeton d'accès avec les permissions : <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-[11px]">instagram_basic</code> et <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-[11px]">instagram_manage_insights</code>.</li>
            </ol>
          </div>

          {/* Formulaire Token */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Jeton d'accès utilisateur Meta (User Access Token)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="EAAGm0PX4ZCBO..."
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-lumina-darkElevated border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <Key className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DD2A7B] to-[#8134AF] text-white text-xs font-semibold shadow-lg shadow-pink-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Connecter et synchroniser
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
