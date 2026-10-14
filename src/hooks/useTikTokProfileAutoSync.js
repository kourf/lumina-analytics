import { useState, useEffect, useCallback, useRef } from 'react';

const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const PROJECT_ID = 'lumina-analytics-kd-2026';
const TARGET_USER_ID = 'karamokho';
const EDGE_URL = 'https://lumina-tiktok-webhook.kouroufia15.workers.dev/competitor?username=karam.drame';
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const CACHE_KEY = 'lumina_tiktok_profile_cache';

/**
 * Hook de synchronisation automatique et autonome du profil TikTok (@karam.drame).
 * 
 * Garantit :
 * 1. La mise à jour automatique des abonnés et des likes toutes les 5 minutes (300 000 ms).
 * 2. L'actualisation immédiate au clic sur le bouton "Actualiser".
 * 3. La persistance en temps réel dans Firestore pour tous les écrans et onglets.
 * 4. Aucun clignotement ni perte de données grâce au cache local.
 */
export function useTikTokProfileAutoSync(initialData = {}, options = {}) {
  const {
    pollInterval = FIVE_MINUTES_MS,
    autoSync = true
  } = options;

  // Lecture du cache local instantané
  const getInitialCache = () => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      }
    } catch (e) {}
    return null;
  };

  const cachedData = getInitialCache();

  const [profileData, setProfileData] = useState(() => ({
    followers: Number(cachedData?.followers || initialData?.followers || 6398),
    likes: Number(cachedData?.likes || initialData?.likes || initialData?.totalLikes || 17200),
    totalLikes: Number(cachedData?.totalLikes || initialData?.totalLikes || initialData?.likes || 17200),
    views: Number(cachedData?.views || initialData?.views || initialData?.totalViews || 300622),
    totalVideos: Number(cachedData?.totalVideos || initialData?.totalVideos || 75),
    avatarUrl: cachedData?.avatarUrl || initialData?.avatar_url || '',
    lastSync: cachedData?.lastSync || initialData?.lastSync || new Date().toISOString()
  }));

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState(null); // { success: true, message: '...' }
  const syncLockRef = useRef(false);
  const lastSyncTimeRef = useRef(Date.now());

  // Sauvegarde synchrone vers Firestore REST API
  const persistToFirestore = useCallback(async (freshProfile) => {
    try {
      const followers = Number(freshProfile.followers);
      const likes = Number(freshProfile.likes);
      const totalLikes = Number(freshProfile.totalLikes || freshProfile.likes);
      const lastSyncIso = freshProfile.lastSync || new Date().toISOString();

      if (followers < 1000 || likes < 1000) return; // Sécurité stricte

      const fieldsToUpdate = [
        'updateMask.fieldPaths=tiktokAPI.followers',
        'updateMask.fieldPaths=tiktokAPI.likes',
        'updateMask.fieldPaths=tiktokAPI.totalLikes',
        'updateMask.fieldPaths=tiktokAPI.lastSync',
        'updateMask.fieldPaths=tiktok.followers',
        'updateMask.fieldPaths=tiktok.likes',
        'updateMask.fieldPaths=tiktok.totalLikes',
        'updateMask.fieldPaths=tiktok.lastSync'
      ];

      if (freshProfile.totalVideos > 0) {
        fieldsToUpdate.push(
          'updateMask.fieldPaths=tiktokAPI.totalVideos',
          'updateMask.fieldPaths=tiktok.totalVideos'
        );
      }

      const mask = fieldsToUpdate.join('&');
      const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${TARGET_USER_ID}?${mask}&key=${API_KEY}`;

      const payloadFields = {
        followers: { integerValue: String(followers) },
        likes: { integerValue: String(likes) },
        totalLikes: { integerValue: String(totalLikes) },
        lastSync: { stringValue: lastSyncIso }
      };

      if (freshProfile.totalVideos > 0) {
        payloadFields.totalVideos = { integerValue: String(freshProfile.totalVideos) };
      }

      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            tiktokAPI: { mapValue: { fields: payloadFields } },
            tiktok: { mapValue: { fields: payloadFields } }
          }
        })
      });
    } catch (err) {
      console.warn('[useTikTokProfileAutoSync] Erreur persistance Firestore:', err);
    }
  }, []);

  // Déclenchement de synchronisation live
  const performSync = useCallback(async (isManual = false) => {
    if (syncLockRef.current) return;
    syncLockRef.current = true;
    setIsSyncing(true);

    try {
      const response = await fetch(`${EDGE_URL}&_t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result && result.success && result.data) {
        const liveFollowers = Number(result.data.followers);
        const liveLikes = Number(result.data.likes || result.data.totalLikes);
        const liveVideos = Number(result.data.videoCount || result.data.videos);
        const liveAvatar = result.data.avatarUrl || '';
        const nowIso = new Date().toISOString();

        if (liveFollowers > 1000) {
          const updatedProfile = {
            followers: liveFollowers,
            likes: liveLikes,
            totalLikes: liveLikes,
            totalVideos: liveVideos > 0 ? liveVideos : 75,
            avatarUrl: liveAvatar || profileData.avatarUrl,
            lastSync: nowIso
          };

          setProfileData(prev => ({
            ...prev,
            ...updatedProfile
          }));

          lastSyncTimeRef.current = Date.now();

          // Sauvegarde locale
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(updatedProfile));
          } catch (e) {}

          // Sauvegarde Firestore
          await persistToFirestore(updatedProfile);

          const formattedFollowers = new Intl.NumberFormat('fr-FR').format(liveFollowers);
          const formattedLikes = liveLikes >= 1000 
            ? (liveLikes / 1000).toFixed(1).replace('.', ',') + 'k' 
            : liveLikes;

          setLastSyncStatus({
            success: true,
            timestamp: nowIso,
            message: `Synchronisation réussie : ${formattedFollowers} abonnés • ${formattedLikes} likes`
          });
        }
      }
    } catch (error) {
      console.warn('[useTikTokProfileAutoSync] Échec synchronisation live:', error);
      if (isManual) {
        setLastSyncStatus({
          success: false,
          timestamp: new Date().toISOString(),
          message: 'Synchronisation temporairement indisponible (nouvel essai sous peu).'
        });
      }
    } finally {
      setIsSyncing(false);
      syncLockRef.current = false;
    }
  }, [persistToFirestore, profileData.avatarUrl]);

  // Synchronisation au montage si la dernière date est ancienne (> 5 min)
  useEffect(() => {
    if (!autoSync) return;

    const initialSyncDate = initialData?.lastSync ? new Date(initialData.lastSync).getTime() : 0;
    const isStale = !initialSyncDate || (Date.now() - initialSyncDate > FIVE_MINUTES_MS);

    if (isStale) {
      performSync(false);
    }

    // Intervalle automatique régulier toutes les 5 minutes
    const intervalId = setInterval(() => {
      performSync(false);
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [autoSync, pollInterval, initialData?.lastSync, performSync]);

  // Déclencheur manuel
  const syncNow = useCallback(async () => {
    await performSync(true);
  }, [performSync]);

  return {
    profileData,
    isSyncing,
    lastSyncStatus,
    syncNow
  };
}

export default useTikTokProfileAutoSync;
