import React, { useState, useMemo } from 'react';
import { X, Calendar, MessageSquare, TrendingUp, ChevronLeft, ChevronRight, Award, Users, Activity, Heart, UserPlus, Clock, Sparkles, HelpCircle, Repeat } from 'lucide-react';
import { cn } from '../../lib/utils';

export const TikTokLiveHistoryDrawer = ({ isOpen, onClose, historyArchives = [], initialSelectedLive = null }) => {
  const [selectedLive, setSelectedLive] = useState(initialSelectedLive);
  const [activeSubTab, setActiveSubTab] = useState('questions'); // 'questions' | 'repeats'

  // Si un live initial est passé, le sélectionner au montage/changement
  React.useEffect(() => {
    if (initialSelectedLive) {
      setSelectedLive(initialSelectedLive);
    }
  }, [initialSelectedLive]);

  // 1. Ordre antéchronologique strict : PLUS RÉCENT en HAUT ➔ PLUS ANCIEN en BAS
  const sortedArchives = useMemo(() => {
    return [...historyArchives].sort((a, b) => new Date(b.date || b.startedAt || 0) - new Date(a.date || a.startedAt || 0));
  }, [historyArchives]);

  if (!isOpen) return null;

  const topQuestions = selectedLive?.topQuestions || [];
  const topComments = selectedLive?.topComments || [];

  return (
    <>
      {/* Overlay sombre avec flou */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Panneau Latéral (Drawer) */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0F172A] dark:bg-[#111827]/98 backdrop-blur-2xl border-l border-slate-700/50 dark:border-white/10 z-[110] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header du Drawer */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50 dark:border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            {selectedLive ? (
              <button 
                onClick={() => setSelectedLive(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center -ml-2 text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#FE2C55]/10 border border-[#FE2C55]/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#FE2C55]" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {selectedLive ? "Détails du Live" : "Historique des Lives"}
                {!selectedLive && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20 font-mono">
                    {sortedArchives.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">
                {selectedLive ? "Analyse détaillée de la session" : "Cliquez sur un Live pour explorer l'analyse complète"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu dynamique */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-4">
          
          {!selectedLive ? (
            /* ETAT 1 : LISTE DES LIVES (DU PLUS RÉCENT AU PLUS ANCIEN) */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs text-gray-400 px-1 mb-2">
                <span className="flex items-center gap-1.5 font-medium text-gray-300">
                  <Sparkles size={13} className="text-[#25F4EE]" /> Sessions Live Enregistrées
                </span>
                <span className="text-[11px] text-gray-500 font-mono">Plus récent ➔ Plus ancien</span>
              </div>
              
              {sortedArchives.length > 0 ? (
                sortedArchives.map((live, index) => {
                  const startDate = new Date(live.date || live.startedAt || Date.now());
                  const endDate = live.endedAt ? new Date(live.endedAt) : null;
                  const dateStr = startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const startTimeStr = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  const endTimeStr = endDate ? endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
                  
                  const likes = live.totalLikes || live.likes || 0;
                  const comments = live.totalComments || live.comments || 0;
                  const followers = live.followers || live.newFollowers || 0;
                  const peakViewers = live.peakViewers || live.views || 0;
                  const duration = live.durationStr || live.duration || '-';

                  return (
                    <div 
                      key={live.id || live.roomId || index}
                      onClick={() => {
                        setSelectedLive(live);
                        setActiveSubTab('questions');
                      }}
                      className="bg-black/30 border border-white/10 hover:border-[#25F4EE]/50 hover:bg-white/5 p-4 rounded-2xl cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-[0_4px_20px_rgba(37,244,238,0.08)] hover:-translate-y-0.5 relative overflow-hidden"
                    >
                      {/* Badge NOUVEAU pour le plus récent */}
                      {index === 0 && (
                        <div className="absolute top-0 right-0 bg-[#FE2C55] text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                          Dernier Live
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-2.5">
                        <h3 className="font-bold text-white group-hover:text-[#25F4EE] transition-colors text-sm flex items-center gap-2">
                          <span>{live.title || 'Session Live TikTok'}</span>
                        </h3>

                        {/* Bouton Indicateur d'Analyse Minimaliste */}
                        <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400 group-hover:text-[#25F4EE] bg-white/5 group-hover:bg-[#25F4EE]/10 border border-white/5 group-hover:border-[#25F4EE]/30 px-2 py-0.5 rounded-lg transition-all">
                          <span>Détails</span>
                          <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>

                      {/* Date & Plage Horaire */}
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-300 mb-3 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5">
                        <Calendar className="w-3.5 h-3.5 text-[#FE2C55]" />
                        <span>{dateStr}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300 font-mono">
                          {startTimeStr}{endTimeStr ? ` à ${endTimeStr}` : ''}
                        </span>
                      </div>

                      {/* Métriques synchronisées */}
                      <div className="grid grid-cols-4 gap-2 pt-1 border-t border-white/5 text-xs font-mono">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-sans">Durée</span>
                          <span className="text-gray-300 font-bold flex items-center gap-1">
                            <Activity className="w-3 h-3 text-gray-400" /> {duration}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-sans">Pic Viewers</span>
                          <span className="text-white font-bold flex items-center gap-1">
                            <Users className="w-3 h-3 text-orange-400" /> {peakViewers}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-sans">Likes</span>
                          <span className="text-[#FE2C55] font-bold flex items-center gap-1">
                            <Heart className="w-3 h-3 text-[#FE2C55]" /> {new Intl.NumberFormat('fr-FR').format(likes)}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-sans">Comms</span>
                          <span className="text-blue-400 font-bold flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-blue-400" /> {new Intl.NumberFormat('fr-FR').format(comments)}
                          </span>
                        </div>
                      </div>

                      {/* Ligne Abonnés acquis & CTA Minimaliste Propre */}
                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-gray-400 flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5 text-emerald-400" /> Abonnés acquis :
                          <strong className="font-bold text-emerald-400 font-mono ml-0.5">+{followers}</strong>
                        </span>
                        
                        {/* Call to Action Minimaliste et Clair */}
                        <span className="text-[11px] font-semibold text-[#25F4EE] opacity-90 group-hover:opacity-100 flex items-center gap-1 transition-all">
                          <span>Voir l'analyse</span>
                          <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform text-[#25F4EE]" />
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-black/10 rounded-2xl border border-white/5">
                  <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Aucun live enregistré pour le moment.</p>
                  <p className="text-gray-600 text-xs mt-1">Vos futurs lives apparaîtront automatiquement ici.</p>
                </div>
              )}
            </div>
          ) : (
            /* ETAT 2 : DETAILS DU LIVE SÉLECTIONNÉ */
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Header Info du Live Sélectionné */}
              <div className="bg-black/30 rounded-2xl p-5 border border-white/10 space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#FE2C55] tracking-wider">Session Live</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{selectedLive.title || 'Session Live TikTok'}</h3>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#FE2C55]" />
                    {new Date(selectedLive.date || selectedLive.startedAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* 4 Grandes Cartes Métriques */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <span>Pic Viewers</span>
                      <Users size={13} className="text-orange-400" />
                    </div>
                    <p className="text-xl font-bold text-white font-mono mt-1">
                      {selectedLive.peakViewers || selectedLive.views || 0}
                    </p>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <span>Likes Live</span>
                      <Heart size={13} className="text-[#FE2C55]" />
                    </div>
                    <p className="text-xl font-bold text-[#FE2C55] font-mono mt-1">
                      {new Intl.NumberFormat('fr-FR').format(selectedLive.totalLikes || selectedLive.likes || 0)}
                    </p>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <span>Commentaires</span>
                      <MessageSquare size={13} className="text-blue-400" />
                    </div>
                    <p className="text-xl font-bold text-blue-400 font-mono mt-1">
                      {new Intl.NumberFormat('fr-FR').format(selectedLive.totalComments || selectedLive.comments || 0)}
                    </p>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <span>Abonnés Acquis</span>
                      <UserPlus size={13} className="text-emerald-400" />
                    </div>
                    <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
                      +{selectedLive.followers || selectedLive.newFollowers || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-white/5 pt-3">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} /> Durée totale : <strong className="text-white font-mono">{selectedLive.durationStr || selectedLive.duration}</strong>
                  </span>
                  <span className="font-mono text-gray-300">Moy. {selectedLive.avgViewers || 0} viewers</span>
                </div>
              </div>

              {/* Analyse IA des Questions & Demandes Fréquentes (avec 2 onglets) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Questions & Demandes</h4>
                  </div>

                  {/* Boutons Onglets Questions / Répétés */}
                  <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-[11px]">
                    <button
                      onClick={() => setActiveSubTab('questions')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 font-medium",
                        activeSubTab === 'questions' 
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold" 
                          : "text-gray-400 hover:text-gray-200"
                      )}
                    >
                      <HelpCircle size={12} />
                      <span>Questions ({topQuestions.length})</span>
                    </button>
                    <button
                      onClick={() => setActiveSubTab('repeats')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 font-medium",
                        activeSubTab === 'repeats' 
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold" 
                          : "text-gray-400 hover:text-gray-200"
                      )}
                    >
                      <Repeat size={12} />
                      <span>Demandes ({topComments.length})</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-black/30 border border-white/10 rounded-2xl p-4 shadow-lg">
                  {activeSubTab === 'questions' ? (
                    topQuestions.length > 0 ? (
                      <ul className="space-y-2.5 text-xs text-gray-300">
                        {topQuestions.map((q, idx) => (
                          <li key={idx} className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors">
                            <span className="leading-relaxed text-gray-200">"{q.original || q.text || q}"</span>
                            <span className="shrink-0 bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-md font-mono text-[10px]">
                              ×{q.count || 1}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6 text-xs text-gray-400 space-y-1">
                        <HelpCircle className="w-6 h-6 text-gray-500 mx-auto mb-1 opacity-60" />
                        <p className="font-semibold text-gray-300">Aucune question enregistrée pour cette session passée</p>
                        <p className="text-[11px] text-gray-500">Les questions sont capturées en direct dès le lancement de vos prochains lives.</p>
                      </div>
                    )
                  ) : (
                    topComments.length > 0 ? (
                      <ul className="space-y-2.5 text-xs text-gray-300">
                        {topComments.map((c, idx) => (
                          <li key={idx} className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-colors">
                            <span className="leading-relaxed text-gray-200">"{c.text || c.original || c}"</span>
                            <span className="shrink-0 bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-md font-mono text-[10px]">
                              ×{c.count || 1}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6 text-xs text-gray-400 space-y-1">
                        <Repeat className="w-6 h-6 text-gray-500 mx-auto mb-1 opacity-60" />
                        <p className="font-semibold text-gray-300">Aucune demande répétée enregistrée pour cette session passée</p>
                        <p className="text-[11px] text-gray-500">Les phrases récurrentes sont détectées en temps réel dès votre prochain live.</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Top Fans / Contributeurs */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Award className="w-4 h-4 text-orange-400" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Top Spectateurs Actifs</h4>
                </div>
                
                <div className="bg-black/30 rounded-2xl border border-white/10 overflow-hidden">
                  {(selectedLive.topFans && selectedLive.topFans.length > 0) ? (
                    selectedLive.topFans.map((fan, index) => (
                      <div key={fan.id || index} className="flex items-center justify-between p-3.5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono",
                            index === 0 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                            index === 1 ? "bg-gray-300/20 text-gray-200 border border-gray-300/30" :
                            index === 2 ? "bg-orange-700/20 text-orange-400 border border-orange-700/30" :
                            "bg-white/5 text-gray-400"
                          )}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-xs text-gray-200">@{fan.name || fan.nickname}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-300 bg-white/5 px-2.5 py-1 rounded-lg font-mono">
                          <MessageSquare className="w-3 h-3 text-blue-400" /> {fan.score || fan.commentsCount || 1} msgs
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-400 text-xs space-y-1">
                      <Award className="w-6 h-6 text-gray-500 mx-auto mb-1 opacity-60" />
                      <p className="font-semibold text-gray-300">Classement non enregistré pour cette session passée</p>
                      <p className="text-[11px] text-gray-500">Le classement des spectateurs les plus actifs sera calculé automatiquement dès votre prochain live en direct.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default TikTokLiveHistoryDrawer;
