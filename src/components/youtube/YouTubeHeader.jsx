import React, { useState } from 'react';
import { ExternalLink, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export const YouTubeHeader = ({ channel, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState(null); // 'success' | 'error' | null

  if (!channel) return null;

  const lastSyncDate = channel.lastSync ? new Date(channel.lastSync.seconds * 1000).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'À l\'instant';

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    setRefreshStatus(null);
    try {
      await onRefresh();
      setRefreshStatus('success');
      setTimeout(() => setRefreshStatus(null), 5000);
    } catch (error) {
      console.error(error);
      setRefreshStatus('error');
      setTimeout(() => setRefreshStatus(null), 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Messages de statut */}
      {refreshStatus === 'success' && (
        <div className="animate-fade-in flex items-center gap-2 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 p-3 rounded-xl text-sm font-medium border border-green-200 dark:border-green-500/20">
          <CheckCircle size={16} />
          Données YouTube actualisées avec succès. Dernière synchronisation : {lastSyncDate}
        </div>
      )}
      {refreshStatus === 'error' && (
        <div className="animate-fade-in flex items-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm font-medium border border-red-200 dark:border-red-500/20">
          <AlertCircle size={16} />
          Impossible d’actualiser les données YouTube. Vérifie ta connexion.
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-lumina-lightSurface dark:bg-lumina-darkSurface hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/10 transition-all duration-300 p-6 rounded-3xl border border-lumina-lightBorder dark:border-lumina-darkBorder shadow-sm">
        <div className="flex items-center gap-5">
          <img 
            src={channel.thumbnail} 
            alt={channel.title} 
            className="w-16 h-16 rounded-full border-2 border-red-500/20 shadow-md"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {channel.title}
              <a 
                href={`https://youtube.com/${channel.customUrl}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-red-500 hover:text-red-600 transition-colors"
              >
                <ExternalLink size={18} />
              </a>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 max-w-md">
              {channel.description || "Chaîne YouTube"}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Dernière synchronisation : {lastSyncDate}
          </div>
          <button 
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className={`flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 font-medium rounded-xl transition-all text-sm ${
              isRefreshing 
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                : 'bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Actualisation en cours...' : 'Actualiser'}
          </button>
        </div>
      </div>
    </div>
  );
};

