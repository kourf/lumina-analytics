import React, { useEffect, useState } from 'react';
import {
  Radio, Users, Heart, Sparkles, MessageSquare,
  Award, TrendingUp, Clock, ShieldCheck, History, BarChart2, Activity
} from 'lucide-react';

// Importation du hook de connexion temps réel 0€ (existant dans votre architecture)
import { useTikTokLiveSocket } from '../../hooks/useTikTokLiveSocket';
import { db } from '../../config/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export function TikTokLiveHub() {
  // Le hook capte le flux automatiquement dès que @karam.drame lance un live
  const { isLive, liveData, chatMessages, connect, disconnect } = useTikTokLiveSocket('@karam.drame');

  // État local pour stocker les véritables archives issues de Firestore (via live-daemon)
  const [archives, setArchives] = useState([]);

  useEffect(() => {
    // Connexion silencieuse et automatique au Webcast en arrière-plan
    if (connect) connect();

    const fetchArchives = async () => {
      try {
        const archivesRef = collection(db, 'tiktok_archives');
        const q = query(archivesRef, orderBy('date', 'desc'), limit(6)); // Example limit
        const querySnapshot = await getDocs(q);

        const fetchedArchives = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setArchives(fetchedArchives);
      } catch (error) {
        console.error("Error fetching tiktok archives:", error);
      }
    };

    fetchArchives();

    return () => {
      if (disconnect) disconnect();
    };
  }, [connect, disconnect]);

  return (
    <div className="space-y-8 w-full text-slate-100" data-testid="tiktok-live-hub">
      {/* 1. BARRE DE STATUT GLOBALE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Radio className={`w-6 h-6 ${isLive ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} data-testid={isLive ? "live-radio" : "offline-radio"} />
            {isLive && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-wide">TikTok Live Hub Central</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                @karam.drame
              </span>
            </div>
            <p className="text-xs text-slate-400">Télémétrie 100% automatisée • Données réelles uniquement</p>
          </div>
        </div>

        {/* Badge d'état dynamique */}
        <div className={`px-4 py-1.5 rounded-xl text-xs font-bold border ${isLive ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
          {isLive ? 'DIFFUSION EN COURS' : 'HORS LIGNE'}
        </div>
      </div>

      {/* 2. SUPERVISION DU DIRECT (Affiché uniquement si isLive est true) */}
      {isLive ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="live-supervision">

          {/* Bloc Principal Live */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-32 h-32 text-red-500" /></div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono mb-3">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Démarré à : {liveData?.startedAt || '--:--'}</span>
            </div>
            <h3 className="text-xl font-bold text-white leading-tight mb-2">{liveData?.title || 'Titre du live en cours...'}</h3>
          </div>

          {/* KPI : Audience */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Audience</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-3 text-3xl font-black text-white font-mono">{liveData?.kpis?.viewers?.toLocaleString() || 0}</div>
          </div>

          {/* KPI : Likes */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">J'aime</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <div className="my-3 text-3xl font-black text-white font-mono">{liveData?.kpis?.totalLikes?.toLocaleString() || 0}</div>
          </div>

          {/* Analyse du Chat en Temps Réel */}
          <div className="md:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase text-slate-300">Analyse du Tchat en direct</span>
              </div>
              <div className="flex items-center space-x-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3" />
                <span>Modération Active</span>
              </div>
            </div>
            <div className="space-y-2.5 overflow-y-auto max-h-48 font-sans" data-testid="chat-messages">
              {chatMessages?.length > 0 ? chatMessages.map((msg, i) => (
                <div key={i} className="text-xs p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <span className="font-semibold text-indigo-300 mr-2">{msg.user} :</span>
                  <span className="text-slate-300">{msg.comment}</span>
                </div>
              )) : (
                <div className="text-xs text-slate-500 text-center py-4">En attente de messages...</div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* ÉTAT HORS LIGNE */
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed" data-testid="offline-state">
          <Radio className="w-12 h-12 text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-400">Karamokho n'est pas en direct</h3>
          <p className="text-slate-500 text-sm mt-1">La grille d'analyse apparaîtra ici automatiquement au prochain live.</p>
        </div>
      )}

      {/* 3. ARCHIVES ET HISTORIQUE (Toujours visible) */}
      <div className="pt-4">
        <div className="flex items-center space-x-2 mb-6">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">Archives des Diffusions</h3>
        </div>

        {archives.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="archives-grid">
            {archives.map((archive, index) => (
              <div key={archive.id || index} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-mono text-slate-400">{archive.date || archive.createdAt || 'N/A'}</span>
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Vues :</span> <span className="font-bold text-white">{archive.views || archive.viewers || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Partages :</span> <span className="font-bold text-white">{archive.shares || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Nvx Abonnés :</span> <span className="font-bold text-emerald-400">+{archive.followers || 0}</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 rounded-2xl bg-slate-900/40 border border-slate-800" data-testid="empty-archives">
            <BarChart2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Les archives extraites par vos scripts d'automatisation s'afficheront ici.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TikTokLiveHub;