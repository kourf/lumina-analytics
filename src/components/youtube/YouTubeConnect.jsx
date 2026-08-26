import React, { useState, useEffect } from 'react';
import { Lock, Unlock, DollarSign, Clock, Users, ShieldAlert, Key } from 'lucide-react';
import { auth } from '../../config/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

export const YouTubeConnect = ({ onTokenReceived }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ne pas utiliser onAuthStateChanged pour restaurer l'état car on a besoin 
    // d'un nouveau accessToken YouTube à chaque fois que la page est rechargée.
    // L'utilisateur doit explicitement cliquer sur le bouton pour récupérer le token.
  }, []);

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
        setIsConnected(true);
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
    await signOut(auth);
    setIsConnected(false);
    if (onTokenReceived) {
      onTokenReceived(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-[#1E1E2A] rounded-3xl p-6 lg:p-8 border border-gray-800 shadow-2xl relative overflow-hidden mt-8">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
              {isConnected ? <Unlock size={24} /> : <Lock size={24} />}
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {isConnected ? "Accès Sécurisé Déverrouillé" : "Débloquez les Données Secrètes"}
            </h2>
          </div>
          
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            {isConnected 
              ? "Votre tableau de bord est connecté en temps réel à l'API YouTube Analytics. Vos revenus, votre rétention d'audience et vos données démographiques sont maintenant visibles."
              : "Connectez votre compte YouTube de manière sécurisée (OAuth 2.0) pour analyser en temps réel vos données privées : revenus, rétention exacte et démographie d'audience."}
          </p>

          <div className="flex gap-4 mb-6">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/30 border border-gray-700 flex-1">
              <DollarSign size={20} className="text-green-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-gray-500">Revenus RPM</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/30 border border-gray-700 flex-1">
              <Clock size={20} className="text-orange-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-gray-500">Rétention</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/30 border border-gray-700 flex-1">
              <Users size={20} className="text-blue-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-gray-500">Démographie</span>
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
              className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Key size={18} />
                  Connecter YouTube
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="w-full md:w-auto px-8 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl transition-all border border-gray-700 active:scale-95"
            >
              Déconnecter
            </button>
          )}
          <p className="text-[10px] text-gray-500 mt-4 max-w-[250px] text-center">
            Les données sont traitées en temps réel et ne sont pas stockées sur nos serveurs.
          </p>
        </div>

      </div>
    </div>
  );
};

