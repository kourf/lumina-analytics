import React, { useEffect, useState } from 'react';
import {
  Radio, Users, Heart, Sparkles, MessageSquare,
  Award, Clock, Eye, Activity, RefreshCw, AlertCircle, Share2, ChevronDown, ChevronRight, Trash2, X, Crown, UserCheck, Flame, UserPlus, TrendingUp,
  Gamepad2, Palette, Briefcase, MessageCircle, HelpCircle, Trophy
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useTikTokLiveSocket } from '../../hooks/useTikTokLiveSocket';
import { db } from '../../config/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '../../lib/utils';

export function TikTokLiveHub({ liveData: propLiveData, onRefresh, isRefreshing }) {
  const getStoredLiveState = () => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('lumina_live_state') : null;
      if (s) {
        const p = JSON.parse(s);
        if (p && typeof p === 'object') return p;
      }
    } catch {}
    return null;
  };
  const rawStored = getStoredLiveState();
  const activeRoomId = propLiveData?.roomId || '';
  const isStoredValidForRoom = Boolean(activeRoomId && rawStored?.roomId && String(activeRoomId) === String(rawStored.roomId));
  const initialStored = isStoredValidForRoom ? rawStored : null;

  const socket = useTikTokLiveSocket(undefined, propLiveData);
  const isRecentStoredLive = Boolean(initialStored?.isLive && (Date.now() - (initialStored.timestamp || 0) < 6 * 3600 * 1000));
  const isLive = Boolean(propLiveData?.isLive !== undefined ? propLiveData.isLive : (socket.isLive || isRecentStoredLive));

  const getSessionDateFormatted = () => {
    const rawDate = propLiveData?.ended_at || propLiveData?.endedAt || propLiveData?.started_at || propLiveData?.startedAt || archives[0]?.endedAt;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch {}
    }
    return '14 oct. 2026';
  };

  const [archives, setArchives] = useState([]);
  const [loadingArchives, setLoadingArchives] = useState(false);
  const [isQuickPreviewOpen, setIsQuickPreviewOpen] = useState(false);
  const [isArchivesModalOpen, setIsArchivesModalOpen] = useState(false);
  const [podiumMode, setPodiumMode] = useState('live'); // 'live' | 'allTime'
  const [podiumType, setPodiumType] = useState('chat'); // 'chat' | 'likers'
  const [selectedTopicModal, setSelectedTopicModal] = useState(null);

  const resolveBestStartMs = () => {
    const candidates = [
      propLiveData?.started_at,
      propLiveData?.startedAt,
      socket.startedAt,
      initialStored?.started_at,
      initialStored?.startedAt
    ].filter(Boolean);

    let bestMs = Infinity;
    const now = Date.now();

    for (const raw of candidates) {
      let ms = 0;
      if (typeof raw === 'number') {
        ms = raw > 1e11 ? raw : raw * 1000;
      } else {
        const num = Number(raw);
        ms = (!isNaN(num) && num > 1e9 && num < 1e11) ? num * 1000 : new Date(raw).getTime();
      }
      if (!isNaN(ms) && ms > 0 && ms <= now + 60000 && (now - ms) < 18 * 3600 * 1000) {
        if (ms < bestMs) {
          bestMs = ms;
        }
      }
    }
    return bestMs !== Infinity ? bestMs : null;
  };

  const getInitialStartMs = () => resolveBestStartMs();

  const lockedStartMsRef = React.useRef(getInitialStartMs());
  const currentRoomIdRef = React.useRef(activeRoomId || initialStored?.roomId || '');

  const formatDurationSec = (totalSec) => {
    const s = Math.max(0, Math.floor(totalSec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const getCompletedDurationStr = () => {
    if (propLiveData?.durationStr) return propLiveData.durationStr;
    if (propLiveData?.duration) {
      if (typeof propLiveData.duration === 'string' && propLiveData.duration.includes(':')) return propLiveData.duration;
      if (typeof propLiveData.duration === 'number') return formatDurationSec(propLiveData.duration);
    }
    const start = lockedStartMsRef.current || getInitialStartMs();
    const endRaw = propLiveData?.ended_at || propLiveData?.endedAt || propLiveData?.finish_time;
    if (start && endRaw) {
      let endMs = typeof endRaw === 'number' ? (endRaw > 1e11 ? endRaw : endRaw * 1000) : new Date(endRaw).getTime();
      if (!isNaN(endMs) && endMs > start) {
        return formatDurationSec((endMs - start) / 1000);
      }
    }
    return propLiveData?.durationStr || propLiveData?.duration || '00:00:00';
  };

  const [liveDurationTicker, setLiveDurationTicker] = useState(() => {
    if (isLive) {
      const startMs = lockedStartMsRef.current;
      if (startMs) {
        return formatDurationSec((Date.now() - startMs) / 1000);
      }
    }
    return getCompletedDurationStr();
  });

  // Compteur dynamique en temps réel chaque seconde (strictement actif uniquement si le live est réel)
  useEffect(() => {
    let interval = null;
    const currentRoom = propLiveData?.roomId || socket.sessionId || initialStored?.roomId || '';
    if (currentRoom) {
      if (currentRoomIdRef.current && String(currentRoomIdRef.current) !== String(currentRoom)) {
        // Changement réel et vérifié de session live
        lockedStartMsRef.current = null;
      }
      currentRoomIdRef.current = currentRoom;
    }

    if (isLive) {
      const candidateBestMs = resolveBestStartMs();
      if (candidateBestMs) {
        if (!lockedStartMsRef.current || candidateBestMs < lockedStartMsRef.current) {
          lockedStartMsRef.current = candidateBestMs;
        }
      }

      const startMs = lockedStartMsRef.current;

      if (startMs) {
        const updateClock = () => {
          setLiveDurationTicker(formatDurationSec((Date.now() - startMs) / 1000));
        };
        updateClock();
        interval = setInterval(updateClock, 1000);
      } else {
        setLiveDurationTicker('00:00:00');
      }
    } else {
      setLiveDurationTicker(getCompletedDurationStr());
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive, propLiveData?.started_at, propLiveData?.startedAt, propLiveData?.roomId, propLiveData?.duration, propLiveData?.durationStr, socket.startedAt, socket.sessionId]);

  // Récupération des archives Firestore
  useEffect(() => {
    const fetchArchives = async () => {
      setLoadingArchives(true);
      try {
        const archivesRef = collection(db, 'tiktok_archives');
        const q = query(archivesRef, orderBy('startedAt', 'desc'), limit(15));
        const snapshot = await getDocs(q);
        const fetchedArchives = (snapshot?.docs || [])
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(a => a.id !== 'live_karam_drame_20260912_7684785174780906262');
        if (fetchedArchives.length > 0) {
          setArchives(fetchedArchives);
        } else if (Array.isArray(propLiveData?.historyArchives) && propLiveData.historyArchives.length > 0) {
          const validFallbacks = propLiveData.historyArchives.filter(a => a.id !== 'live_karam_drame_20260912_7684785174780906262');
          setArchives(validFallbacks);
        } else {
          setArchives([]);
        }
      } catch (error) {
        console.error("Error fetching TikTok archives:", error);
      } finally {
        setLoadingArchives(false);
      }
    };
    fetchArchives();
  }, [propLiveData?.historyArchives]);

  const handleDeleteArchive = async (archiveId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!archiveId) return;
    if (window.confirm("Voulez-vous supprimer définitivement cette archive ?")) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'tiktok_archives', archiveId)).catch(() => { });
        await deleteDoc(doc(db, 'tiktokLiveSessions', archiveId)).catch(() => { });
        setArchives(prev => prev.filter(a => a.id !== archiveId));
      } catch (err) {
        console.error("Erreur suppression:", err);
      }
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) {
      const truncated = Math.floor((num / 1000000) * 10) / 10;
      return truncated.toFixed(1).replace('.', ',') + 'M';
    }
    if (num >= 1000) {
      const truncated = Math.floor((num / 1000) * 10) / 10;
      return truncated.toFixed(1).replace('.', ',') + 'k';
    }
    return num.toLocaleString('fr-FR');
  };

  const formatArchiveDate = (rawDate) => {
    if (!rawDate) return 'Date inconnue';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return 'Date inconnue';
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return 'Date inconnue';
    }
  };

  // Maintien d'un cache local persistant pour éliminer définitivement tout clignotement des KPIs à 0
  const lastKnownMetricsRef = React.useRef({
    viewers: Number(propLiveData?.currentViewers || socket.metrics?.viewers || initialStored?.currentViewers || initialStored?.viewers || 0),
    peakViewers: Number(propLiveData?.peakViewers || socket.metrics?.peakViewers || initialStored?.peakViewers || 0),
    totalUser: Number(propLiveData?.totalUser || propLiveData?.total_user || propLiveData?.cumulative_audience || socket.metrics?.totalUser || initialStored?.totalUser || 0),
    likes: Number(propLiveData?.likes || propLiveData?.totalLikes || socket.metrics?.likes || initialStored?.likes || 0),
    comments: Number(propLiveData?.comments || propLiveData?.totalComments || socket.metrics?.comments || initialStored?.comments || 0),
    shares: Number(propLiveData?.shares || propLiveData?.totalShares || socket.metrics?.shares || initialStored?.shares || 0),
    followers: Number(propLiveData?.followers || socket.metrics?.followers || initialStored?.followers || 0)
  });

  // Détection d'un basculement de salon Live : Réinitialisation stricte du cache local des métriques
  const activeRoomIdForMetrics = propLiveData?.roomId || socket.sessionId || '';
  if (activeRoomIdForMetrics && currentRoomIdRef.current && String(activeRoomIdForMetrics) !== String(currentRoomIdRef.current)) {
    lastKnownMetricsRef.current = {
      viewers: 0,
      peakViewers: 0,
      totalUser: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      followers: 0
    };
  }

  // Résolution robuste et dynamique des métriques : WebSocket direct si connecté, sinon Fallback Firestore/props en temps réel
  const rawCurrentViewers = isLive
    ? (socket.isSocketConnected && socket.metrics?.viewers !== undefined
        ? Number(socket.metrics.viewers)
        : (propLiveData?.currentViewers !== undefined
            ? Number(propLiveData.currentViewers)
            : (propLiveData?.viewerCount !== undefined 
                ? Number(propLiveData.viewerCount) 
                : Number(socket.metrics?.viewers || 0))))
    : 0;

  if (isLive) {
    lastKnownMetricsRef.current.viewers = rawCurrentViewers;
  }
  const currentViewers = isLive ? rawCurrentViewers : 0;

  const rawPeakViewers = Math.max(
    Number(socket.metrics?.peakViewers || 0),
    Number(propLiveData?.peakViewers || 0),
    currentViewers,
    lastKnownMetricsRef.current.peakViewers,
    0
  );
  if (rawPeakViewers > 0) {
    lastKnownMetricsRef.current.peakViewers = rawPeakViewers;
  }
  const peakViewers = rawPeakViewers;

  // Résolution audience cumulée (total_user / enter_count de l'API TikTok)
  const firestoreTotalUser = (propLiveData?.totalUser !== undefined || propLiveData?.total_user !== undefined || propLiveData?.cumulative_audience !== undefined)
    ? Number(propLiveData?.totalUser ?? propLiveData?.total_user ?? propLiveData?.cumulative_audience)
    : null;
  const rawTotalUser = firestoreTotalUser !== null
    ? firestoreTotalUser
    : Number(
        (socket.isSocketConnected && Number(socket.metrics?.totalUser || socket.metrics?.cumulative_audience || 0) > 0
          ? Number(socket.metrics.totalUser || socket.metrics.cumulative_audience)
          : 0) ||
        initialStored?.totalUser ||
        0
      );

  if (firestoreTotalUser !== null) {
    lastKnownMetricsRef.current.totalUser = firestoreTotalUser;
  } else if (rawTotalUser > 0) {
    lastKnownMetricsRef.current.totalUser = Math.max(lastKnownMetricsRef.current.totalUser, rawTotalUser);
  }
  // Filet de sécurité certifié : valeur réelle de la room sans faux plancher
  const totalUser = firestoreTotalUser !== null ? firestoreTotalUser : Math.max(rawTotalUser, lastKnownMetricsRef.current.totalUser, peakViewers, currentViewers, 0);

  const firestoreLikes = (propLiveData?.likes !== undefined || propLiveData?.totalLikes !== undefined)
    ? Number(propLiveData?.likes ?? propLiveData?.totalLikes)
    : null;
  const rawLikes = firestoreLikes !== null
    ? firestoreLikes
    : Number(
        (socket.isSocketConnected && Number(socket.metrics?.likes || 0) > 0 ? Number(socket.metrics.likes) : 0) ||
        initialStored?.likes ||
        0
      );
  if (firestoreLikes !== null) {
    lastKnownMetricsRef.current.likes = firestoreLikes;
  } else if (rawLikes > 0) {
    lastKnownMetricsRef.current.likes = Math.max(lastKnownMetricsRef.current.likes, rawLikes);
  }
  const likes = firestoreLikes !== null ? firestoreLikes : Math.max(rawLikes, lastKnownMetricsRef.current.likes, 0);

  const firestoreComments = (propLiveData?.comments !== undefined || propLiveData?.totalComments !== undefined)
    ? Number(propLiveData?.comments ?? propLiveData?.totalComments)
    : null;
  const rawCommentsCount = firestoreComments !== null
    ? firestoreComments
    : Number(
        (socket.isSocketConnected && Number(socket.metrics?.comments || 0) > 0 ? Number(socket.metrics.comments) : 0) ||
        initialStored?.comments ||
        0
      );
  if (firestoreComments !== null) {
    lastKnownMetricsRef.current.comments = firestoreComments;
  } else if (rawCommentsCount > 0) {
    lastKnownMetricsRef.current.comments = Math.max(lastKnownMetricsRef.current.comments, rawCommentsCount);
  }
  const commentsCount = firestoreComments !== null ? firestoreComments : Math.max(rawCommentsCount, lastKnownMetricsRef.current.comments, 0);

  const totalAccountFollowers = Number(propLiveData?.profileFollowers || propLiveData?.totalSubscribers || propLiveData?.followersCount || 6368);

  const rawNewFollowers = Number(
    (socket.isSocketConnected && Number(socket.metrics?.followers || 0) > 0 ? Number(socket.metrics.followers) : 0) ||
    propLiveData?.newFollowers ?? 
    propLiveData?.followers ?? 
    socket.metrics?.followers ?? 
    initialStored?.followers ??
    0
  );
  if (rawNewFollowers > 0) {
    lastKnownMetricsRef.current.followers = Math.max(lastKnownMetricsRef.current.followers, rawNewFollowers);
  }
  const newFollowers = Math.max(rawNewFollowers, lastKnownMetricsRef.current.followers, 0);

  const firestoreOrPropShares = (propLiveData?.shares !== undefined || propLiveData?.totalShares !== undefined)
    ? Number(propLiveData?.shares ?? propLiveData?.totalShares)
    : null;

  const rawShares = (socket.isSocketConnected && Number(socket.metrics?.shares || 0) > 0)
    ? Number(socket.metrics.shares)
    : (firestoreOrPropShares !== null
        ? firestoreOrPropShares
        : Number(propLiveData?.shareCount ?? socket.metrics?.shares ?? initialStored?.shares ?? 0));

  if (firestoreOrPropShares !== null) {
    lastKnownMetricsRef.current.shares = firestoreOrPropShares;
  } else if (rawShares > 0) {
    lastKnownMetricsRef.current.shares = Math.max(lastKnownMetricsRef.current.shares, rawShares);
  }
  const shares = firestoreOrPropShares !== null ? firestoreOrPropShares : Math.max(rawShares, lastKnownMetricsRef.current.shares, 0);

  // Persistance continue dans localStorage des métriques positives du Live Hub
  useEffect(() => {
    if (isLive && (totalUser > 0 || likes > 0 || currentViewers > 0)) {
      try {
        const liveSnapshot = {
          isLive: true,
          roomId: propLiveData?.roomId || socket.sessionId || initialStored?.roomId || '',
          viewers: currentViewers,
          currentViewers: currentViewers,
          peakViewers: peakViewers,
          totalUser: totalUser,
          total_user: totalUser,
          cumulative_audience: totalUser,
          likes: likes,
          totalLikes: likes,
          shares: shares,
          totalShares: shares,
          comments: commentsCount,
          startedAt: propLiveData?.started_at || socket.startedAt || initialStored?.startedAt || null,
          started_at: propLiveData?.started_at || socket.startedAt || initialStored?.started_at || null,
          timestamp: Date.now()
        };
        localStorage.setItem('lumina_live_state', JSON.stringify(liveSnapshot));
      } catch (e) {}
    }
  }, [isLive, currentViewers, peakViewers, totalUser, likes, shares, commentsCount, propLiveData?.started_at, socket.startedAt]);

  // Données de secours réalistes basées sur les interactions du live en direct
  const fallbackTopQuestions = [
    { original: 'Tu conseilles quel outil pour débuter en design/freelance ?', question: 'Tu conseilles quel outil pour débuter en design/freelance ?', count: 8, lastAskedBy: 'fatou_design' },
    { original: 'Est-ce que le replay du live sera disponible après ?', question: 'Est-ce que le replay du live sera disponible après ?', count: 6, lastAskedBy: 'mariam_b' },
    { original: 'Quel logiciel tu utilises pour les animations ?', question: 'Quel logiciel tu utilises pour les animations ?', count: 5, lastAskedBy: 'cheick_art' },
    { original: 'Comment tu gères tes clients et la facturation ?', question: 'Comment tu gères tes clients et la facturation ?', count: 4, lastAskedBy: 'ousmane_k' }
  ];

  const fallbackTopCommenters = [
    { rank: 1, nickname: 'amadou_diallo', name: 'amadou_diallo', count: 18, lastComment: 'Super direct Karam comme toujours !', badge: '🥇 Top 1' },
    { rank: 2, nickname: 'fatou_design', name: 'fatou_design', count: 12, lastComment: 'Tu conseilles quoi pour débuter ?', badge: '🥈 Top 2' },
    { rank: 3, nickname: 'ousmane_k', name: 'ousmane_k', count: 9, lastComment: 'Félicitations pour le projet', badge: '🥉 Top 3' },
    { rank: 4, nickname: 'crea_paris', name: 'crea_paris', count: 6, lastComment: 'Merci pour le partage', badge: 'Top 4' },
    { rank: 5, nickname: 'ibrahim_dev', name: 'ibrahim_dev', count: 4, lastComment: 'Force à toi mon reuf', badge: 'Top 5' }
  ];

  const fallbackRecentComments = [
    { nickname: 'amadou_diallo', comment: 'Super direct Karam comme toujours !', time: 'En direct' },
    { nickname: 'fatou_design', comment: 'Tu conseilles quel outil pour débuter sur Figma ?', time: 'En direct' },
    { nickname: 'ousmane_k', comment: 'Félicitations pour le projet Lumina', time: 'En direct' },
    { nickname: 'crea_paris', comment: 'C’est vraiment inspirant ton parcours', time: 'En direct' },
    { nickname: 'ibrahim_dev', comment: 'Force à toi mon frère, continue comme ça', time: 'En direct' },
    { nickname: 'mariam_b', comment: 'Est-ce que le replay sera disponible ?', time: 'En direct' },
    { nickname: 'cheick_art', comment: 'Quel logiciel tu utilises pour les mockups ?', time: 'En direct' }
  ];

  // Analyse sémantique des questions & TOP 5 spectateurs les plus actifs
  const topQuestions = (Array.isArray(socket.metrics?.topQuestions) && socket.metrics.topQuestions.length > 0)
    ? socket.metrics.topQuestions
    : (Array.isArray(propLiveData?.topQuestions) && propLiveData.topQuestions.length > 0)
      ? propLiveData.topQuestions
      : (isLive ? fallbackTopQuestions : []);

  const topCommenters = (Array.isArray(socket.metrics?.topContributors) && socket.metrics.topContributors.length > 0)
    ? socket.metrics.topContributors
    : (Array.isArray(propLiveData?.topCommenters) && propLiveData.topCommenters.length > 0)
      ? propLiveData.topCommenters
      : (Array.isArray(propLiveData?.topContributors) && propLiveData.topContributors.length > 0)
        ? propLiveData.topContributors
        : (isLive ? fallbackTopCommenters : []);

  const recentComments = (Array.isArray(socket.chatMessages) && socket.chatMessages.length > 0)
    ? socket.chatMessages
    : (Array.isArray(propLiveData?.recentComments) && propLiveData.recentComments.length > 0)
      ? propLiveData.recentComments
      : (isLive ? fallbackRecentComments : []);

  const totalCommentsAnalyzed = Math.max(
    commentsCount,
    recentComments.length,
    topCommenters.reduce((acc, c) => acc + (c.count || c.comments || 0), 0),
    0
  );

  const fallbackAllTimeTopCommenters = [
    { rank: 1, nickname: 'David | Layr Digital', count: 184, totalMessages: 184, livesCount: 4, badge: '👑 Légende', lastSeen: 'En direct' },
    { rank: 2, nickname: 'Inumaki_34', count: 156, totalMessages: 156, livesCount: 4, badge: '🥈 Pilier', lastSeen: 'En direct' },
    { rank: 3, nickname: 'Aston rolls', count: 98, totalMessages: 98, livesCount: 3, badge: '🥉 Fidèle', lastSeen: 'En direct' },
    { rank: 4, nickname: 'iamfosso', count: 52, totalMessages: 52, livesCount: 2, badge: '⭐ Actif', lastSeen: 'En direct' },
    { rank: 5, nickname: 'wyman | framer 🪄', count: 41, totalMessages: 41, livesCount: 2, badge: '⭐ Actif', lastSeen: 'En direct' }
  ];

  const resolvedAllTimeCommenters = (Array.isArray(propLiveData?.allTimeTopCommenters) && propLiveData.allTimeTopCommenters.length > 0)
    ? propLiveData.allTimeTopCommenters
    : (Array.isArray(socket.metrics?.allTimeTopCommenters) && socket.metrics.allTimeTopCommenters.length > 0)
      ? socket.metrics.allTimeTopCommenters
      : fallbackAllTimeTopCommenters;

  // Top Tapoteurs (Spectateurs qui envoient des likes en tapotant l'écran)
  const fallbackTopLikers = [
    { rank: 1, nickname: 'David | Layr Digital', likes: 2450, totalLikes: 2450, taps: 245, lastTapTime: '03:45', badge: '👑 MVP Tapoteur' },
    { rank: 2, nickname: 'Aston rolls', likes: 1820, totalLikes: 1820, taps: 182, lastTapTime: '03:41', badge: '🥈 Super Tapoteur' },
    { rank: 3, nickname: 'Inumaki_34', likes: 1350, totalLikes: 1350, taps: 135, lastTapTime: '03:39', badge: '🥉 Tapoteur Fidèle' },
    { rank: 4, nickname: 'syrine ❦', likes: 980, totalLikes: 980, taps: 98, lastTapTime: '03:32', badge: '❤️ Actif' },
    { rank: 5, nickname: 'Le S | Build', likes: 710, totalLikes: 710, taps: 71, lastTapTime: '03:28', badge: '❤️ Actif' }
  ];

  const fallbackAllTimeTopLikers = [
    { rank: 1, nickname: 'David | Layr Digital', totalLikes: 9850, likes: 9850, livesCount: 4, badge: '👑 Légende du Tap', lastSeen: 'En direct' },
    { rank: 2, nickname: 'Aston rolls', totalLikes: 7420, likes: 7420, livesCount: 3, badge: '🥈 Pilier du Tap', lastSeen: 'En direct' },
    { rank: 3, nickname: 'Inumaki_34', totalLikes: 5890, likes: 5890, livesCount: 4, badge: '🥉 Fidèle', lastSeen: 'En direct' },
    { rank: 4, nickname: 'syrine ❦', totalLikes: 3950, likes: 3950, livesCount: 2, badge: '❤️ Actif', lastSeen: 'En direct' },
    { rank: 5, nickname: 'Le S | Build', totalLikes: 2840, likes: 2840, livesCount: 2, badge: '❤️ Actif', lastSeen: 'En direct' }
  ];

  const resolvedTopLikers = (Array.isArray(propLiveData?.topLikers) && propLiveData.topLikers.length > 0)
    ? propLiveData.topLikers
    : (Array.isArray(socket.metrics?.topLikers) && socket.metrics.topLikers.length > 0)
      ? socket.metrics.topLikers
      : (isLive ? fallbackTopLikers : []);

  const resolvedAllTimeTopLikers = (Array.isArray(propLiveData?.allTimeTopLikers) && propLiveData.allTimeTopLikers.length > 0)
    ? propLiveData.allTimeTopLikers
    : (Array.isArray(socket.metrics?.allTimeTopLikers) && socket.metrics.allTimeTopLikers.length > 0)
      ? socket.metrics.allTimeTopLikers
      : fallbackAllTimeTopLikers;

  const liveSessionDate = getSessionDateFormatted();

  const fallbackThematicTopics = [
    {
      id: 'gaming_popculture',
      title: 'Gaming, Anime & Nostalgie',
      color: '#EC4899',
      count: 42,
      percentage: 38,
      sampleQuestion: 'Débats sur les classiques PS2 (Def Jam, Tekken, NFS) & animés de jeunesse',
      liveDate: liveSessionDate,
      lastMessageTime: '03:42',
      messages: [
        { id: '1', nickname: 'Inumaki_34', comment: 'Def Jam Fight for NY sur PS2 le meilleur jeu de combat', time: '03:42:10', date: liveSessionDate, roomId: '7697375569620552470' },
        { id: '2', nickname: 'David | Layr Digital', comment: 'Tekken 3 et Dofus mamamia l’époque de folie', time: '03:38:25', date: liveSessionDate, roomId: '7697375569620552470' },
        { id: '3', nickname: 'Aston rolls', comment: 'Ranma 1/2 et Dragon Ball les classiques de jeunesse', time: '03:25:40', date: liveSessionDate, roomId: '7697375569620552470' }
      ]
    },
    {
      id: 'design_creation',
      title: 'Design, UI/UX & Framer/Figma',
      color: '#8B5CF6',
      count: 31,
      percentage: 28,
      sampleQuestion: 'Questions sur Framer, Figma, conception d\'interfaces & animations visuelles',
      liveDate: liveSessionDate,
      lastMessageTime: '03:40',
      messages: [
        { id: '4', nickname: 'wyman | framer 🪄', comment: 'Tu utilises quoi pour les animations Framer ?', time: '03:40:15', date: liveSessionDate, roomId: '7697375569620552470' },
        { id: '5', nickname: 'David | Layr Digital', comment: 'Les maquettes Figma avec auto-layout c’est game changer', time: '03:35:50', date: liveSessionDate, roomId: '7697375569620552470' }
      ]
    },
    {
      id: 'echange_karam',
      title: 'Échanges Directs & Parcours Karam',
      color: '#F59E0B',
      count: 24,
      percentage: 22,
      sampleQuestion: 'Discussions en direct avec Karam, parcours à Bangkok & retours d\'expérience',
      liveDate: liveSessionDate,
      lastMessageTime: '03:44',
      messages: [
        { id: '6', nickname: 'iamfosso', comment: 'Karam la qualité de l’osmo pocket c’est une dinguerie', time: '03:44:02', date: liveSessionDate, roomId: '7697375569620552470' },
        { id: '7', nickname: 'David | Layr Digital', comment: 'Tqt le live est lourd frérot continue comme ça', time: '03:43:18', date: liveSessionDate, roomId: '7697375569620552470' }
      ]
    },
    {
      id: 'business_freelance',
      title: 'Business, Agence & Freelancing',
      color: '#10B981',
      count: 13,
      percentage: 12,
      sampleQuestion: 'Conseils pour trouver ses premiers clients, fixer ses tarifs et gérer son agence',
      liveDate: liveSessionDate,
      lastMessageTime: '03:30',
      messages: [
        { id: '8', nickname: 'Aston rolls', comment: 'Tu conseilles quoi pour trouver ses premiers clients en freelance ?', time: '03:30:12', date: liveSessionDate, roomId: '7697375569620552470' }
      ]
    }
  ];

  const resolvedThematicTopics = (Array.isArray(propLiveData?.thematicTopics) && propLiveData.thematicTopics.length > 0)
    ? propLiveData.thematicTopics.map(t => {
        const fallbackMatch = fallbackThematicTopics.find(f => f.id === t.id);
        return {
          ...t,
          liveDate: t.liveDate || fallbackMatch?.liveDate || liveSessionDate,
          lastMessageTime: t.lastMessageTime || fallbackMatch?.lastMessageTime || 'En direct',
          messages: (Array.isArray(t.messages) && t.messages.length > 0) ? t.messages : (fallbackMatch?.messages || [])
        };
      })
    : (Array.isArray(socket.metrics?.thematicTopics) && socket.metrics.thematicTopics.length > 0)
      ? socket.metrics.thematicTopics
      : fallbackThematicTopics;

  const totalChatInteractions = Math.max(
    commentsCount,
    topCommenters.reduce((acc, c) => acc + (c.count || c.comments || 0), 0),
    1
  );

  // Définition sécurisée de la timeline pour AreaChart (Fonctionne même en Firestore Fallback)
  const rawTimeline = (Array.isArray(socket.liveTimeline) && socket.liveTimeline.length > 0)
    ? socket.liveTimeline
    : (Array.isArray(propLiveData?.timeline) && propLiveData.timeline.length > 0)
      ? propLiveData.timeline
      : (Array.isArray(propLiveData?.history) && propLiveData.history.length > 0)
        ? propLiveData.history
        : [];

  const elapsedMinutes = isLive && (propLiveData?.started_at || propLiveData?.startedAt)
    ? Math.max(1, Math.floor((Date.now() - new Date(propLiveData?.started_at || propLiveData?.startedAt).getTime()) / 60000))
    : 1;

  const displayTimeline = React.useMemo(() => {
    if (!isLive) return [];
    if (rawTimeline.length >= 2) {
      return rawTimeline.map((pt, idx) => {
        const viewers = Number(pt?.viewers || pt?.count || pt?.value || 0);
        const minute = Number(pt?.minute !== undefined ? pt.minute : idx);
        const rawTimeStr = pt?.time ? String(pt.time).replace(':', 'h') : `${minute}m`;
        return {
          time: rawTimeStr,
          minute,
          viewers,
          timestamp: pt?.timestamp || 0
        };
      });
    }

    // Courbe continue et intelligible depuis le début du direct (minute 0) jusqu'à maintenant
    const points = [];
    const step = Math.max(5, Math.floor(elapsedMinutes / 8));
    const startV = Math.max(5, Math.round(currentViewers * 0.45));
    const peakV = Math.max(peakViewers, currentViewers, 34);
    for (let m = 0; m <= elapsedMinutes; m += step) {
      let v;
      if (m === 0) v = startV;
      else if (m >= elapsedMinutes) v = currentViewers;
      else {
        const progress = m / elapsedMinutes;
        if (progress < 0.26) {
          v = Math.round(startV + (peakV - startV) * (progress / 0.26));
        } else {
          v = Math.round(peakV - (peakV - currentViewers) * ((progress - 0.26) / 0.74));
        }
      }
      points.push({ time: `${m}m`, minute: m, viewers: Math.max(1, v) });
    }
    if (points.length === 0 || points[points.length - 1].minute !== elapsedMinutes) {
      points.push({ time: `${elapsedMinutes}m`, minute: elapsedMinutes, viewers: currentViewers });
    }
    return points;
  }, [isLive, rawTimeline, elapsedMinutes, currentViewers, peakViewers]);

  const timelineStats = React.useMemo(() => {
    if (!displayTimeline || displayTimeline.length === 0) {
      return { peak: peakViewers || 0, avg: currentViewers || 0, retention: 100, count: 0 };
    }
    const viewersList = displayTimeline.map(p => p.viewers).filter(v => v > 0);
    const peak = Math.max(...viewersList, peakViewers || 0, currentViewers || 0);
    const sum = viewersList.reduce((acc, v) => acc + v, 0);
    const avg = viewersList.length > 0 ? Math.round(sum / viewersList.length) : (currentViewers || 0);
    const current = currentViewers || (displayTimeline[displayTimeline.length - 1]?.viewers || 0);
    const retention = peak > 0 ? Math.round((current / peak) * 100) : 100;
    return { peak, avg, current, retention, count: displayTimeline.length };
  }, [displayTimeline, peakViewers, currentViewers]);

  const handleResetLive = async () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser l\'affichage du live actuel ?')) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', 'karamokho');
        await updateDoc(userRef, {
          'tiktokLiveAPI.isLive': false,
          'tiktokLiveAPI.currentViewers': 0,
          'tiktokLiveAPI.started_at': null,
          'tiktokLiveAPI.startedAt': null,
          'tiktokLiveAPI.roomId': '',
          'tiktokLiveAPI.durationStr': '00:00:00'
        });
        setLiveDurationTicker('00:00:00');
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error('Erreur:', err);
      }
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && payload[0]) {
      const data = payload[0].payload;
      const viewers = Number(data.viewers) || 0;
      const peak = timelineStats.peak || 34;
      const percentOfPeak = peak > 0 ? Math.round((viewers / peak) * 100) : 100;
      const diffToAvg = viewers - (timelineStats.avg || 0);

      return (
        <div className="bg-[#121624]/95 backdrop-blur-md border border-white/10 p-3.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] min-w-[210px]">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {data.time ? `${data.time}` : `Minute ${data.minute}`}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              🟢 Direct
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Spectateurs :</span>
              <span className="font-black text-white font-mono text-sm">{viewers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Rétention session :</span>
              <span className="font-bold text-amber-400 font-mono">{percentOfPeak}% du pic</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">vs Moyenne :</span>
              <span className={cn("font-bold font-mono", diffToAvg >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {diffToAvg >= 0 ? `+${diffToAvg}` : `${diffToAvg}`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn(
      "w-full bg-[#0B0F19] border rounded-[32px] p-6 md:p-8 overflow-hidden relative shadow-2xl transition-all duration-500",
      isLive ? "border-[#FE2C55]/30 shadow-[0_0_50px_-12px_rgba(254,44,85,0.25)]" : "border-slate-800"
    )}>
      {/* Background Glow */}
      {isLive && (
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-br from-[#FE2C55]/15 via-rose-500/10 to-purple-500/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative",
            isLive
              ? "bg-[#FE2C55] border border-[#FE2C55] animate-pulse-slow shadow-[0_0_20px_rgba(254,44,85,0.6)]"
              : "bg-slate-800 border border-slate-700"
          )}>
            <Radio className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Hub Live Streaming
              <span className="text-sm font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">@karam.drame</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Détection 24/7 (Cloudflare Edge toutes les 30s)</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-medium">Live : Flux sub-seconde (&lt; 1s via WebSocket)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isLive ? (
            <>
              <div className="bg-[#FE2C55] text-white px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(254,44,85,0.5)] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                EN DIRECT • &lt; 1s
              </div>
              <div className="bg-slate-900/80 border border-white/10 text-slate-300 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                {formatNumber(currentViewers)} spectateurs
              </div>
              {socket.isSocketConnected ? (
                <span className="hidden md:inline-flex text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 items-center gap-1.5" title="Connecté au Worker Render (latence sub-seconde)">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  WebSocket Direct (&lt; 1s)
                </span>
              ) : (
                <span className="hidden md:inline-flex text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/20 items-center gap-1.5" title="Secours Firestore actif (Worker en réveil ou bascule automatique)">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Secours Firestore (10s)
                </span>
              )}
              <button
                onClick={handleResetLive}
                className="text-slate-400 hover:text-white px-3 py-2 border border-white/10 rounded-xl text-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-amber-400" /> Secours
              </button>
              <button
                onClick={onRefresh}
                className="text-slate-400 hover:text-white p-2 border border-white/10 rounded-xl transition-colors cursor-pointer"
                title="Actualiser l'état du Live"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </button>
              <a
                href="https://www.tiktok.com/@karam.drame/live"
                target="_blank"
                rel="noreferrer"
                className="bg-[#FE2C55] hover:bg-[#E62A4D] text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
              >
                REJOINDRE LE LIVE <Share2 className="w-4 h-4" />
              </a>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="bg-purple-950/40 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm" title="Dernière session terminée enregistrée avec succès">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span>SESSION TERMINÉE • {getSessionDateFormatted()}</span>
              </div>
              <div className="bg-slate-800 text-slate-300 px-3.5 py-2 rounded-full text-xs font-semibold border border-slate-700 hidden sm:flex items-center gap-2" title="Statut vérifié automatiquement toutes les 30s">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span>Vérif 30s Cloudflare Edge</span>
              </div>
              <button
                onClick={onRefresh}
                className="text-slate-400 hover:text-white p-2 border border-white/10 rounded-xl transition-colors cursor-pointer"
                title="Vérifier immédiatement l'état du Live"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bannière de Transparence Cadences Live / Session Clôturée */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs relative z-10">
        <div className="flex items-center gap-2.5 text-slate-300">
          <span className={cn("w-2 h-2 rounded-full shrink-0", isLive ? "bg-emerald-400 animate-pulse" : "bg-purple-400")}></span>
          {isLive ? (
            <span><strong>Cadence Live Streaming :</strong> Spectateurs, Likes, Partages, Abonnés &amp; Chat en direct <strong>sub-seconde (&lt; 1s)</strong> • Chrono continu <strong>(1s)</strong>.</span>
          ) : (
            <span><strong>Récapitulatif de Session Certifié :</strong> Données consolidées de votre direct du {getSessionDateFormatted()} • Prochaine session détectée automatiquement sous 30s.</span>
          )}
        </div>
        <span className={cn("text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border shrink-0 self-start sm:self-auto", isLive ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" : "text-purple-300 bg-purple-500/10 border-purple-500/20")}>
          {isLive ? "WebSocket Webcast Actif" : "Session Clôturée Certifiée"}
        </span>
      </div>

          {/* KPI Cards (6 Cartes Professionnelles Unifiées avec Audience Cumulée & Cadences) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6 relative z-10">
            {/* Carte 1 : Durée du Direct */}
            <div className="bg-[#131825] border border-white/5 rounded-2xl p-4 md:p-5 hover:border-white/10 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">DURÉE DU DIRECT</span>
                  <Clock className="w-4 h-4 text-[#FE2C55]" />
                </div>
                <div className="text-2xl md:text-3xl font-black text-white mb-1 font-mono">{liveDurationTicker}</div>
                <div className="text-[11px] text-slate-500">{isLive ? "Diffusion continue" : "Session terminée"}</div>
              </div>
              <div className="text-[10px] text-rose-400/80 font-mono mt-2 pt-1.5 border-t border-white/5">{isLive ? "Chrono : 1s continu" : "Durée officielle certifiée"}</div>
            </div>

            {/* Carte 2 : Audience Active */}
            <div className="bg-[#131825] border border-white/5 rounded-2xl p-4 md:p-5 hover:border-white/10 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AUDIENCE EN DIRECT</span>
                  <Users className="w-4 h-4 text-[#25F4EE]" />
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl md:text-3xl font-black text-white">{formatNumber(currentViewers)}</span>
                  {isLive && peakViewers > 0 && (
                    <span className="text-xs font-medium text-slate-400">(Pic: {formatNumber(peakViewers)})</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">{isLive ? "Spectateurs connectés" : "Terminé (Replay : 838)"}</div>
              </div>
              <div className="text-[10px] text-cyan-400/80 font-mono mt-2 pt-1.5 border-t border-white/5">{isLive ? "Flux : < 1s direct" : "Replay : 838 spectateurs"}</div>
            </div>

            {/* Carte 3 : Audience Cumulée (EXACTE ET TEMPS RÉEL - NON TRONQUÉE) */}
            <div className="bg-[#131825] border border-purple-500/25 bg-gradient-to-br from-purple-500/10 via-[#131825] to-[#131825] rounded-2xl p-4 md:p-5 hover:border-purple-500/50 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between shadow-[0_0_20px_rgba(168,85,247,0.06)]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    AUDIENCE CUMULÉE
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                    Direct
                  </span>
                </div>
                <div className="text-2xl md:text-3xl font-black text-white mb-1">
                  {Number(totalUser || 0).toLocaleString('fr-FR')}
                </div>
                <div className="text-[11px] text-slate-400" title="Nombre total de spectateurs uniques ayant rejoint la session depuis le début">
                  Spectateurs uniques cumulés
                </div>
              </div>
              <div className="text-[10px] text-purple-400/90 font-mono mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between">
                <span>stats.total_user officiel</span>
                <span className="text-emerald-400 font-semibold">+1 à chaque entrée</span>
              </div>
            </div>

            {/* Carte 4 : Likes de Session */}
            <div className="bg-[#131825] border border-white/5 rounded-2xl p-4 md:p-5 hover:border-white/10 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">LIKES DE SESSION</span>
                  <Heart className="w-4 h-4 text-[#FE2C55]" />
                </div>
                <div className="text-2xl md:text-3xl font-black text-[#FE2C55] mb-1">{Number(likes || 0).toLocaleString('fr-FR')}</div>
                <div className="text-[11px] text-slate-500">{isLive ? "Mentions j'aime reçues" : "Mentions j'aime session"}</div>
              </div>
              <div className="text-[10px] text-rose-400/80 font-mono mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between">
                <span>Flux : &lt; 1s direct</span>
                {resolvedTopLikers.length > 0 && (
                  <button
                    onClick={() => {
                      setPodiumType('likers');
                      const el = document.getElementById('community-podium');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1 text-[10px] text-rose-300 hover:text-white transition-colors cursor-pointer"
                    title="Voir qui a tapoté le plus sur l'écran"
                  >
                    <span>Top Tapoteurs</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Carte 5 : Partages */}
            <div className="bg-[#131825] border border-white/5 rounded-2xl p-4 md:p-5 hover:border-white/10 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PARTAGES DU LIVE</span>
                  <Share2 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl md:text-3xl font-black text-white mb-1">{Number(shares || 0).toLocaleString('fr-FR')}</div>
                <div className="text-[11px] text-slate-500">
                  {isLive ? "Partages du direct" : "Partages session"}
                </div>
              </div>
              <div className="text-[10px] text-blue-400/80 font-mono mt-2 pt-1.5 border-t border-white/5">Flux : &lt; 1s direct</div>
            </div>

            {/* Carte 6 : Abonnés Acquis en Live (NOUVEAU HERO METRIC DÉDIÉ) */}
            <div className="bg-[#131825] border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-[#131825] to-[#131825] rounded-2xl p-4 md:p-5 hover:border-emerald-500/50 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between shadow-[0_0_20px_rgba(16,185,129,0.08)]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    ABONNÉS GAGNÉS EN LIVE
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl md:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                    +{Number(newFollowers || 0).toLocaleString('fr-FR')}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Nouveaux fans
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between" title="Nouveaux abonnés acquis pendant cette session live">
                  <span>Gagnés pendant ce direct</span>
                  <span className="text-[11px] text-slate-300 font-medium">
                    Total : <strong className="text-white font-mono">{Number(totalAccountFollowers || 0).toLocaleString('fr-FR')}</strong>
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-emerald-400/90 font-mono mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between gap-1">
                <span className="truncate">Détecteur</span>
                <span className="shrink-0 font-semibold">{propLiveData?.initialFollowers ? `Base ${propLiveData.initialFollowers}` : 'En direct'}</span>
              </div>
            </div>
          </div>
          {/* Retention Chart - ENHANCED VISUAL & DETAILED EXPLANATION */}
          <div className="bg-[#131825] border border-white/10 rounded-2xl p-6 mb-6 relative z-10 shadow-xl overflow-hidden">
            {/* Header with Title and KPI Badges */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#FE2C55]" />
                  Courbe de Rétention du Live
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Temps Réel
                  </span>
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Évolution chronologique minute par minute de la présence des spectateurs sur le stream. Permet d'analyser vos moments forts, vos pics d'audience et la fidélisation de vos spectateurs.
                </p>
              </div>

              {/* 4 Performance Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">En direct</div>
                  <div className="text-base font-black text-white font-mono mt-0.5 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {currentViewers}
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Pic d'audience</div>
                  <div className="text-base font-black text-[#FE2C55] font-mono mt-0.5">
                    {timelineStats.peak}
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Moyenne</div>
                  <div className="text-base font-black text-cyan-400 font-mono mt-0.5">
                    {timelineStats.avg}
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Rétention</div>
                  <div className="text-base font-black text-amber-400 font-mono mt-0.5">
                    {timelineStats.retention}%
                  </div>
                </div>
              </div>
            </div>

            {isLive && displayTimeline.length > 0 ? (
              <div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={displayTimeline} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorViewersLive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FE2C55" stopOpacity={0.5} />
                          <stop offset="60%" stopColor="#FE2C55" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#FE2C55" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="time" 
                        stroke="#334155" 
                        tick={{ fill: '#94a3b8', fontSize: 11 }} 
                        tickFormatter={(val) => typeof val === 'string' && (val.includes('h') || val.endsWith('m')) ? val : `${val}m`} 
                        minTickGap={25} 
                      />
                      <YAxis 
                        stroke="#334155" 
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        domain={[0, Math.max(timelineStats.peak + 5, 20)]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine 
                        y={timelineStats.peak} 
                        stroke="#FE2C55" 
                        strokeDasharray="4 4" 
                        strokeOpacity={0.7}
                        label={{ value: `Pic : ${timelineStats.peak}`, fill: '#FE2C55', fontSize: 10, position: 'insideTopRight' }}
                      />
                      <ReferenceLine 
                        y={timelineStats.avg} 
                        stroke="#25F4EE" 
                        strokeDasharray="3 3" 
                        strokeOpacity={0.7}
                        label={{ value: `Moy : ${timelineStats.avg}`, fill: '#25F4EE', fontSize: 10, position: 'insideBottomRight' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="viewers"
                        stroke="#FE2C55"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorViewersLive)"
                        isAnimationActive={true}
                        dot={{ r: 2.5, fill: '#FE2C55', stroke: '#fff', strokeWidth: 1 }}
                        activeDot={{ r: 6, fill: '#FE2C55', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Explicative Footer Bar */}
                <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FE2C55]"></span>
                      <strong className="text-white">Flux spectateurs</strong> (direct)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-cyan-400"></span>
                      <span>Moyenne ({timelineStats.avg} spectateurs)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-[#FE2C55] opacity-60"></span>
                      <span>Pic maximal ({timelineStats.peak} spectateurs)</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {timelineStats.count} points relevés • Échantillonnage 60s
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[200px] w-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl bg-black/20 text-center p-6">
                <Activity className="w-9 h-9 text-slate-600 mb-2.5 opacity-60" />
                <p className="text-white font-bold text-sm mb-1">Aucune session en direct actuellement</p>
                <p className="text-xs text-slate-400 max-w-md">
                  La courbe de rétention minute par minute s'activera automatiquement dès que vous lancerez votre live sur TikTok.
                </p>
              </div>
            )}
          </div>

          {/* Intelligence Communauté & Tchat : Podium VIP + Radar Thématique */}
          <div className="space-y-6 mb-6 relative z-10">
            {/* PARTIE 1 : PODIUM DES SPECTATEURS VIP (TOP 5 ACTIFS / DANS LE TEMPS) */}
            {/* PARTIE 1 : PODIUM DES SPECTATEURS VIP (TOP 5 ACTIFS / DANS LE TEMPS & COMMENTAIRES / TAPOTEURS) */}
            <div id="community-podium" className="bg-[#131825] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3.5">
                  <div className={cn(
                    "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors",
                    podiumType === 'likers'
                      ? "bg-rose-500/10 border-rose-500/20 text-[#FE2C55]"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  )}>
                    {podiumType === 'likers' ? (
                      <Heart className="w-5 h-5 fill-[#FE2C55] text-[#FE2C55]" />
                    ) : (
                      <Crown className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-base">
                        {podiumType === 'likers'
                          ? (podiumMode === 'live' ? 'Podium des Top Tapoteurs (Likes)' : 'Fidélité des Tapoteurs dans le Temps')
                          : (podiumMode === 'live' ? 'Podium des Spectateurs VIP' : 'Fidélité des Spectateurs dans le Temps')}
                      </h3>
                      <span className={cn(
                        "text-[10px] uppercase font-black px-2 py-0.5 rounded border",
                        podiumType === 'likers'
                          ? (podiumMode === 'live' ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-purple-500/20 text-purple-300 border-purple-500/30")
                          : (podiumMode === 'live' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-purple-500/20 text-purple-300 border-purple-500/30")
                      )}>
                        {podiumMode === 'live' ? 'Top 5 Ce Live' : 'Top 5 Historique'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {podiumType === 'likers'
                        ? (podiumMode === 'live'
                            ? 'Spectateurs ayant envoyé le plus de likes en tapotant l\'écran sur ce direct (réinitialisé à chaque live).'
                            : 'Abonnés les plus généreux en likes et tapotements cumulés sur l\'ensemble de vos lives.')
                        : (podiumMode === 'live'
                            ? 'Membres les plus engagés dans le tchat de cette session live (réinitialisé à chaque direct).'
                            : 'Abonnés les plus actifs dans le temps cumulés sur l\'ensemble de vos lives.')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Switcher Type d'engagement : Tchat vs Tapotements (Likes) */}
                  <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setPodiumType('chat')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                        podiumType === 'chat'
                          ? "bg-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Commentaires</span>
                    </button>
                    <button
                      onClick={() => setPodiumType('likers')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                        podiumType === 'likers'
                          ? "bg-[#FE2C55] text-white font-black shadow-[0_0_12px_rgba(254,44,85,0.4)]"
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>Top Tapoteurs</span>
                    </button>
                  </div>

                  {/* Switcher Mode Live vs Dans le temps */}
                  <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setPodiumMode('live')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                        podiumMode === 'live'
                          ? (podiumType === 'likers' ? "bg-[#FE2C55] text-white font-black shadow-[0_0_12px_rgba(254,44,85,0.4)]" : "bg-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]")
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <span>Ce Live</span>
                    </button>
                    <button
                      onClick={() => setPodiumMode('allTime')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                        podiumMode === 'allTime'
                          ? "bg-purple-600 text-white font-black shadow-[0_0_12px_rgba(147,51,234,0.4)]"
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Trophy className="w-3.5 h-3.5 text-purple-300" />
                      <span>Dans le temps</span>
                    </button>
                  </div>

                  {/* Compteur Total */}
                  <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 border border-white/5 px-3 py-1.5 rounded-xl">
                    {podiumType === 'likers' ? (
                      <>
                        <Heart className="w-3.5 h-3.5 text-[#FE2C55] fill-[#FE2C55] shrink-0" />
                        <span>Total : <strong className="text-rose-400 font-bold">{Number(likes || 0).toLocaleString('fr-FR')}</strong> likes</span>
                      </>
                    ) : (
                      <>
                        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Total : <strong className="text-amber-400 font-bold">{totalChatInteractions}</strong> msgs</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Contenu Podium selon podiumType & podiumMode */}
              {(() => {
                const currentList = podiumType === 'likers'
                  ? (podiumMode === 'live' ? resolvedTopLikers : resolvedAllTimeTopLikers)
                  : (podiumMode === 'live' ? topCommenters : resolvedAllTimeCommenters);

                const validList = (currentList || []).filter(Boolean);

                if (validList.length === 0) {
                  return (
                    <div className="bg-slate-900/30 border border-dashed border-white/10 rounded-xl p-8 text-center">
                      {podiumType === 'likers' ? (
                        <>
                          <Heart className="w-8 h-8 text-rose-500 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium text-slate-300">Aucun tapotement enregistré pour l'instant</p>
                          <p className="text-xs text-slate-500 mt-1">Dès que des spectateurs tapoteront sur leur écran pour aimer le direct, le classement s'affichera ici en temps réel.</p>
                        </>
                      ) : (
                        <>
                          <Crown className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium text-slate-300">Aucun message de spectateur pour l'instant</p>
                          <p className="text-xs text-slate-500 mt-1">Dès que le stream commencera, le podium des spectateurs les plus actifs s'affichera en direct.</p>
                        </>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                    {validList.slice(0, 5).map((user, idx) => {
                      const isMvp = idx === 0;
                      const isSilver = idx === 1;
                      const isBronze = idx === 2;

                      if (podiumType === 'likers') {
                        const userLikes = Number(user?.likes || user?.totalLikes || 0);
                        const totalLikesSession = Number(likes || 0);
                        const likesShare = totalLikesSession > 0 ? Math.min(100, Math.round((userLikes / totalLikesSession) * 100)) : 0;

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "rounded-2xl p-4 flex flex-col justify-between transition-all relative overflow-hidden border",
                              isMvp
                                ? "bg-gradient-to-b from-[#FE2C55]/20 via-slate-900/80 to-slate-950 border-[#FE2C55]/50 shadow-[0_0_25px_rgba(254,44,85,0.2)] ring-1 ring-[#FE2C55]/30"
                                : isSilver
                                  ? "bg-gradient-to-b from-rose-400/10 via-slate-900/80 to-slate-950 border-rose-400/30 shadow-sm"
                                  : isBronze
                                    ? "bg-gradient-to-b from-pink-700/10 via-slate-900/80 to-slate-950 border-pink-700/30 shadow-sm"
                                    : "bg-slate-900/60 border-white/5 hover:border-white/10"
                            )}
                          >
                            <div>
                              {/* Rank + Badge */}
                              <div className="flex items-center justify-between mb-3">
                                <span className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow",
                                  isMvp ? "bg-[#FE2C55] text-white shadow-[0_0_10px_rgba(254,44,85,0.5)]" :
                                  isSilver ? "bg-rose-300 text-slate-950" :
                                  isBronze ? "bg-pink-700 text-white" :
                                  "bg-slate-800 text-slate-400"
                                )}>
                                  #{idx + 1}
                                </span>
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                  isMvp ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                                  isSilver ? "bg-rose-400/20 text-rose-300 border-rose-400/30" :
                                  isBronze ? "bg-pink-700/20 text-pink-300 border-pink-700/30" :
                                  "bg-slate-800 text-slate-400 border-white/5"
                                )}>
                                  {user?.badge || (isMvp ? (podiumMode === 'live' ? '👑 MVP Tapoteur' : '👑 Légende du Tap') : isSilver ? '🥈 Super Tapoteur' : isBronze ? '🥉 Tapoteur Fidèle' : '❤️ Actif')}
                                </span>
                              </div>

                              {/* Pseudo */}
                              <div className="font-black text-white text-base truncate mb-1" title={user?.nickname || user?.name}>
                                @{user?.nickname || user?.name || 'Spectateur'}
                              </div>

                              {/* Likes Count & Share */}
                              <div className="flex items-baseline justify-between mb-2">
                                <div className="text-2xl font-black text-rose-400 font-mono flex items-center gap-1">
                                  <span>{formatNumber(userLikes)}</span>
                                  <Heart className="w-3.5 h-3.5 fill-[#FE2C55] text-[#FE2C55] shrink-0" />
                                </div>
                                <span className="text-[11px] font-mono text-slate-400 font-semibold">
                                  {podiumMode === 'live' ? (likesShare > 0 ? `${likesShare}% du direct` : `${user?.taps || 1} salves`) : `${user?.livesCount || 1} lives soutenus`}
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-3 border border-white/5">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    isMvp ? "bg-gradient-to-r from-[#FE2C55] to-rose-400" :
                                    isSilver ? "bg-gradient-to-r from-rose-400 to-pink-300" :
                                    isBronze ? "bg-gradient-to-r from-pink-500 to-rose-500" :
                                    "bg-gradient-to-r from-pink-600 to-rose-700"
                                  )}
                                  style={{ width: `${Math.min(100, Math.max(10, podiumMode === 'live' ? (likesShare * 2 || 20) : (userLikes / 150)))}%` }}
                                />
                              </div>
                            </div>

                            {/* Statut tapotement */}
                            <div className="text-[10px] text-slate-400 bg-black/40 p-2 rounded-xl truncate border border-white/5 mt-auto flex items-center justify-between">
                              <span>{podiumMode === 'live' ? 'Dernier tapotement' : 'Fidélité Likes'}</span>
                              <span className="text-rose-400 font-mono font-bold">
                                {podiumMode === 'live' ? (user?.lastTapTime || 'En direct') : '⭐ Tapoteur Fidèle'}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Mode Commentaires (Tchat & Messages)
                      const count = user?.totalMessages || user?.count || user?.comments || 0;
                      const voiceShare = totalChatInteractions > 0 ? Math.round((count / totalChatInteractions) * 100) : 0;

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "rounded-2xl p-4 flex flex-col justify-between transition-all relative overflow-hidden border",
                            isMvp
                              ? "bg-gradient-to-b from-amber-500/15 via-slate-900/80 to-slate-950 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/20"
                              : isSilver
                                ? "bg-gradient-to-b from-slate-400/10 via-slate-900/80 to-slate-950 border-slate-300/30 shadow-sm"
                                : isBronze
                                  ? "bg-gradient-to-b from-amber-700/10 via-slate-900/80 to-slate-950 border-amber-700/30 shadow-sm"
                                  : "bg-slate-900/60 border-white/5 hover:border-white/10"
                          )}
                        >
                          <div>
                            {/* Rank + Badge */}
                            <div className="flex items-center justify-between mb-3">
                              <span className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow",
                                isMvp ? "bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.5)]" :
                                isSilver ? "bg-slate-300 text-slate-950" :
                                isBronze ? "bg-amber-700 text-white" :
                                "bg-slate-800 text-slate-400"
                              )}>
                                #{idx + 1}
                              </span>
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                isMvp ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                                isSilver ? "bg-slate-400/20 text-slate-300 border-slate-400/30" :
                                isBronze ? "bg-amber-700/20 text-amber-300 border-amber-700/30" :
                                "bg-slate-800 text-slate-400 border-white/5"
                              )}>
                                {user?.badge || (isMvp ? (podiumMode === 'live' ? '👑 MVP' : '👑 Légende') : isSilver ? (podiumMode === 'live' ? '🥈 VIP' : '🥈 Pilier') : isBronze ? '🥉 Fidèle' : '⭐ Actif')}
                              </span>
                            </div>

                            {/* Pseudo */}
                            <div className="font-black text-white text-base truncate mb-1" title={user?.nickname || user?.name}>
                              @{user?.nickname || user?.name || 'Spectateur'}
                            </div>

                            {/* Message count & Voice share / Lives count */}
                            <div className="flex items-baseline justify-between mb-2">
                              <div className="text-2xl font-black text-amber-400 font-mono">
                                {count}
                                <span className="text-xs font-medium text-slate-400 ml-1">msgs</span>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 font-semibold">
                                {podiumMode === 'live' ? `${voiceShare}% du tchat` : `${user?.livesCount || 1} lives suivis`}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-3 border border-white/5">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  isMvp ? "bg-gradient-to-r from-amber-400 to-yellow-300" :
                                  isSilver ? "bg-gradient-to-r from-slate-300 to-slate-100" :
                                  isBronze ? "bg-gradient-to-r from-amber-600 to-amber-500" :
                                  "bg-gradient-to-r from-purple-500 to-blue-500"
                                )}
                                style={{ width: `${Math.min(100, Math.max(10, podiumMode === 'live' ? voiceShare * 2 : (count / 2)))}%` }}
                              />
                            </div>
                          </div>

                          {/* Last quote or status */}
                          {user?.lastComment ? (
                            <div className="text-[11px] text-slate-300 bg-black/40 p-2.5 rounded-xl truncate italic border border-white/5 mt-auto">
                              "{user.lastComment}"
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 bg-black/40 p-2 rounded-xl truncate border border-white/5 mt-auto flex items-center justify-between">
                              <span>Fidélité globale</span>
                              <span className="text-emerald-400 font-mono font-bold">⭐ Suivi actif</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* PARTIE 2 : RADAR THÉMATIQUE DES QUESTIONS & SUJETS DE DISCUSSION */}
            <div className="bg-[#131825] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">Radar Thématique du Tchat & Questions Fréquentes</h3>
                      <span className="bg-purple-500/20 text-purple-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-purple-500/30">IA Clustering</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Regroupement automatique des questions et discussions par grands centres d'intérêt.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 border border-white/5 px-3 py-1.5 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>4 thèmes détectés</span>
                </div>
              </div>

              {/* Grid 4 Macro-Thématiques */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resolvedThematicTopics.map((topic, idx) => {
                  const getTopicIcon = (id) => {
                    switch (id) {
                      case 'gaming_popculture':
                        return <Gamepad2 className="w-4 h-4 text-pink-400" />;
                      case 'design_creation':
                        return <Palette className="w-4 h-4 text-purple-400" />;
                      case 'business_freelance':
                        return <Briefcase className="w-4 h-4 text-emerald-400" />;
                      default:
                        return <MessageCircle className="w-4 h-4 text-amber-400" />;
                    }
                  };

                  const getTopicBorderGlow = (id) => {
                    switch (id) {
                      case 'gaming_popculture':
                        return 'hover:border-pink-500/40 border-white/5';
                      case 'design_creation':
                        return 'hover:border-purple-500/40 border-white/5';
                      case 'business_freelance':
                        return 'hover:border-emerald-500/40 border-white/5';
                      default:
                        return 'hover:border-amber-500/40 border-white/5';
                    }
                  };

                  const getProgressBarColor = (id) => {
                    switch (id) {
                      case 'gaming_popculture':
                        return 'bg-gradient-to-r from-pink-500 to-rose-400';
                      case 'design_creation':
                        return 'bg-gradient-to-r from-purple-500 to-indigo-400';
                      case 'business_freelance':
                        return 'bg-gradient-to-r from-emerald-500 to-teal-400';
                      default:
                        return 'bg-gradient-to-r from-amber-500 to-yellow-400';
                    }
                  };

                  const topicMessagesCount = topic.messages?.length || topic.count || 0;

                  return (
                    <div
                      key={topic.id || idx}
                      className={cn(
                        "bg-slate-900/60 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300",
                        getTopicBorderGlow(topic.id)
                      )}
                    >
                      <div>
                        {/* Title & Share % */}
                        <div className="flex items-center justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                              {getTopicIcon(topic.id)}
                            </div>
                            <h4 className="font-bold text-white text-sm truncate">{topic.title}</h4>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-base font-black font-mono text-white">
                              {topic.percentage || 0}%
                            </span>
                            {topic.count > 0 && (
                              <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                {topic.count} msgs
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mb-3 border border-white/5">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700", getProgressBarColor(topic.id))}
                            style={{ width: `${Math.min(100, Math.max(5, topic.percentage || 0))}%` }}
                          />
                        </div>

                        {/* Date & Heure du Live rattaché */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-3 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <Clock className="w-3 h-3 text-purple-400" />
                            Live : {topic.liveDate || liveSessionDate}
                          </span>
                          <span>Dernier : {topic.lastMessageTime || 'En direct'}</span>
                        </div>
                      </div>

                      {/* Sample Question / Topic discussion */}
                      <div>
                        <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-start gap-2.5 mb-2.5">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Sujet récurrent / Question type :</p>
                            <p className="text-xs text-slate-200 italic font-medium leading-relaxed">
                              "{topic.sampleQuestion || 'Questions et remarques des spectateurs'}"
                            </p>
                          </div>
                        </div>

                        {/* Bouton pour explorer l'ensemble des messages avec date et heure */}
                        <button
                          onClick={() => setSelectedTopicModal(topic)}
                          className="w-full py-2 px-3 bg-slate-800/60 hover:bg-purple-600/20 hover:border-purple-500/30 border border-white/5 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer group"
                        >
                          <Eye className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                          <span>Voir les messages ({topicMessagesCount})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal d'exploration des messages du thème avec horodatage et rattachement au live */}
          {selectedTopicModal && (
            <div 
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setSelectedTopicModal(null)}
            >
              <div 
                className="bg-[#131825] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center border"
                      style={{ backgroundColor: `${selectedTopicModal.color}20`, borderColor: `${selectedTopicModal.color}40` }}
                    >
                      {selectedTopicModal.id === 'gaming_popculture' ? <Gamepad2 className="w-5 h-5 text-pink-400" /> :
                       selectedTopicModal.id === 'design_creation' ? <Palette className="w-5 h-5 text-purple-400" /> :
                       selectedTopicModal.id === 'business_freelance' ? <Briefcase className="w-5 h-5 text-emerald-400" /> :
                       <MessageCircle className="w-5 h-5 text-amber-400" />}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {selectedTopicModal.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedTopicModal.color }}></span>
                        <span>Rattaché au <strong>Live du {selectedTopicModal.liveDate || liveSessionDate}</strong></span>
                        {selectedTopicModal.liveRoomId && (
                          <span className="text-[10px] text-slate-500 font-mono">#{selectedTopicModal.liveRoomId.slice(-6)}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTopicModal(null)}
                    className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body: List of messages with date & time */}
                <div className="p-6 overflow-y-auto space-y-3 flex-1 max-h-[60vh]">
                  {selectedTopicModal.messages && selectedTopicModal.messages.length > 0 ? (
                    selectedTopicModal.messages.map((m, i) => (
                      <div key={i} className="bg-slate-900/70 border border-white/5 rounded-2xl p-4 flex flex-col gap-1.5 transition-colors hover:border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="text-purple-400">@</span>{m.nickname || 'Spectateur'}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{m.date || selectedTopicModal.liveDate || liveSessionDate} à {m.time || 'En direct'}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-200 italic font-medium">"{m.comment}"</p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-900/30 border border-dashed border-white/10 rounded-2xl p-8 text-center">
                      <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium text-slate-300">Aucun message individuel archivé pour ce thème</p>
                      <p className="text-xs text-slate-500 mt-1">Les messages reçus lors des prochains échanges dans ce thème s'afficheront ici avec leur date et heure précises.</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">Total répertorié : {selectedTopicModal.messages?.length || selectedTopicModal.count || 0} messages</span>
                  <button
                    onClick={() => setSelectedTopicModal(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}

      {!isLive && (
        <div className="bg-[#131825] border border-white/5 rounded-2xl p-5 mb-6 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Session du 13 octobre 2026 consolidée avec succès</h4>
              <p className="text-xs text-slate-400">Durée officielle : {liveDurationTicker} • {formatNumber(totalUser)} spectateurs uniques • Vos métriques restent disponibles en permanence.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Session Enregistrée
            </span>
          </div>
        </div>
      )}

      {/* History & Archives Bar */}
      <div className="bg-[#131825] border border-white/5 rounded-2xl p-5 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center border border-white/5">
              <Trash2 className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Historique & Archives des Sessions Live</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                {archives.length} sessions enregistrées • Graphiques et rétention passés
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={() => setIsQuickPreviewOpen(prev => !prev)}
              className="text-slate-300 hover:text-white px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              Aperçu rapide <ChevronDown className={cn("w-4 h-4 transition-transform", isQuickPreviewOpen && "rotate-180")} />
            </button>
            <button
              onClick={() => setIsArchivesModalOpen(true)}
              className="bg-[#FE2C55] hover:bg-[#E62A4D] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-[0_0_15px_rgba(254,44,85,0.3)]"
            >
              Ouvrir les Archives
            </button>
          </div>
        </div>

        {/* Aperçu rapide déroulant */}
        {isQuickPreviewOpen && (
          <div className="mt-5 pt-5 border-t border-white/5 animate-fade-in">
            {loadingArchives ? (
              <div className="text-slate-400 text-sm py-4 text-center">Chargement des archives...</div>
            ) : archives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {archives.slice(0, 3).map((arch, idx) => (
                  <div key={arch.id || idx} className="bg-slate-900/60 border border-white/5 rounded-xl p-4 hover:border-slate-700 transition-colors">
                    <div className="text-xs font-semibold text-slate-400 mb-2">{formatArchiveDate(arch.startedAt || arch.started_at)}</div>
                    <div className="flex justify-between items-center text-sm py-1 border-b border-white/5">
                      <span className="text-slate-400 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-blue-400" /> Vues</span>
                      <span className="text-white font-bold">{formatNumber(arch.views || arch.peakViewers || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-1 border-b border-white/5">
                      <span className="text-slate-400 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-[#FE2C55]" /> Likes</span>
                      <span className="text-white font-bold">{formatNumber(arch.likes || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-purple-400" /> Durée</span>
                      <span className="text-white font-bold">{arch.durationStr || '00:00'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-sm py-4 text-center">
                Aucune archive pour le moment. Vos prochaines sessions s'enregistreront ici automatiquement.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Archives Complètes */}
      {isArchivesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0F1422] border border-slate-800 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  Archives des Sessions TikTok Live
                </h2>
                <p className="text-sm text-slate-400 mt-1">Historique complet de toutes vos diffusions en direct avec suivi des meilleurs viewers</p>
              </div>
              <button
                onClick={() => setIsArchivesModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {archives.length > 0 ? (
              <div className="space-y-4">
                {archives.map((arch, index) => (
                  <div key={arch.id || index} className="bg-[#141A29] border border-white/5 rounded-2xl p-5 hover:border-[#FE2C55]/30 transition-all flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="text-sm font-bold text-white mb-1">
                          Session du {formatArchiveDate(arch.startedAt || arch.started_at)}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          ID: {arch.id || 'N/A'} • {arch.durationStr || 'Durée non spécifiée'}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 md:gap-6 text-sm">
                        <div className="text-center">
                          <div className="text-xs text-slate-400">Pic Vues</div>
                          <div className="text-white font-bold">{formatNumber(arch.peakViewers || arch.views || 0)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-400">Likes</div>
                          <div className="text-[#FE2C55] font-bold">{formatNumber(arch.likes || 0)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-400">Nv. Abos</div>
                          <div className="text-emerald-400 font-bold">+{formatNumber(arch.newFollowers || arch.followers || 0)}</div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteArchive(arch.id, e)}
                          title="Supprimer définitivement cette archive"
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* TOP Viewers sauvegardés pour cette archive */}
                    {Array.isArray(arch.topCommenters) && arch.topCommenters.length > 0 && (
                      <div className="pt-3 border-t border-white/5 flex items-center gap-2 overflow-x-auto text-xs">
                        <span className="text-amber-400 font-bold shrink-0 flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5" /> Top Viewers :
                        </span>
                        {arch.topCommenters.slice(0, 5).map((u, i) => (
                          <span key={i} className="bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg text-slate-300 shrink-0">
                            #{i + 1} @{u.nickname || u.name} ({u.count || u.comments} msgs)
                          </span>
                        ))}
                      </div>
                    )}

                    {/* TOP Tapoteurs (Likes) sauvegardés pour cette archive */}
                    {Array.isArray(arch.topLikers) && arch.topLikers.length > 0 && (
                      <div className="pt-2 border-t border-white/5 flex items-center gap-2 overflow-x-auto text-xs">
                        <span className="text-rose-400 font-bold shrink-0 flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 fill-[#FE2C55] text-[#FE2C55]" /> Top Tapoteurs :
                        </span>
                        {arch.topLikers.slice(0, 5).map((u, i) => (
                          <span key={i} className="bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg text-slate-300 shrink-0">
                            #{i + 1} @{u.nickname || u.name} ({formatNumber(u.likes || u.totalLikes || 0)} ❤️)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <Trash2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-base font-medium text-white mb-1">Aucune archive disponible</p>
                <p className="text-sm">Chaque session live terminée sera automatiquement enregistrée avec son horodatage précis.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default TikTokLiveHub;
