import React, { useState } from 'react';
import { Info, Lock, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const DataAvailability = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
            <Info size={18} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Transparence des données (API)</h4>
            <p className="text-xs text-gray-500">Ce que l'application peut afficher ou non selon votre niveau d'accès actuel</p>
          </div>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in border-t border-gray-200 dark:border-gray-700 mt-2">
          
          {/* Données Publiques (Actuelles) */}
          <div className="space-y-4 pt-4">
            <h5 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              Actuellement synchronisé (Données Publiques)
            </h5>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div> Nom, avatar et abonnés de la chaîne</li>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div> Liste de vos 50 dernières vidéos publiques</li>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div> Vues, likes et commentaires par vidéo</li>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div> Calcul du taux d'engagement global</li>
            </ul>
          </div>

          {/* Données Privées (OAuth) */}
          <div className="space-y-4 pt-4">
            <h5 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock size={16} className="text-amber-500" />
              Nécessite une Connexion Propriétaire (OAuth)
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Les données suivantes sont masquées par Google. Pour les débloquer, vous devrez vous connecter avec votre compte Google ("Sign in with Google").
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></div> Revenus estimés et CPM/RPM</li>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></div> Temps de visionnage et rétention</li>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></div> Âge, sexe et géographie de l'audience</li>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></div> Sources de trafic (Recherche, Suggestions, etc.)</li>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></div> Statistiques des vidéos privées ou non répertoriées</li>
            </ul>
            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
              <p className="text-xs text-indigo-800 dark:text-indigo-400 font-medium flex items-center gap-2">
                <Info size={14} /> Vous pouvez débloquer ces données en utilisant le bouton "Se connecter avec Google" ci-dessus.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

