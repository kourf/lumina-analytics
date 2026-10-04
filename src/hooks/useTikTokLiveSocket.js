import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

/**
 * Hook React pour consommer le flux temps réel TikTok Live avec architecture Dual-Source :
 * 
 * 1. SOURCE PRIMAIRE : WebSocket Socket.io (Worker Render)
 *    - Fréquence sub-seconde pour l'affichage en direct des compteurs, tchat et likes.
 * 
 * 2. SOURCE DE SECOURS (FALLBACK TEMPS RÉEL) : Firestore onSnapshot
 *    - Si le Worker Render s'endort (veille après 15 min d'inactivité) ou si la connexion
 *      WebSocket échoue/se coupe, le hook bascule INSTANTANÉMENT et de manière 100% transparente
 *      sur l'écoute en direct de la base de données Firestore (`users/karamokho`).
 *    - Dès que le WebSocket se reconnecte (ou que le serveur est réveillé), la priorité repasse
 *      au flux haute fréquence.
 * 
 * @param {string} [serverUrl] - URL du serveur WebSocket (défaut : VITE_TIKTOK_WORKER_WS_URL)
 * @param {object} [fallbackData] - Données initiales de secours (provenant des props)
 * @param {string} [targetUserId='karamokho'] - Identifiant du document Firestore de l'utilisateur
 */
export function useTikTokLiveSocket(serverUrl, fallbackData = {}, targetUserId = 'karamokho') {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // Sécurisation de l'URL du serveur WebSocket
  const validUrl = (typeof serverUrl === 'string' && (serverUrl.startsWith('http://') || serverUrl.startsWith('https://') || serverUrl.startsWith('ws://') || serverUrl.startsWith('wss://')))
    ? serverUrl
    : undefined;
  const configuredUrl = validUrl || import.meta.env.VITE_TIKTOK_WORKER_WS_URL;
  const isLocalOnHttps = isHttps && (!configuredUrl || configuredUrl.includes('localhost') || configuredUrl.includes('127.0.0.1'));
  const wsUrl = isLocalOnHttps ? null : (configuredUrl || 'http://localhost:8080');

  // États de connectivité et de source active
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [dataSource, setDataSource] = useState('initializing'); // 'websocket' | 'firestore' | 'fallback'

  // Données Live fondamentales
  const [isLive, setIsLive] = useState(Boolean(fallbackData?.isLive));
  const [sessionId, setSessionId] = useState(fallbackData?.session_id || fallbackData?.sessionId || fallbackData?.roomId || null);
  const [startedAt, setStartedAt] = useState(fallbackData?.startedAt || fallbackData?.started_at || null);

  // Métriques en temps réel unifiées
  const [metrics, setMetrics] = useState({
    viewers: Number(fallbackData?.currentViewers || fallbackData?.viewerCount || 0),
    peakViewers: Number(fallbackData?.peakViewers || 0),
    likes: Number(fallbackData?.likes ?? fallbackData?.totalLikes ?? 0),
    comments: Number(fallbackData?.comments ?? fallbackData?.totalComments ?? 0),
    shares: Number(fallbackData?.shares ?? fallbackData?.totalShares ?? 0),
    followers: Number(fallbackData?.followers ?? fallbackData?.newFollowers ?? 0),
    diamonds: Number(fallbackData?.diamonds ?? fallbackData?.totalDiamonds ?? 0),
    uptimeFormatted: '00:00:00',
    topContributor: fallbackData?.topContributor || { nickname: '', count: 0 },
    topDonator: fallbackData?.topDonator || { nickname: '', diamonds: 0 },
    topQuestions: Array.isArray(fallbackData?.topQuestions) ? fallbackData.topQuestions : [],
    topContributors: Array.isArray(fallbackData?.topContributors) ? fallbackData.topContributors : []
  });

  // Tchat en direct (tampon glissant des 50 derniers messages)
  const [chatMessages, setChatMessages] = useState(
    Array.isArray(fallbackData?.recentComments) ? fallbackData.recentComments : []
  );

  // Timeline minute par minute
  const [liveTimeline, setLiveTimeline] = useState(
    Array.isArray(fallbackData?.timeline) ? fallbackData.timeline : []
  );

  // Dernière session archivée
  const [lastArchivedSession, setLastArchivedSession] = useState(null);

  const socketRef = useRef(null);
  const isSocketConnectedRef = useRef(false);

  // Garde en référence synchrone l'état de connexion Socket pour le listener Firestore
  useEffect(() => {
    isSocketConnectedRef.current = isSocketConnected;
  }, [isSocketConnected]);

  // Synchronisation avec les props initiales si le live démarre et que rien n'est encore reçu
  useEffect(() => {
    if (!isSocketConnectedRef.current && fallbackData && Object.keys(fallbackData).length > 0) {
      if (fallbackData.isLive !== undefined) {
        setIsLive(Boolean(fallbackData.isLive));
      }
      if (fallbackData.started_at || fallbackData.startedAt) {
        setStartedAt(fallbackData.started_at || fallbackData.startedAt);
      }
      if (fallbackData.roomId || fallbackData.session_id) {
        setSessionId(fallbackData.session_id || fallbackData.roomId);
      }
    }
  }, [fallbackData?.isLive, fallbackData?.started_at, fallbackData?.startedAt, fallbackData?.roomId]);

  // =========================================================================
  // 1. MÉCANISME DE SECOURS TEMPS RÉEL VIA FIRESTORE onSnapshot
  // =========================================================================
  useEffect(() => {
    // Si Firebase n'est pas initialisé (ex: environnement de test Vitest), on ignore gracieusement
    if (!db || typeof onSnapshot !== 'function') return;

    let unsubscribe = null;

    try {
      const userDocRef = doc(db, 'users', targetUserId);

      unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const liveApi = data?.tiktokLiveAPI || {};

        // SI LE WEBSOCKET N'EST PAS CONNECTÉ (ex: Render en veille / panne réseau / démarrage)
        // ALORS Firestore onSnapshot prend immédiatement et totalement le relais !
        if (!isSocketConnectedRef.current) {
          setDataSource('firestore');

          const firestoreIsLive = Boolean(
            liveApi.isLive === true || 
            data?.isLive === true || 
            data?.tiktokAPI?.isLive === true
          );

          setIsLive(firestoreIsLive);

          const liveRoomId = liveApi.roomId || liveApi.session_id || null;
          if (liveRoomId) setSessionId(liveRoomId);

          const startTimestamp = liveApi.started_at || liveApi.startedAt || null;
          if (startTimestamp) setStartedAt(startTimestamp);

          // Extraction et mise à jour directe des métriques de secours
          setMetrics(prev => ({
            ...prev,
            viewers: firestoreIsLive ? Number(liveApi.currentViewers || liveApi.viewerCount || 0) : 0,
            peakViewers: firestoreIsLive ? Math.max(Number(liveApi.peakViewers || 0), Number(liveApi.currentViewers || 0), prev.peakViewers) : 0,
            likes: Number(liveApi.likes ?? liveApi.totalLikes ?? prev.likes),
            comments: Number(liveApi.comments ?? liveApi.totalComments ?? prev.comments),
            shares: Number(liveApi.shares ?? liveApi.totalShares ?? prev.shares),
            followers: Number(liveApi.newFollowers ?? liveApi.followers ?? prev.followers),
            diamonds: Number(liveApi.totalDiamonds ?? liveApi.diamonds ?? prev.diamonds),
            topContributor: liveApi.topContributor || prev.topContributor,
            topDonator: liveApi.topDonator || prev.topDonator,
            topQuestions: (Array.isArray(liveApi.topQuestions) && liveApi.topQuestions.length > 0)
              ? liveApi.topQuestions
              : prev.topQuestions,
            topContributors: (Array.isArray(liveApi.topContributors) && liveApi.topContributors.length > 0)
              ? liveApi.topContributors
              : (Array.isArray(liveApi.topCommenters) && liveApi.topCommenters.length > 0 ? liveApi.topCommenters : prev.topContributors)
          }));

          // Synchronisation de la courbe de rétention depuis Firestore
          if (Array.isArray(liveApi.timeline) && liveApi.timeline.length > 0) {
            setLiveTimeline(liveApi.timeline);
          } else if (Array.isArray(liveApi.history) && liveApi.history.length > 0) {
            setLiveTimeline(liveApi.history);
          }

          // Synchronisation des commentaires récents
          if (Array.isArray(liveApi.recentComments) && liveApi.recentComments.length > 0) {
            setChatMessages(prev => (prev.length === 0 ? liveApi.recentComments : prev));
          }
        }
      }, (err) => {
        console.warn('[useTikTokLiveSocket] Écoute Firestore Fallback avertissement:', err?.message || err);
      });
    } catch (err) {
      console.warn('[useTikTokLiveSocket] Erreur attachement Firestore Fallback:', err?.message || err);
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [targetUserId]);

  // =========================================================================
  // 2. MOTEUR WEBSOCKET SOCKET.IO HAUTE FRÉQUENCE (WORKER RENDER)
  // =========================================================================
  useEffect(() => {
    if (!wsUrl) {
      setIsSocketConnected(false);
      setDataSource('firestore');
      return;
    }

    // Initialisation du client Socket.io avec reconnexion automatique résiliente
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 8000
    });

    socketRef.current = socket;

    // A. Événement : Connexion réussie au Worker
    socket.on('connect', () => {
      console.log(`⚡ [useTikTokLiveSocket] Connecté au WebSocket Worker (${wsUrl})`);
      setIsSocketConnected(true);
      setDataSource('websocket');
      socket.emit('requestState');
    });

    // B. Événement : Déconnexion (Render s'endort ou coupure)
    socket.on('disconnect', (reason) => {
      console.warn(`🔌 [useTikTokLiveSocket] Déconnecté du Worker WebSocket (${reason}). Bascule immédiate sur Firestore Fallback.`);
      setIsSocketConnected(false);
      setDataSource('firestore');
    });

    // C. Événement : Erreur de connexion (Render indisponible ou réveil en cours)
    socket.on('connect_error', () => {
      setIsSocketConnected(false);
      setDataSource('firestore');
    });

    // D. Événement : Statut Live TikTok
    socket.on('liveStatus', (data) => {
      setIsLive(Boolean(data?.isLive));
      if (data?.isLive) {
        setSessionId(data?.sessionId || data?.roomId || null);
        setStartedAt(data?.startedAt || null);
        if (Array.isArray(data?.timeline) && data.timeline.length > 0) {
          setLiveTimeline(data.timeline);
        }
      } else {
        setMetrics(prev => ({
          ...prev,
          viewers: 0
        }));
      }
    });

    // E. Événement : Mise à jour des métriques haute fréquence
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
        topQuestions: Array.isArray(data.topQuestions) && data.topQuestions.length > 0 ? data.topQuestions : prev.topQuestions,
        topContributors: Array.isArray(data.topContributors) && data.topContributors.length > 0 ? data.topContributors : prev.topContributors
      }));
    });

    // F. Événement : Message dans le tchat en direct
    socket.on('chatMessage', (msg) => {
      setChatMessages(prev => {
        const next = [msg, ...prev];
        return next.slice(0, 50); // Maintien strict de 50 messages max
      });
    });

    // G. Événement : Nouveau point de courbe de rétention
    socket.on('timelinePoint', (point) => {
      setLiveTimeline(prev => [...prev, point]);
    });

    // H. Événement : Clôture de diffusion & archivage
    socket.on('streamEnded', (data) => {
      console.log('🛑 [useTikTokLiveSocket] Diffusion terminée & archivée :', data?.session);
      setIsLive(false);
      setSessionId(null);
      setStartedAt(null);
      setLastArchivedSession(data?.session || null);

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
        topQuestions: [],
        topContributors: []
      });
      setChatMessages([]);
      setLiveTimeline([]);
    });

    // Nettoyage impératif lors du démontage pour éviter les fuites mémoire
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

  // Actions de contrôle
  const requestSync = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('requestState');
    }
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
  }, []);

  const liveData = {
    isLive,
    startedAt,
    title: sessionId ? `Live session ${sessionId}` : '',
    kpis: {
      viewers: metrics.viewers,
      peakViewers: metrics.peakViewers,
      totalLikes: metrics.likes,
      likes: metrics.likes,
      shares: metrics.shares,
      followers: metrics.followers,
      comments: metrics.comments,
      diamonds: metrics.diamonds,
    }
  };

  return {
    isSocketConnected,
    isFallbackActive: !isSocketConnected,
    dataSource, // 'websocket' | 'firestore'
    isLive,
    sessionId,
    startedAt,
    metrics,
    chatMessages,
    liveTimeline,
    lastArchivedSession,
    requestSync,
    connect,
    disconnect,
    liveData
  };
}
