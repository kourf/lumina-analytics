/**
 * TikTok Live Status API Route Handler
 * 
 * Server-side / serverless endpoint handler (compatible with Express, Cloudflare Workers,
 * Vercel Serverless, and Firebase Functions) for robust TikTok live status detection.
 * 
 * Protects client keys, enforces CORS, sanitizes parameters, validates status === 2,
 * and sets appropriate Cache-Control headers with SWR support.
 */

import { 
  sanitizeTikTokUsername, 
  validateTrueLiveCondition, 
  LIVE_STATUS 
} from './tiktokLiveService.js';

const TIKTOK_WEBCAST_BASE = 'https://webcast.tiktok.com/webcast/room/info/';
const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1';

/**
 * Validates and retrieves live status for a TikTok username directly from TikTok Webcast.
 * 
 * @param {string} rawUsername 
 * @returns {Promise<object>} Status response
 */
export async function handleTikTokLiveCheck(rawUsername) {
  const username = sanitizeTikTokUsername(rawUsername);

  if (!username) {
    return {
      status: LIVE_STATUS.OFFLINE,
      isLive: false,
      error: 'Parameter "username" is required and must be valid.',
    };
  }

  try {
    // 1. Fetch user profile HTML to extract current active room_id
    const profileUrl = `https://www.tiktok.com/@${encodeURIComponent(username)}`;
    const profileRes = await fetch(profileUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!profileRes.ok) {
      if (profileRes.status === 404) {
        return {
          status: LIVE_STATUS.OFFLINE,
          isLive: false,
          username,
          error: 'User not found.',
        };
      }

      if (profileRes.status === 429 || profileRes.status === 403) {
        return {
          status: LIVE_STATUS.STATUS_UNKNOWN,
          isLive: false, // NEVER assume LIVE on 429/403
          username,
          error: `TikTok anti-bot or rate limit triggered (HTTP ${profileRes.status}).`,
        };
      }

      return {
        status: LIVE_STATUS.STATUS_UNKNOWN,
        isLive: false,
        username,
        error: `TikTok profile fetch returned HTTP ${profileRes.status}`,
      };
    }

    const html = await profileRes.text();
    const dataMarker = '__UNIVERSAL_DATA_FOR_REHYDRATION__';
    const markerIndex = html.indexOf(dataMarker);

    let roomId = null;
    let displayName = username;
    let avatarUrl = null;

    if (markerIndex !== -1) {
      const tagClose = html.indexOf('>', markerIndex);
      const scriptEnd = html.indexOf('</script>', tagClose);
      if (tagClose !== -1 && scriptEnd !== -1) {
        try {
          const jsonContent = html.substring(tagClose + 1, scriptEnd);
          const parsed = JSON.parse(jsonContent);
          const userScope = parsed.__DEFAULT_SCOPE__?.['webapp.user-detail'];
          const userObj = userScope?.userInfo?.user;

          if (userObj) {
            roomId = userObj.roomId || null;
            displayName = userObj.nickname || username;
            avatarUrl = userObj.avatarLarger || userObj.avatarThumb || null;
          }
        } catch (jsonErr) {
          console.warn('[API Handler] JSON parse warning:', jsonErr.message);
        }
      }
    }

    // If no active room_id found in profile, the user is confirmed offline
    if (!roomId || String(roomId) === '0') {
      return {
        status: LIVE_STATUS.OFFLINE,
        isLive: false,
        username,
        displayName,
        avatarUrl,
        roomId: null,
        viewerCount: 0,
        title: '',
        startedAt: null,
        lastChecked: new Date().toISOString(),
      };
    }

    // 2. Room ID detected: Verify true live status with TikTok Webcast room API
    const webcastUrl = `${TIKTOK_WEBCAST_BASE}?aid=1988&room_id=${encodeURIComponent(roomId)}`;
    const webcastRes = await fetch(webcastUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Referer': `https://www.tiktok.com/@${encodeURIComponent(username)}/live`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!webcastRes.ok) {
      // If webcast check fails, default to STATUS_UNKNOWN, never assume LIVE
      return {
        status: LIVE_STATUS.STATUS_UNKNOWN,
        isLive: false,
        username,
        displayName,
        roomId,
        error: `Webcast room API returned HTTP ${webcastRes.status}`,
      };
    }

    const webcastData = await webcastRes.json();
    const room = webcastData.data;

    // Strict validation: status code must equal 2 (Active Live Broadcast)
    const isLive = validateTrueLiveCondition(room);

    if (isLive) {
      return {
        status: LIVE_STATUS.LIVE,
        isLive: true,
        username,
        displayName: room.owner?.nickname || displayName,
        avatarUrl: room.owner?.avatar_thumb?.url_list?.[0] || avatarUrl,
        roomId: String(roomId),
        viewerCount: Math.max(0, Number(room.user_count || room.viewer_count || 0)),
        title: room.title || 'Live TikTok en direct',
        startedAt: room.create_time ? new Date(room.create_time * 1000).toISOString() : new Date().toISOString(),
        lastChecked: new Date().toISOString(),
      };
    }

    // Room exists but stream is ended or inactive (status !== 2)
    return {
      status: LIVE_STATUS.OFFLINE,
      isLive: false,
      username,
      displayName,
      avatarUrl,
      roomId: null,
      viewerCount: 0,
      title: '',
      startedAt: null,
      lastChecked: new Date().toISOString(),
    };

  } catch (err) {
    console.error('[API Handler] Error verifying live status for', rawUsername, ':', err.message);
    return {
      status: LIVE_STATUS.STATUS_UNKNOWN,
      isLive: false, // NEVER assume LIVE on exception
      username: sanitizeTikTokUsername(rawUsername),
      error: err.name === 'TimeoutError' ? 'Verification request timed out.' : err.message,
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Express / Node.js middleware handler
 * Example: app.get('/api/tiktok-live', expressTikTokLiveHandler);
 */
export async function expressTikTokLiveHandler(req, res) {
  const rawUsername = req.query.username || req.body?.username;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const result = await handleTikTokLiveCheck(rawUsername);
  return res.status(200).json(result);
}
