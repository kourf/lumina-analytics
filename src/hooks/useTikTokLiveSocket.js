import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Hook React pour consommer le flux WebSocket temps réel du Worker TikTok Live.
 * 
 * Fonctionnalités :
 * - Connexion Socket.io avec reconnexion automatique & fallback gracieux.
 * - Écoute des événements : liveStatus, metricsUpdate, chatMessage, timelinePoint, streamEnded.
 * - Gestion du reset automatique à zéro lors de la fin de diffusion (streamEnded).
 * - Nettoyage strict des écouteurs pour prévenir toute fuite de mémoire.
 * 
 * @param {string} [serverUrl] - URL du serveur WebSocket (défaut : VITE_TIKTOK_WORKER_WS_URL ou auto-détection)
 * @param {object} [fallbackData] - Données initiales issues de Firestore
 */
export function useTikTokLiveSocket(serverUrl, fallbackData = {}) {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const configuredUrl = serverUrl || import.meta.env.VITE_TIKTOK_WORKER_WS_URL;
  const isLocalOnHttps = isHttps && (!configuredUrl || configuredUrl.includes('localhost') || configuredUrl.includes('127.0.0.1'));
  const wsUrl = isLocalOnHttps ? null : (configuredUrl || 'http://localhost:8080');
  
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isLive, setIsLive] = useState(Boolean(fallbackData?.isLive));
  const [sessionId, setSessionId] = useState(fallbackData?.session_id || null);
  const [startedAt, setStartedAt] = useState(fallbackData?.startedAt || fallbackData?.started_at || null);
  
  // Métriques temps réel
  const [metrics, setMetrics] = useState({
    viewers: Number(fallbackData?.currentViewers || 0),
    peakViewers: Number(fallbackData?.peakViewers || 0),
    likes: Number(fallbackData?.likes || 0),
    comments: Number(fallbackData?.comments || 0),
    shares: Number(fallbackData?.shares || 0),
    followers: Number(fallbackData?.followers || 0),
    diamonds: Number(fallbackData?.diamonds || 0),
    uptimeFormatted: '00:00:00',
    topContributor: fallbackData?.topContributor || { nickname: '', count: 0 },
    topDonator: fallbackData?.topDonator || { nickname: '', diamonds: 0 },
    topQuestions: fallbackData?.topQuestions || []
  });

  // Flux de tchat en direct (tampon glissant des 50 derniers messages)
  const [chatMessages, setChatMessages] = useState([]);
  
  // Courbe de rétention en direct
  const [liveTimeline, setLiveTimeline] = useState([]);
  
  // Dernière session archivée
  const [lastArchivedSession, setLastArchivedSession] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!wsUrl) {
      // En production HTTPS sans serveur WSS dédié : synchronisation temps réel 100% via Firestore
      setIsSocketConnected(false);
      return;
    }

    // Connexion au serveur WebSocket Socket.io
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 8000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[Socket.io] Connecté au serveur Live Worker (${wsUrl})`);
      setIsSocketConnected(true);
      socket.emit('requestState');
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket.io] Déconnecté du serveur Live Worker:', reason);
      setIsSocketConnected(false);
    });

    socket.on('connect_error', (err) => {
      // Indisponibilité du worker local : fallback transparent sur Firestore
      setIsSocketConnected(false);
    });

    // 1. Événement de statut global
    socket.on('liveStatus', (data) => {
      setIsLive(Boolean(data?.isLive));
      if (data?.isLive) {
        setSessionId(data?.sessionId || data?.roomId || null);
        setStartedAt(data?.startedAt || null);
        if (Array.isArray(data?.timeline) && data.timeline.length > 0) {
          setLiveTimeline(data.timeline);
        }
      } else {
        // Le live est arrêté : réinitialisation des compteurs d'audience
        setMetrics(prev => ({
          ...prev,
          viewers: 0
        }));
      }
    });

    // 2. Événement de mise à jour des métriques haute fréquence
    socket.on('metricsUpdate', (data) => {
      setMetrics(prev => ({
        ...prev,
        viewers: data.viewersCount !== undefined ? data.viewersCount : prev.viewers,
        peakViewers: Math.max(prev.peakViewers, data.peakViewers || 0),
        likes: data.totalLikes !== undefined ? data.totalLikes : prev.likes,
        comments: data.totalComments !== undefined ? data.totalComments : prev.comments,
        shares: data.totalShares !== undefined ? data.totalShares : prev.shares,
        followers: data.newFollowers !== undefined ? data.newFollowers : prev.followers,
        diamonds: data.totalDiamonds !== undefined ? data.totalDiamonds : prev.diamonds,
        uptimeFormatted: data.uptimeFormatted || prev.uptimeFormatted,
        topContributor: data.topContributor || prev.topContributor,
        topDonator: data.topDonator || prev.topDonator,
        topQuestions: Array.isArray(data.topQuestions) && data.topQuestions.length > 0 ? data.topQuestions : prev.topQuestions
      }));
    });

    // 3. Nouveau message dans le tchat en direct
    socket.on('chatMessage', (msg) => {
      setChatMessages(prev => {
        const next = [msg, ...prev];
        return next.slice(0, 50); // Maintien d'un maximum de 50 messages en mémoire (zéro fuite)
      });
    });

    // 4. Nouveau point de courbe de rétention
    socket.on('timelinePoint', (point) => {
      setLiveTimeline(prev => [...prev, point]);
    });

    // 5. Clôture de diffusion & archivage (streamEnded)
    socket.on('streamEnded', (data) => {
      console.log('🛑 [Socket.io] Diffusion terminée et archivée :', data?.session);
      setIsLive(false);
      setSessionId(null);
      setStartedAt(null);
      setLastArchivedSession(data?.session || null);

      // Réinitialisation stricte du dashboard à zéro
      setMetrics({
        viewers: 0,
        peakViewers: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        followers: 0,
        diamonds: 0,
        uptimeFormatted: '00:00:00',
        topContributor: { nickname: '', count: 0 },
        topDonator: { nickname: '', diamonds: 0 },
        topQuestions: []
      });
      setChatMessages([]);
      setLiveTimeline([]);
    });

    // Nettoyage impératif des écouteurs et déconnexion lors du démontage du composant
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('liveStatus');
      socket.off('metricsUpdate');
      socket.off('chatMessage');
      socket.off('timelinePoint');
      socket.off('streamEnded');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [wsUrl]);

  // Déclencheur manuel pour forcer la synchronisation de l'état
  const requestSync = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('requestState');
    }
  }, []);

  return {
    isSocketConnected,
    isLive,
    sessionId,
    startedAt,
    metrics,
    chatMessages,
    liveTimeline,
    lastArchivedSession,
    requestSync
  };
}
