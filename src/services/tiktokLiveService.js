/**
 * Service de détection temps réel d'un Live TikTok en cours.
 * Architecture SI Urbanisée (0€, 0 Quota API payant) :
 * - Niveau 1 : Passerelle Temps Réel Firebase Cloud Function (`getTikTokLiveStatus` : API Webcast + Protobuf)
 * - Niveau 2 : API officielle TikTok `/api-live/user/room/` & SIGI_STATE via proxies CORS résilients
 * - Protection anti-écrasement : en cas d'erreur réseau transitoire, `preserveExisting: true`
 *   empêche d'écraser un état LIVE actif dans Firestore.
 */

const FIREBASE_LIVE_GATEWAY = 'https://us-central1-lumina-analytics-kd-2026.cloudfunctions.net/getTikTokLiveStatus';

const CORS_PROXIES = [
  (targetUrl) => `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
  (targetUrl) => `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
  (targetUrl) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
];

const fetchWithTimeout = async (url, options = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

const FIRESTORE_REST_ENDPOINT = 'https://firestore.googleapis.com/v1/projects/lumina-analytics-kd-2026/databases/(default)/documents/users/karamokho?key=AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';

export const checkTikTokLiveStatus = async (username = 'karam.drame') => {
  const cleanUsername = username.replace(/^@/, '').trim();
  const checkedAt = new Date().toISOString();

  // --- NIVEAU 1 : Passerelle Temps Réel Firestore REST (CORS *, 0€, latence < 80ms) ---
  try {
    const res = await fetchWithTimeout(FIRESTORE_REST_ENDPOINT, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    }, 6000);

    if (res.ok) {
      const json = await res.json();
      const fields = json?.fields?.tiktokLiveAPI?.mapValue?.fields;
      if (fields) {
        const isLive = Boolean(fields.isLive?.booleanValue);
        const roomId = isLive ? (fields.roomId?.stringValue || null) : null;
        const currentViewers = isLive ? parseInt(fields.currentViewers?.integerValue || fields.viewerCount?.integerValue || '0') : 0;
        const peakViewers = isLive ? parseInt(fields.peakViewers?.integerValue || '0') : 0;
        const totalUser = isLive ? parseInt(fields.totalUser?.integerValue || fields.total_user?.integerValue || fields.cumulative_audience?.integerValue || '0') : 0;
        const likes = isLive ? parseInt(fields.likes?.integerValue || fields.totalLikes?.integerValue || '0') : 0;
        const shares = isLive ? parseInt(fields.shares?.integerValue || fields.totalShares?.integerValue || '0') : 0;
        const comments = isLive ? parseInt(fields.comments?.integerValue || fields.totalComments?.integerValue || '0') : 0;
        const followers = isLive ? parseInt(fields.followers?.integerValue || fields.newFollowers?.integerValue || '0') : 0;
        const startedAt = isLive ? (fields.started_at?.stringValue || fields.startedAt?.stringValue || null) : null;

        return {
          isLive,
          status: isLive ? 'LIVE' : 'OFFLINE',
          roomId,
          title: fields.title?.stringValue || 'TikTok Live en cours',
          viewers: currentViewers,
          currentViewers,
          peakViewers: Math.max(peakViewers, currentViewers),
          totalUser: Math.max(totalUser, currentViewers),
          likes,
          shares,
          comments,
          followers,
          startedAt,
          checkedAt,
          source: 'firestore-live-sync'
        };
      }
    }
  } catch (err) {
    console.debug('[TikTokLiveService] Niveau 1 (Firestore Live Sync) note:', err.message);
  }

  // --- NIVEAU 2A : Interrogation JSON directe de l'API officielle /api-live/user/room/ via proxy CORS ---
  const apiLiveUrl = `https://www.tiktok.com/api-live/user/room/?aid=1988&uniqueId=${encodeURIComponent(cleanUsername)}&sourceType=54`;
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxiedApiUrl = CORS_PROXIES[i](apiLiveUrl);
      const res = await fetchWithTimeout(proxiedApiUrl, { cache: 'no-store' }, 6500);
      if (!res.ok) continue;

      const apiJson = await res.json();
      const liveRoom = apiJson?.data?.liveRoom;
      const userObj = apiJson?.data?.user;
      if (liveRoom || userObj) {
        const status = Number(liveRoom?.status ?? userObj?.status ?? 0);
        const roomId = String(userObj?.roomId || liveRoom?.roomId || '');
        const isLive = status === 2 && Boolean(roomId && roomId !== '0');
        const startTimeSec = Number(liveRoom?.startTime || 0);
        const startedAt = (isLive && startTimeSec > 1e9) ? new Date(startTimeSec * 1000).toISOString() : null;
        return {
          isLive,
          status: isLive ? 'LIVE' : 'OFFLINE',
          roomId: isLive ? roomId : null,
          title: isLive ? (liveRoom?.title || 'TikTok Live en cours') : '',
          viewers: isLive ? Number(liveRoom?.liveRoomStats?.userCount || 0) : 0,
          totalUser: isLive ? Number(liveRoom?.liveRoomStats?.enterCount || 0) : 0,
          startedAt,
          checkedAt,
          source: `tiktok-api-live-proxy-${i + 1}`
        };
      }
    } catch (err) {
      console.debug(`[TikTokLiveService] Proxy API-Live ${i + 1} échoué:`, err.message);
    }
  }

  // --- NIVEAU 2B : Scraping de la page /live via proxies CORS ---
  const livePageUrl = `https://www.tiktok.com/@${cleanUsername}/live`;

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxiedUrl = CORS_PROXIES[i](livePageUrl);
      const res = await fetchWithTimeout(proxiedUrl, { cache: 'no-store' }, 8000);
      if (!res.ok) continue;

      const html = await res.text();
      if (!html || html.length < 500) continue;

      const sigiResult = parseTikTokLiveHtml(html);
      if (sigiResult) {
        return {
          ...sigiResult,
          checkedAt,
          source: `sigi-proxy-${i + 1}`
        };
      }
    } catch (err) {
      console.debug(`[TikTokLiveService] Proxy ${i + 1} échoué:`, err.message);
    }
  }

  // Fallback sécurisé : on signale preserveExisting=true pour ne JAMAIS écraser un état LIVE valide en base
  return {
    isLive: false,
    status: 'OFFLINE',
    roomId: null,
    title: '',
    viewers: 0,
    checkedAt,
    source: 'fallback-error',
    preserveExisting: true,
    error: 'Impossible de joindre les passerelles de vérification Live.'
  };
};

/**
 * Analyse le code HTML d'une page TikTok Live pour détecter un flux actif.
 * TikTok injecte l'état dans <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"> ou <script id="SIGI_STATE">.
 */
export const parseTikTokLiveHtml = (html) => {
  try {
    const universalMatch = html.match(
      /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
    );
    if (universalMatch && universalMatch[1]) {
      const json = JSON.parse(universalMatch[1]);
      const defaultScope = json?.__DEFAULT_SCOPE__ || {};
      const liveUser = defaultScope['webapp.user-detail']?.userInfo?.user ||
                       defaultScope['webapp.live-detail']?.liveRoom ||
                       null;

      if (liveUser) {
        const roomId = liveUser.roomId || liveUser.room_id || null;
        const status = liveUser.status ?? liveUser.liveStatus;
        const isLive = Boolean(roomId && roomId !== '0' && (status === 2 || status === undefined));
        return {
          isLive,
          status: isLive ? 'LIVE' : 'OFFLINE',
          roomId: isLive ? String(roomId) : null,
          title: liveUser.title || '',
          viewers: Number(liveUser.user_count || liveUser.viewerCount || 0)
        };
      }
    }

    const sigiMatch = html.match(/<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);
    if (sigiMatch && sigiMatch[1]) {
      const sigi = JSON.parse(sigiMatch[1]);
      const liveRoom = sigi?.LiveRoom?.liveRoomUserInfo?.liveRoom || sigi?.LiveRoom?.liveRoom;
      if (liveRoom) {
        const status = Number(liveRoom.status);
        const roomId = liveRoom.roomId || sigi?.LiveRoom?.liveRoomUserInfo?.user?.roomId || null;
        const isLive = status === 2 && Boolean(roomId && roomId !== '0');
        return {
          isLive,
          status: isLive ? 'LIVE' : 'OFFLINE',
          roomId: isLive ? String(roomId) : null,
          title: liveRoom.title || '',
          viewers: Number(liveRoom.liveRoomStats?.userCount || 0)
        };
      }
    }

    const roomStatusMatch = html.match(/"roomStatus"\s*:\s*(\d+)/) || html.match(/"status"\s*:\s*(\d+).*?"roomId"\s*:\s*"(\d+)"/);
    const roomIdMatch = html.match(/"roomId"\s*:\s*"(\d{10,})"/);

    if (roomIdMatch && roomIdMatch[1]) {
      const extractedRoomId = roomIdMatch[1];
      const isExplicitlyEnded = html.includes('"status":4') || html.includes('"roomStatus":4');
      const isExplicitlyLive = html.includes('"status":2') || html.includes('"roomStatus":2');

      if (isExplicitlyLive && !isExplicitlyEnded) {
        const viewerMatch = html.match(/"userCount"\s*:\s*(\d+)/);
        const titleMatch = html.match(/"title"\s*:\s*"([^"]{1,120})"/);
        return {
          isLive: true,
          status: 'LIVE',
          roomId: extractedRoomId,
          title: titleMatch ? titleMatch[1] : 'TikTok Live en cours',
          viewers: viewerMatch ? Number(viewerMatch[1]) : 0
        };
      }
    }

    if (html.includes('SIGI_STATE') || html.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
      return {
        isLive: false,
        status: 'OFFLINE',
        roomId: null,
        title: '',
        viewers: 0
      };
    }

    return null;
  } catch (e) {
    return null;
  }
};

export const validateTrueLiveCondition = (liveData) => {
  if (!liveData || liveData.isLive !== true) return false;
  return Boolean(
    liveData.status === 'LIVE' ||
    liveData.status === 2 ||
    (liveData.roomId && String(liveData.roomId) !== '0' && String(liveData.roomId) !== 'unknown') ||
    Number(liveData.currentViewers || liveData.viewers || 0) > 0
  );
};
