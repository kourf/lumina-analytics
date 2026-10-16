import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { checkTikTokLiveStatus } from '../services/tiktokLiveService';

/**
 * Hook temps réel pour surveiller automatiquement le statut Live TikTok de @karam.drame.
 * Urbanisation SI :
 * - Ne détruit jamais les KPIs accumulés (peakViewers, cumulative_audience, recentComments, etc.)
 * - Évite les écritures Firestore redondantes quand le statut est déjà OFFLINE
 * - Ignore les erreurs réseau transitoires (preserveExisting) pour ne pas couper un Live actif
 *
 * @param {string} username - Compte TikTok à surveiller (défaut: 'karam.drame')
 * @param {object} initialLiveState - État initial issu de Firestore (appData.tiktokLiveAPI)
 * @param {number} intervalMs - Fréquence de vérification en millisecondes (défaut: 30000 = 30s)
 */
export const useTikTokLiveStatus = (
  username = 'karam.drame',
  initialLiveStateOrOptions = null,
  intervalMsArg = 30000
) => {
  const isOptionsObj =
    initialLiveStateOrOptions &&
    typeof initialLiveStateOrOptions === 'object' &&
    ('pollInterval' in initialLiveStateOrOptions ||
      'autoCheck' in initialLiveStateOrOptions ||
      'initialData' in initialLiveStateOrOptions);

  const initialLiveState = isOptionsObj
    ? initialLiveStateOrOptions.initialData || null
    : initialLiveStateOrOptions;

  const intervalMs = isOptionsObj
    ? Number(initialLiveStateOrOptions.pollInterval || 30000)
    : Number(intervalMsArg || 30000);

  const [liveState, setLiveState] = useState({
    isLive: Boolean(initialLiveState?.isLive || initialLiveState?.status === 'LIVE'),
    status: initialLiveState?.isLive || initialLiveState?.status === 'LIVE' ? 'LIVE' : 'OFFLINE',
    roomId: initialLiveState?.roomId || null,
    title: initialLiveState?.title || '',
    viewers: Number(initialLiveState?.currentViewers || initialLiveState?.viewers || 0),
    peakViewers: Number(initialLiveState?.peakViewers || 0),
    totalUser: Number(initialLiveState?.totalUser || initialLiveState?.cumulative_audience || 0),
    likes: Number(initialLiveState?.likes ?? initialLiveState?.totalLikes ?? 0),
    shares: Number(initialLiveState?.shares ?? initialLiveState?.totalShares ?? 0),
    comments: Number(initialLiveState?.comments ?? initialLiveState?.totalComments ?? 0),
    startedAt: initialLiveState?.started_at || initialLiveState?.startedAt || null,
    lastCheckedAt: initialLiveState?.lastCheckedAt || null,
    checkSource: initialLiveState?.checkSource || 'firestore-cache',
    isChecking: false,
    error: null
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    if (initialLiveState) {
      const isCurrentlyLive = Boolean(initialLiveState.isLive || initialLiveState.status === 'LIVE');
      setLiveState((prev) => ({
        ...prev,
        isLive: isCurrentlyLive,
        status: isCurrentlyLive ? 'LIVE' : 'OFFLINE',
        roomId: initialLiveState.roomId || prev.roomId,
        title: initialLiveState.title || prev.title,
        viewers: isCurrentlyLive
          ? Number(initialLiveState.currentViewers ?? initialLiveState.viewers ?? prev.viewers ?? 0)
          : 0,
        peakViewers: Math.max(Number(initialLiveState.peakViewers || 0), prev.peakViewers || 0),
        totalUser: Math.max(Number(initialLiveState.totalUser || initialLiveState.cumulative_audience || 0), prev.totalUser || 0),
        likes: Math.max(Number(initialLiveState.likes ?? initialLiveState.totalLikes ?? 0), prev.likes || 0),
        shares: Math.max(Number(initialLiveState.shares ?? initialLiveState.totalShares ?? 0), prev.shares || 0),
        comments: Math.max(Number(initialLiveState.comments ?? initialLiveState.totalComments ?? 0), prev.comments || 0),
        startedAt: initialLiveState.started_at || initialLiveState.startedAt || prev.startedAt,
        lastCheckedAt: initialLiveState.lastCheckedAt || prev.lastCheckedAt
      }));
    }
  }, [
    initialLiveState?.isLive,
    initialLiveState?.status,
    initialLiveState?.currentViewers,
    initialLiveState?.peakViewers,
    initialLiveState?.totalUser,
    initialLiveState?.likes,
    initialLiveState?.shares,
    initialLiveState?.comments,
    initialLiveState?.started_at,
    initialLiveState?.startedAt,
    initialLiveState?.roomId,
    initialLiveState?.title
  ]);

  const verifyLiveNow = useCallback(async () => {
    if (!isMountedRef.current) return null;

    setLiveState((prev) => ({ ...prev, isChecking: true, error: null }));

    try {
      const result = await checkTikTokLiveStatus(username);

      if (!isMountedRef.current) return result;

      // Si toutes les passerelles ont échoué (erreur réseau transitoire), on préserve l'état existant
      if (result.preserveExisting) {
        setLiveState((prev) => ({
          ...prev,
          isChecking: false,
          lastCheckedAt: result.checkedAt,
          error: result.error || null
        }));
        return result;
      }

      setLiveState((prev) => ({
        isLive: result.isLive,
        status: result.status,
        roomId: result.roomId,
        title: result.title,
        viewers: result.viewers,
        peakViewers: result.isLive ? Math.max(Number(result.peakViewers || 0), Number(result.viewers || 0), prev.peakViewers || 0) : prev.peakViewers,
        totalUser: result.isLive ? Math.max(Number(result.totalUser || 0), prev.totalUser || 0) : prev.totalUser,
        likes: result.isLive ? Math.max(Number(result.likes || 0), prev.likes || 0) : prev.likes,
        shares: result.isLive ? Math.max(Number(result.shares || 0), prev.shares || 0) : prev.shares,
        comments: result.isLive ? Math.max(Number(result.comments || 0), prev.comments || 0) : prev.comments,
        startedAt: result.startedAt || prev.startedAt,
        lastCheckedAt: result.checkedAt,
        checkSource: result.source,
        isChecking: false,
        error: result.error || null
      }));

      // Si la passerelle (firestore-live-sync ou firebase-live-gateway) a répondu, Firestore est déjà à jour
      if (result.source === 'firestore-live-sync' || result.source === 'firebase-live-gateway') {
        return result;
      }

      // Synchronisation intelligente dans Firestore (uniquement en cas de bascule sur Niveau 2 Proxy)
      try {
        const docRef = doc(db, 'users', 'karamokho');
        const currentSnap = await getDoc(docRef);
        const existingData = currentSnap.exists() ? (currentSnap.data().tiktokLiveAPI || {}) : {};
        const wasLive = Boolean(existingData.isLive || existingData.status === 'LIVE');
        const nowLive = Boolean(result.isLive);

        if (!nowLive && !wasLive && existingData.status === 'OFFLINE') {
          return result;
        }

        const currentViewers = nowLive ? Number(result.viewers ?? existingData.currentViewers ?? 0) : 0;
        const peakViewers = nowLive
          ? Math.max(Number(existingData.peakViewers || 0), currentViewers)
          : Number(existingData.peakViewers || 0);
        const totalUser = nowLive
          ? Math.max(Number(existingData.totalUser || existingData.cumulative_audience || 0), Number(result.totalUser || 0), currentViewers)
          : Number(existingData.totalUser || existingData.cumulative_audience || 0);

        const resolvedStart = nowLive
          ? (result.startedAt || existingData.started_at || existingData.startedAt || new Date().toISOString())
          : (existingData.started_at || existingData.startedAt || null);

        await setDoc(docRef, {
          tiktokLiveAPI: {
            ...existingData,
            isLive: nowLive,
            status: nowLive ? 'LIVE' : 'OFFLINE',
            roomId: nowLive ? (result.roomId || existingData.roomId || null) : (existingData.roomId || null),
            title: nowLive ? (result.title || existingData.title || 'TikTok Live en cours') : (existingData.title || ''),
            currentViewers,
            peakViewers,
            totalUser,
            total_user: totalUser,
            cumulative_audience: totalUser,
            likes: Math.max(Number(existingData.likes || existingData.totalLikes || 0), Number(result.likes || 0)),
            totalLikes: Math.max(Number(existingData.totalLikes || existingData.likes || 0), Number(result.likes || 0)),
            shares: Math.max(Number(existingData.shares || existingData.totalShares || 0), Number(result.shares || 0)),
            totalShares: Math.max(Number(existingData.totalShares || existingData.shares || 0), Number(result.shares || 0)),
            started_at: resolvedStart,
            startedAt: resolvedStart,
            endedAt: !nowLive && wasLive ? new Date().toISOString() : (existingData.endedAt || null),
            lastCheckedAt: result.checkedAt,
            checkSource: result.source,
            errorMessage: null
          }
        }, { merge: true });
      } catch (firestoreErr) {
        console.debug('[useTikTokLiveStatus] Écriture Firestore ignorée:', firestoreErr.message);
      }

      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setLiveState((prev) => ({
          ...prev,
          isChecking: false,
          error: err.message
        }));
      }
      return null;
    }
  }, [username]);

  useEffect(() => {
    isMountedRef.current = true;
    verifyLiveNow();

    const timer = setInterval(() => {
      verifyLiveNow();
    }, intervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  }, [verifyLiveNow, intervalMs]);

  return {
    ...liveState,
    viewerCount: liveState.viewers,
    isRefreshing: liveState.isChecking,
    lastChecked: liveState.lastCheckedAt,
    forceCheck: verifyLiveNow,
    refresh: verifyLiveNow
  };
};
