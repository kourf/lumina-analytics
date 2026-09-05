import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  verifyTikTokLiveStatus, 
  getCachedTikTokLiveStatus, 
  sanitizeTikTokUsername, 
  LIVE_STATUS 
} from '../services/tiktokLiveService';

const REFRESH_THROTTLE_MS = 5000; // 5-second cooldown for user manual refresh

/**
 * Custom hook to monitor and manage TikTok creator live status with
 * Stale-While-Revalidate (SWR) 60-second caching, throttle protection,
 * and resilient 3-state management.
 * 
 * @param {string} rawUsername - Creator username or handle (e.g., 'jkaram')
 * @param {object} [options]
 * @param {boolean} [options.autoCheck=true] - Auto-fetch on mount/change
 * @param {number} [options.pollInterval=60000] - Polling frequency (default 60s)
 * @param {object} [options.initialData] - Optional initial fallback data
 */
export function useTikTokLiveStatus(rawUsername, options = {}) {
  const {
    autoCheck = true,
    pollInterval = 60000,
    initialData = null
  } = options;

  const username = sanitizeTikTokUsername(rawUsername);

  // Initialize from SWR cache or initialData if available
  const [liveState, setLiveState] = useState(() => {
    if (!username) {
      return {
        status: LIVE_STATUS.OFFLINE,
        isLive: false,
        username: '',
        displayName: '',
        roomId: null,
        viewerCount: 0,
        title: '',
        startedAt: null,
        lastActiveAt: null,
        lastChecked: null,
        error: null,
      };
    }

    const cached = getCachedTikTokLiveStatus(username);
    if (cached) {
      return cached;
    }

    if (initialData) {
      return {
        status: initialData.isLive ? LIVE_STATUS.LIVE : LIVE_STATUS.OFFLINE,
        isLive: Boolean(initialData.isLive),
        username,
        displayName: initialData.displayName || initialData.username || username,
        avatarUrl: initialData.avatarUrl || null,
        roomId: initialData.roomId || null,
        viewerCount: Number(initialData.currentViewers || initialData.viewerCount || 0),
        title: initialData.title || '',
        startedAt: initialData.started_at || initialData.startedAt || null,
        lastActiveAt: initialData.lastActiveAt || initialData.lastDetected || null,
        lastChecked: new Date().toISOString(),
        error: null,
      };
    }

    return {
      status: LIVE_STATUS.LOADING,
      isLive: false,
      username,
      displayName: username,
      roomId: null,
      viewerCount: 0,
      title: '',
      startedAt: null,
      lastActiveAt: null,
      lastChecked: null,
      error: null,
    };
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const lastManualFetchRef = useRef(0);
  const abortControllerRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  /**
   * Core verification function
   */
  const performCheck = useCallback(async (isForced = false) => {
    if (!username) return;

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsRefreshing(true);

    try {
      const result = await verifyTikTokLiveStatus(username, {
        forceRefresh: isForced,
        signal: abortControllerRef.current.signal,
      });

      setLiveState(result);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setLiveState(prev => ({
          ...prev,
          status: LIVE_STATUS.STATUS_UNKNOWN,
          isLive: false, // NEVER assume LIVE on error
          error: err.message || 'Échec de vérification du direct',
          lastChecked: new Date().toISOString(),
        }));
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [username]);

  /**
   * Manual refresh handler with throttling / debouncing
   */
  const refresh = useCallback(async () => {
    const now = Date.now();
    const timeSinceLast = now - lastManualFetchRef.current;

    if (timeSinceLast < REFRESH_THROTTLE_MS) {
      const remainingSecs = Math.ceil((REFRESH_THROTTLE_MS - timeSinceLast) / 1000);
      setCooldownRemaining(remainingSecs);

      // Start countdown timer for UI feedback
      if (!cooldownTimerRef.current) {
        cooldownTimerRef.current = setInterval(() => {
          const updatedDiff = Date.now() - lastManualFetchRef.current;
          if (updatedDiff >= REFRESH_THROTTLE_MS) {
            setCooldownRemaining(0);
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          } else {
            setCooldownRemaining(Math.ceil((REFRESH_THROTTLE_MS - updatedDiff) / 1000));
          }
        }, 1000);
      }
      return;
    }

    lastManualFetchRef.current = now;
    setCooldownRemaining(0);
    await performCheck(true);
  }, [performCheck]);

  // Initial check & username synchronization
  useEffect(() => {
    if (!autoCheck || !username) return;

    // Fast check (uses SWR cache if fresh, otherwise fetches)
    performCheck(false);

    // Periodic polling (every 60s)
    let pollTimer = null;
    if (pollInterval > 0) {
      pollTimer = setInterval(() => {
        performCheck(false);
      }, pollInterval);
    }

    // Global custom event listener
    const handleGlobalRefresh = () => {
      performCheck(true);
    };
    window.addEventListener('tiktok:refresh', handleGlobalRefresh);

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      window.removeEventListener('tiktok:refresh', handleGlobalRefresh);
    };
  }, [username, autoCheck, pollInterval, performCheck]);

  return {
    status: liveState.status,
    isLive: liveState.isLive,
    username: liveState.username || username,
    displayName: liveState.displayName || username,
    avatarUrl: liveState.avatarUrl || null,
    roomId: liveState.roomId || null,
    viewerCount: liveState.viewerCount || 0,
    title: liveState.title || '',
    startedAt: liveState.startedAt || null,
    lastActiveAt: liveState.lastActiveAt || null,
    lastChecked: liveState.lastChecked || null,
    liveUrl: liveState.liveUrl || `https://www.tiktok.com/@${username}`,
    error: liveState.error || null,
    fromCache: Boolean(liveState.fromCache),
    isRefreshing,
    isThrottled: cooldownRemaining > 0,
    cooldownRemaining,
    refresh,
  };
}

export default useTikTokLiveStatus;
