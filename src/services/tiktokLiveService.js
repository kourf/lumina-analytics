/**
 * TikTok Live Status Detection Service
 * 
 * Provides robust live status verification, resilient error handling,
 * and client-side Stale-While-Revalidate (SWR) 60-second caching.
 * 
 * Rules:
 * 1. Never fallback to 'LIVE' on API failure (403, 429, timeout, network error).
 * 2. True live strictly requires: valid roomId + room status code === 2.
 * 3. Default to 'STATUS_UNKNOWN' on rate-limits/errors and 'OFFLINE' when no stream is active.
 */

// Stale-While-Revalidate (SWR) cache storage
// key: normalized username -> { data: StatusResult, timestamp: number }
const liveStatusCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

// Status Enums
export const LIVE_STATUS = {
  LIVE: 'LIVE',
  OFFLINE: 'OFFLINE',
  STATUS_UNKNOWN: 'STATUS_UNKNOWN',
  LOADING: 'LOADING',
};

/**
 * Sanitizes and normalizes a TikTok username or handle.
 * Strips leading '@', URL protocols, domain paths, and query parameters.
 * 
 * @param {string} input - Raw username, handle or profile URL
 * @returns {string} Sanitized clean handle (e.g., 'karam.drame')
 */
export function sanitizeTikTokUsername(input) {
  if (!input || typeof input !== 'string') return '';

  let cleaned = input.trim();

  // If a URL was provided (e.g. https://www.tiktok.com/@karam.drame?lang=en)
  if (cleaned.includes('tiktok.com/')) {
    const afterDomain = cleaned.split('tiktok.com/')[1] || '';
    cleaned = afterDomain.split('/')[0].split('?')[0];
  }

  // Remove leading '@' and whitespace
  cleaned = cleaned.replace(/^@+/, '').trim();

  // Strip query parameters or hashes
  cleaned = cleaned.split('?')[0].split('#')[0];

  // Whitelist safe username characters: alphanumeric, underscore, dot, hyphen
  cleaned = cleaned.replace(/[^a-zA-Z0-9_.-]/g, '');

  return cleaned.toLowerCase();
}

/**
 * Validates whether the raw API payload indicates a genuine, active live stream.
 * 
 * According to TikTok Webcast API:
 * - room.status === 2 indicates an ongoing, active broadcast.
 * - room.status === 4 indicates the stream ended.
 * - Must have a valid, non-empty roomId / room_id / id_str.
 * 
 * @param {any} roomData - Raw room data object
 * @returns {boolean} True if confirmed live, false otherwise
 */
export function validateTrueLiveCondition(roomData, expectedUsername = 'karam.drame') {
  if (!roomData || typeof roomData !== 'object') return false;

  // Extract room ID
  const roomId = String(roomData.roomId || roomData.room_id || roomData.id_str || roomData.id || '');
  if (!roomId || roomId.trim() === '' || roomId === '0' || roomId === 'unknown') {
    return false;
  }

  // Vérification stricte du propriétaire si les métadonnées sont présentes
  const ownerDisplayId = (roomData.owner?.display_id || roomData.owner?.unique_id || roomData.display_id || '').toLowerCase();
  const ownerId = String(roomData.owner?.id_str || roomData.owner?.id || '');
  const targetHandle = (expectedUsername || 'karam.drame').toLowerCase().replace(/^@+/, '');
  const targetUserId = '7030929632657638405';

  if (ownerDisplayId && ownerDisplayId !== targetHandle) {
    return false; // Ce direct appartient à un autre streamer (ex: equinoxerpfr)
  }
  if (ownerId && ownerId !== targetUserId && ownerDisplayId === '') {
    return false;
  }

  // Verify room status code === 2 (Active Live Broadcast)
  const rawStatus = roomData.status ?? roomData.room_status ?? roomData.live_status;
  if (rawStatus === undefined || rawStatus === null) {
    // Si aucun statut numérique n'est fourni, on exige au minimum isLive explicite
    return Boolean(roomData.isLive === true && Number(roomData.currentViewers || roomData.user_count || 0) > 0);
  }

  const statusCode = Number(rawStatus);
  // SEUL le status 2 certifie un direct en cours. Status 4 = terminé, 0 = inactif
  return statusCode === 2;
}

/**
 * Fetches verified live status for a TikTok creator with SWR caching.
 * 
 * @param {string} rawUsername - Creator username (e.g. 'karam.drame')
 * @param {object} [options]
 * @param {boolean} [options.forceRefresh=false] - Bypass cache and force network check
 * @param {AbortSignal} [options.signal] - AbortSignal for request cancellation
 * @returns {Promise<any>}
 */
export async function verifyTikTokLiveStatus(rawUsername, options = {}) {
  const { forceRefresh = false, signal } = options;
  const username = sanitizeTikTokUsername(rawUsername);

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
      lastChecked: new Date().toISOString(),
      error: 'Nom d’utilisateur invalide',
      fromCache: false,
    };
  }

  const now = Date.now();
  const cached = liveStatusCache.get(username);

  // Return fresh cache immediately unless forceRefresh is requested
  if (!forceRefresh && cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return {
      ...cached.data,
      fromCache: true,
      cacheAgeMs: now - cached.timestamp,
    };
  }

  // Base offline fallback record
  const fallbackOffline = {
    status: LIVE_STATUS.OFFLINE,
    isLive: false,
    username,
    displayName: username,
    roomId: null,
    viewerCount: 0,
    title: '',
    startedAt: null,
    lastActiveAt: cached?.data?.lastActiveAt || null,
    lastChecked: new Date().toISOString(),
    error: null,
    fromCache: false,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    let effectiveSignal = controller.signal;
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    let response = null;
    const endpointUrl = `https://lumina-tiktok-webhook.kouroufia15.workers.dev/live-status?username=${encodeURIComponent(username)}&_t=${now}`;

    // Standard GET request without custom headers that would trigger CORS preflight OPTIONS
    try {
      response = await fetch(endpointUrl, {
        signal: effectiveSignal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle HTTP status codes defensively
    if (!response || !response.ok) {
      const statusCode = response?.status || 0;

      // Rate limited (429) or Forbidden / Bot Challenge (403)
      if (statusCode === 429 || statusCode === 403) {
        const errorResult = {
          status: LIVE_STATUS.STATUS_UNKNOWN,
          isLive: false, // CRITICAL: NEVER assume LIVE on 429/403
          username,
          displayName: cached?.data?.displayName || username,
          roomId: null,
          viewerCount: 0,
          title: '',
          startedAt: null,
          lastActiveAt: cached?.data?.lastActiveAt || null,
          lastChecked: new Date().toISOString(),
          error: statusCode === 429 
            ? 'Limite de requêtes TikTok atteinte (HTTP 429). Réessai automatique dans 60s.'
            : 'Vérification TikTok temporairement protégée (HTTP 403).',
          fromCache: false,
        };

        liveStatusCache.set(username, { data: errorResult, timestamp: now - (CACHE_TTL_MS / 2) });
        return errorResult;
      }

      // If user profile is not found (404), creator is offline
      if (statusCode === 404) {
        const notFoundResult = {
          ...fallbackOffline,
          error: 'Compte ou stream introuvable.',
        };
        liveStatusCache.set(username, { data: notFoundResult, timestamp: now });
        return notFoundResult;
      }

      // Any other server error (500, 502, 503)
      const serverErrorResult = {
        status: LIVE_STATUS.STATUS_UNKNOWN,
        isLive: false,
        username,
        displayName: cached?.data?.displayName || username,
        roomId: null,
        viewerCount: 0,
        title: '',
        startedAt: null,
        lastActiveAt: cached?.data?.lastActiveAt || null,
        lastChecked: new Date().toISOString(),
        error: `Service de vérification indisponible (HTTP ${statusCode}).`,
        fromCache: false,
      };
      return serverErrorResult;
    }

    // Ensure response has valid JSON content-type
    const contentType = response.headers?.get?.('content-type') || '';
    if (contentType && !contentType.includes('application/json')) {
      return fallbackOffline;
    }

    // Parse JSON safely
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      return fallbackOffline;
    }
    if (!payload || typeof payload !== 'object') {
      return fallbackOffline;
    }

    // Extract potential room data structure
    const roomInfo = payload.room || payload.roomInfo?.data || payload.data || payload;
    const isLiveConfirmed = validateTrueLiveCondition(roomInfo, username);

    if (isLiveConfirmed) {
      const viewerCount = Math.max(0, Number(
        roomInfo.user_count || 
        roomInfo.viewer_count || 
        roomInfo.viewerCount || 
        roomInfo.viewers || 
        payload.currentViewers || 
        0
      ));

      const startedAt = roomInfo.create_time 
        ? new Date(roomInfo.create_time * 1000).toISOString()
        : (roomInfo.started_at || roomInfo.startedAt || new Date().toISOString());

      const liveResult = {
        status: LIVE_STATUS.LIVE,
        isLive: true,
        username,
        displayName: roomInfo.owner?.nickname || payload.displayName || username,
        avatarUrl: roomInfo.owner?.avatar_thumb?.url_list?.[0] || payload.avatarUrl || null,
        roomId: String(roomInfo.roomId || roomInfo.room_id || roomInfo.id_str || roomInfo.id),
        viewerCount,
        title: roomInfo.title || payload.title || 'Live TikTok en direct',
        startedAt,
        lastActiveAt: startedAt,
        lastChecked: new Date().toISOString(),
        liveUrl: `https://www.tiktok.com/@${username}/live`,
        error: null,
        fromCache: false,
      };

      liveStatusCache.set(username, { data: liveResult, timestamp: now });
      return liveResult;
    }

    // Not live: creator is confirmed OFFLINE
    const offlineResult = {
      status: LIVE_STATUS.OFFLINE,
      isLive: false,
      username,
      displayName: payload.displayName || payload.display_name || username,
      avatarUrl: payload.avatarUrl || payload.avatar_url || null,
      roomId: null,
      viewerCount: 0,
      title: '',
      startedAt: null,
      lastActiveAt: payload.lastActiveAt || payload.lastDetected || cached?.data?.lastActiveAt || null,
      lastChecked: new Date().toISOString(),
      liveUrl: `https://www.tiktok.com/@${username}`,
      error: null,
      fromCache: false,
    };

    liveStatusCache.set(username, { data: offlineResult, timestamp: now });
    return offlineResult;

  } catch (err) {
    const isAbort = err.name === 'AbortError';
    const unknownResult = {
      status: LIVE_STATUS.STATUS_UNKNOWN,
      isLive: false, // CRITICAL: NEVER fallback to 'LIVE' on exception
      username,
      displayName: cached?.data?.displayName || username,
      roomId: null,
      viewerCount: 0,
      title: '',
      startedAt: null,
      lastActiveAt: cached?.data?.lastActiveAt || null,
      lastChecked: new Date().toISOString(),
      error: isAbort 
        ? 'Délai d’attente dépassé (timeout vérification).'
        : `Erreur de connexion : ${err.message || 'Réseau indisponible'}`,
      fromCache: false,
    };

    return unknownResult;
  }
}

/**
 * Clears the SWR in-memory cache for a specific creator or all creators.
 * 
 * @param {string} [username] - Optional username to clear, or clears all if omitted
 */
export function clearTikTokLiveCache(username) {
  if (username) {
    const clean = sanitizeTikTokUsername(username);
    liveStatusCache.delete(clean);
  } else {
    liveStatusCache.clear();
  }
}

/**
 * Returns current cached live status for a username if available.
 * 
 * @param {string} username - Creator username
 * @returns {any}
 */
export function getCachedTikTokLiveStatus(username) {
  const clean = sanitizeTikTokUsername(username);
  const entry = liveStatusCache.get(clean);
  if (!entry) return null;
  return {
    ...entry.data,
    fromCache: true,
    cacheAgeMs: Date.now() - entry.timestamp,
  };
}
