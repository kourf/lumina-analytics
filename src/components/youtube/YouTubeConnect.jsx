import React, { useState } from 'react';
import { 
  Lock, Unlock, DollarSign, Clock, Users, ShieldAlert, Key, 
  RefreshCw, Smartphone, Share2, UserMinus, CheckCircle2, Cloud 
} from 'lucide-react';
import { auth } from '../../config/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

export const YouTubeConnect = ({ 
  onTokenReceived, 
  isConnected = false, 
  lastSynced = null, 
  onDisconnect 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/yt-analytics.readonly');
      provider.addScope('https://www.googleapis.com/auth/yt-analytics-monetary.readonly');
      provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;
      
      if (accessToken) {
        if (onTokenReceived) {
          onTokenReceived(accessToken);
        }
      } else {
        throw new Error("Impossible de récupérer le jeton d'accès YouTube.");
      }
    } catch (err) {
      console.error("Erreur OAuth YouTube:", err);
      setError(err.message || "La connexion sécurisée a échoué.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Erreur lors de la déconnexion Firebase Auth:", err);
    }
    if (onDisconnect) {
      onDisconnect();
    }
  };

  const formatLastSync = (ts) => {
    if (!ts) return null;
    try {
      const d = new Date(ts);
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return null;
    }
  };

  const formattedDate = formatLastSync(lastSynced);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-[#181824] to-[#12121A] rounded-3xl p-6 lg:p-8 border border-gray-800 shadow-2xl relative overflow-hidden mt-8">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
        
        <div className="flex-1 w-full">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-2xl ${isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
              {isConnected ? <Unlock size={24} /> : <Lock size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {isConnected ? "Accès Privé Actif & Synchronisé Multi-Appareils" : "Débloquez les Données Secrètes de votre Chaîne"}
                </h2>
                {isConnected && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Cloud size={10} /> Cloud Sync
                  </span>
                )}
              </div>
              {isConnected && formattedDate && (
                <p className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 size={12} />
                  Dernière actualisation : {formattedDate}
                </p>
              )}
            </div>
          </div>
          
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            {isConnected 
              ? "Vos métriques confidentielles (revenus, rétention moyenne, partages secrets, abonnés perdus, types d'appareils, etc.) sont synchronisées en continu sur tous vos appareils (PC, Smartphone, Tablette) sans nécessiter de reconnexion permanente."
              : "Connectez votre compte YouTube de manière sécurisée (Google OAuth 2.0). Une seule connexion suffit : vos données secrètes seront instantanément accessibles sur votre PC et votre smartphone en toute sérénité."}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-black/40 border border-gray-800">
              <DollarSign size={18} className="text-green-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-gray-400 text-center">Revenus RPM</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-black/40 border border-gray-800">
              <Clock size={18} className="text-orange-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-gray-400 text-center">Rétention</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-black/40 border border-gray-800">
              <Share2 size={18} className="text-indigo-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-gray-400 text-center">Partages</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-black/40 border border-gray-800">
              <Smartphone size={18} className="text-purple-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-gray-400 text-center">Mobiles/TV</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-black/40 border border-gray-800 col-span-2 sm:col-span-1">
              <UserMinus size={18} className="text-red-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-gray-400 text-center">Abonnés perdus</span>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4">
              <ShieldAlert size={14} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="w-full md:w-auto flex flex-col items-center shrink-0">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Key size={18} />
                  Connecter YouTube (Google OAuth)
                </>
              )}
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full md:w-auto px-6 py-3 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-semibold rounded-2xl transition-all border border-indigo-500/30 flex items-center justify-center gap-2 text-sm active:scale-95 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></div>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Rafraîchir les données privées
                  </>
                )}
              </button>
              <button
                onClick={handleDisconnect}
                className="w-full md:w-auto px-6 py-2.5 bg-gray-800/80 hover:bg-red-500/20 text-gray-400 hover:text-red-400 font-medium rounded-2xl transition-all border border-gray-700/60 hover:border-red-500/30 text-xs active:scale-95 cursor-pointer"
              >
                Déconnecter / Supprimer l'accès
              </button>
            </div>
          )}
          <p className="text-[10px] text-gray-500 mt-4 max-w-[260px] text-center leading-tight">
            {isConnected 
              ? "Données synchronisées dans votre Firestore sécurisé, partagées instantanément avec votre smartphone."
              : "Authentification officielle Google OAuth 2.0 sécurisée en lecture seule."}
          </p>
        </div>

      </div>
    </div>
  );
};
