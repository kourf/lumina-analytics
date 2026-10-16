import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { checkTikTokLiveStatus } from './tiktokLiveService.js';

/**
 * Configuration officielle des 3 comptes créateur surveillés et du canal Discord cible.
 */
export const CREATOR_LIVE_ACCOUNTS = {
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@karam.drame',
    username: 'karam.drame',
    profileUrl: 'https://www.tiktok.com/@karam.drame',
    liveUrl: 'https://www.tiktok.com/@karam.drame/live',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png',
    brandColor: '#FE2C55',
    accentColor: '#25F4EE',
    buttonLabel: '🔴 CLIQUER ICI : REJOINDRE LE LIVE TIKTOK ↗',
    emoji: '🎵'
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    handle: '@karamdrm',
    channelId: 'UC_V-hdqGtizf9g7gxahdmqQ',
    uploadsPlaylistId: 'UU_V-hdqGtizf9g7gxahdmqQ',
    profileUrl: 'https://www.youtube.com/@karamdrm',
    liveUrl: 'https://www.youtube.com/@karamdrm/live',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
    brandColor: '#FF0000',
    accentColor: '#FF4E45',
    buttonLabel: '🔴 CLIQUER ICI : REJOINDRE LE LIVE YOUTUBE ↗',
    emoji: '▶️'
  },
  twitch: {
    id: 'twitch',
    name: 'Twitch',
    handle: 'karam_drm',
    login: 'karam_drm',
    profileUrl: 'https://www.twitch.tv/karam_drm',
    liveUrl: 'https://www.twitch.tv/karam_drm',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968819.png',
    brandColor: '#9146FF',
    accentColor: '#A970FF',
    buttonLabel: '🟣 CLIQUER ICI : REJOINDRE LE LIVE TWITCH ↗',
    emoji: '🟣'
  }
};

export const DISCORD_ALERT_TARGET = {
  serverName: 'La Forge',
  guildId: '1466513608442777687',
  channelId: '1466524903497797938',
  channelName: '#📢・ᴀɴɴᴏɴᴄᴇꜱ',
  webhookName: 'Karam Live',
  mention: '@here',
  gracePeriodSeconds: 15
};

const YOUTUBE_API_KEY = 'AIzaSyDeCstNIEwTjVr5ltwvpS1TUsQZUt654qk';
const TWITCH_PUBLIC_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const DEFAULT_DISCORD_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1540098204714930319/w71fW-1Am_A4LVtIFg-2-b8s9J5Vryi32q_0LwTB76kX_j-yRQMhFMVRYt8wpiPqwPa9';

// Cache mémoire 60s pour préserver 99% du quota YouTube Data API v3 côté navigateur
let youtubeLiveCache = {
  timestamp: 0,
  data: null
};

// Formateur de durée secondes -> "04h 45m"
export function formatDurationSeconds(totalSeconds = 0) {
  const sec = Math.max(0, Number(totalSeconds || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  }
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

/**
 * 1. Détection temps réel Twitch (`karam_drm`) + Extraction complète du Catalogue VOD via GraphQL public (0€, 0 quota, CORS *).
 */
export async function checkTwitchLiveStatus(login = CREATOR_LIVE_ACCOUNTS.twitch.login) {
  const checkedAt = new Date().toISOString();
  try {
    const query = `{
      user(login: "${login}") {
        id
        login
        displayName
        description
        createdAt
        profileImageURL(width: 300)
        bannerImageURL
        offlineImageURL
        followers { totalCount }
        lastBroadcast {
          id
          title
          startedAt
          game { id name displayName }
        }
        stream {
          id
          title
          type
          viewersCount
          createdAt
          previewImageURL(width: 640, height: 360)
          game {
            id
            name
            displayName
            boxArtURL(width: 285, height: 380)
          }
        }
        videos(first: 20) {
          totalCount
          edges {
            node {
              id
              title
              viewCount
              lengthSeconds
              publishedAt
              createdAt
              broadcastType
              previewThumbnailURL(width: 640, height: 360)
              game { name displayName }
            }
          }
        }
        clips(first: 10) {
          edges {
            node {
              id
              slug
              title
              viewCount
              durationSeconds
              createdAt
              thumbnailURL
              url
            }
          }
        }
      }
    }`;

    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-ID': TWITCH_PUBLIC_CLIENT_ID,
        'Content-Type': 'text/plain;charset=UTF-8'
      },
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      throw new Error(`Twitch GQL HTTP ${res.status}`);
    }

    const json = await res.json();
    const user = json?.data?.user;
    const stream = user?.stream;
    const isLive = Boolean(stream && stream.type === 'live');

    const rawVods = (user?.videos?.edges || [])
      .map((edge) => edge?.node)
      .filter(Boolean)
      .map((node) => ({
        id: String(node.id),
        title: node.title || 'Live Coding & Création Webflow',
        views: Number(node.viewCount || 0),
        lengthSeconds: Number(node.lengthSeconds || 0),
        durationFormatted: formatDurationSeconds(node.lengthSeconds || 0),
        publishedAt: node.publishedAt || node.createdAt || null,
        broadcastType: node.broadcastType || 'ARCHIVE',
        thumbnailUrl:
          node.previewThumbnailURL && !node.previewThumbnailURL.includes('404_processing')
            ? node.previewThumbnailURL
            : stream?.previewImageURL || user?.profileImageURL || '',
        game: node.game?.displayName || node.game?.name || 'Just Chatting',
        url: `https://www.twitch.tv/videos/${node.id}`
      }));

    const rawClips = (user?.clips?.edges || [])
      .map((edge) => edge?.node)
      .filter(Boolean)
      .map((node) => ({
        id: String(node.id),
        slug: node.slug,
        title: node.title || 'Clip Twitch',
        views: Number(node.viewCount || 0),
        durationSeconds: Number(node.durationSeconds || 0),
        createdAt: node.createdAt || null,
        thumbnailUrl: node.thumbnailURL || '',
        url: node.url || `https://clips.twitch.tv/${node.slug}`
      }));

    const totalVodViews = rawVods.reduce((acc, v) => acc + v.views, 0);
    const totalLengthSeconds = rawVods.reduce((acc, v) => acc + v.lengthSeconds, 0);
    const totalStreamedHours = Number((totalLengthSeconds / 3600).toFixed(1));
    const avgStreamDurationMinutes =
      rawVods.length > 0 ? Math.round(totalLengthSeconds / rawVods.length / 60) : 0;

    return {
      platform: 'twitch',
      isLive,
      status: isLive ? 'LIVE' : 'OFFLINE',
      userId: user?.id || '740554414',
      displayName: user?.displayName || login,
      description: user?.description || 'Le créatif préféré derrière ton outil préféré.',
      accountCreatedAt: user?.createdAt || '2021-11-06T17:12:52Z',
      streamId: isLive ? String(stream.id) : null,
      title: isLive ? (stream.title || 'Live Twitch en cours') : (user?.lastBroadcast?.title || ''),
      viewers: isLive ? Number(stream.viewersCount || 0) : 0,
      game: isLive
        ? (stream.game?.displayName || stream.game?.name || 'Just Chatting')
        : (user?.lastBroadcast?.game?.displayName || 'Just Chatting'),
      gameBoxArtUrl: stream?.game?.boxArtURL || 'https://static-cdn.jtvnw.net/ttv-boxart/509658-285x380.jpg',
      previewImageUrl: stream?.previewImageURL || rawVods[0]?.thumbnailUrl || '',
      followers: Number(user?.followers?.totalCount || 0),
      avatarUrl: user?.profileImageURL || '',
      bannerUrl: user?.bannerImageURL || '',
      startedAt: isLive ? (stream.createdAt || null) : null,
      lastBroadcastAt: user?.lastBroadcast?.startedAt || null,
      totalVideosCount: Number(user?.videos?.totalCount || rawVods.length || 0),
      totalVodViews,
      totalStreamedHours,
      totalLengthSeconds,
      avgStreamDurationMinutes,
      vods: rawVods,
      clips: rawClips,
      latestVodUrl: rawVods[0]?.url || `${CREATOR_LIVE_ACCOUNTS.twitch.profileUrl}/videos`,
      liveUrl: CREATOR_LIVE_ACCOUNTS.twitch.liveUrl,
      profileUrl: CREATOR_LIVE_ACCOUNTS.twitch.profileUrl,
      handle: CREATOR_LIVE_ACCOUNTS.twitch.handle,
      checkedAt,
      source: 'twitch-gql-0quota'
    };
  } catch (err) {
    return {
      platform: 'twitch',
      isLive: false,
      status: 'OFFLINE',
      streamId: null,
      title: '',
      viewers: 0,
      game: 'Just Chatting',
      followers: 0,
      startedAt: null,
      vods: [],
      clips: [],
      liveUrl: CREATOR_LIVE_ACCOUNTS.twitch.liveUrl,
      profileUrl: CREATOR_LIVE_ACCOUNTS.twitch.profileUrl,
      handle: CREATOR_LIVE_ACCOUNTS.twitch.handle,
      checkedAt,
      source: 'twitch-fallback',
      preserveExisting: true,
      error: err.message
    };
  }
}

/**
 * 2. Détection temps réel YouTube (`@karamdrm`) économe en quota :
 * - Utilise playlistItems (1 unité) + videos.list (1 unité) = 2 unités (au lieu de 100 unités pour search.list !)
 * - Mis en cache pendant 60 secondes pour éviter tout dépassement de quota.
 */
export async function checkYouTubeLiveStatus({ force = false } = {}) {
  const now = Date.now();
  if (!force && youtubeLiveCache.data && now - youtubeLiveCache.timestamp < 60000) {
    return youtubeLiveCache.data;
  }

  const checkedAt = new Date().toISOString();
  const playlistId = CREATOR_LIVE_ACCOUNTS.youtube.uploadsPlaylistId;

  try {
    const plRes = await fetch(
      `https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=3&key=${YOUTUBE_API_KEY}`
    );
    if (!plRes.ok) {
      throw new Error(`YouTube playlistItems HTTP ${plRes.status}`);
    }
    const plJson = await plRes.json();
    const videoIds = (plJson.items || [])
      .map((item) => item.contentDetails?.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) {
      const emptyResult = {
        platform: 'youtube',
        isLive: false,
        status: 'OFFLINE',
        videoId: null,
        title: '',
        viewers: 0,
        startedAt: null,
        liveUrl: CREATOR_LIVE_ACCOUNTS.youtube.liveUrl,
        profileUrl: CREATOR_LIVE_ACCOUNTS.youtube.profileUrl,
        handle: CREATOR_LIVE_ACCOUNTS.youtube.handle,
        checkedAt,
        source: 'youtube-playlist-2units'
      };
      youtubeLiveCache = { timestamp: now, data: emptyResult };
      return emptyResult;
    }

    const vRes = await fetch(
      `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`
    );
    if (!vRes.ok) {
      throw new Error(`YouTube videos.list HTTP ${vRes.status}`);
    }
    const vJson = await vRes.json();
    const liveVideo = (vJson.items || []).find(
      (v) =>
        v.snippet?.liveBroadcastContent === 'live' ||
        (v.liveStreamingDetails?.actualStartTime && !v.liveStreamingDetails?.actualEndTime)
    );

    const latestReplayVideo = (vJson.items || [])[0] || null;
    const isLive = Boolean(liveVideo);
    const videoId = isLive ? liveVideo.id : null;
    const viewers = isLive
      ? Number(
          liveVideo.liveStreamingDetails?.concurrentViewers ||
            liveVideo.statistics?.viewCount ||
            0
        )
      : 0;

    const result = {
      platform: 'youtube',
      isLive,
      status: isLive ? 'LIVE' : 'OFFLINE',
      videoId,
      latestVideoId: latestReplayVideo?.id || null,
      replayUrl: latestReplayVideo?.id
        ? `https://www.youtube.com/watch?v=${latestReplayVideo.id}`
        : `${CREATOR_LIVE_ACCOUNTS.youtube.profileUrl}/streams`,
      title: isLive ? (liveVideo.snippet?.title || 'Live YouTube en cours') : '',
      viewers,
      startedAt: isLive ? (liveVideo.liveStreamingDetails?.actualStartTime || null) : null,
      liveUrl: videoId
        ? `https://www.youtube.com/watch?v=${videoId}`
        : CREATOR_LIVE_ACCOUNTS.youtube.liveUrl,
      canonicalLiveUrl: CREATOR_LIVE_ACCOUNTS.youtube.liveUrl,
      profileUrl: CREATOR_LIVE_ACCOUNTS.youtube.profileUrl,
      handle: CREATOR_LIVE_ACCOUNTS.youtube.handle,
      checkedAt,
      source: 'youtube-playlist-2units'
    };

    youtubeLiveCache = { timestamp: now, data: result };
    return result;
  } catch (err) {
    return {
      platform: 'youtube',
      isLive: false,
      status: 'OFFLINE',
      videoId: null,
      title: '',
      viewers: 0,
      startedAt: null,
      liveUrl: CREATOR_LIVE_ACCOUNTS.youtube.liveUrl,
      replayUrl: `${CREATOR_LIVE_ACCOUNTS.youtube.profileUrl}/streams`,
      canonicalLiveUrl: CREATOR_LIVE_ACCOUNTS.youtube.liveUrl,
      profileUrl: CREATOR_LIVE_ACCOUNTS.youtube.profileUrl,
      handle: CREATOR_LIVE_ACCOUNTS.youtube.handle,
      checkedAt,
      source: 'youtube-fallback',
      preserveExisting: true,
      error: err.message
    };
  }
}

/**
 * 3. Vérification unifiée des 3 plateformes (TikTok, YouTube, Twitch) en parallèle.
 * Met également à jour Firestore (`users/karamokho`) et déclenche automatiquement la mise à jour
 * "⚪ LIVE TERMINÉ" sur Discord lorsque tous les lives se terminent (Recommandation 1).
 */
export async function checkMultiPlatformLiveStatus({
  forceRefresh = false,
  syncFirestore = true
} = {}) {
  const [tiktokSettled, youtubeSettled, twitchSettled] = await Promise.allSettled([
    checkTikTokLiveStatus(CREATOR_LIVE_ACCOUNTS.tiktok.username),
    checkYouTubeLiveStatus({ force: forceRefresh }),
    checkTwitchLiveStatus(CREATOR_LIVE_ACCOUNTS.twitch.login)
  ]);

  const tiktok =
    tiktokSettled.status === 'fulfilled'
      ? {
          ...tiktokSettled.value,
          platform: 'tiktok',
          liveUrl: CREATOR_LIVE_ACCOUNTS.tiktok.liveUrl,
          profileUrl: CREATOR_LIVE_ACCOUNTS.tiktok.profileUrl,
          handle: CREATOR_LIVE_ACCOUNTS.tiktok.handle
        }
      : {
          platform: 'tiktok',
          isLive: false,
          status: 'OFFLINE',
          roomId: null,
          title: '',
          viewers: 0,
          liveUrl: CREATOR_LIVE_ACCOUNTS.tiktok.liveUrl,
          profileUrl: CREATOR_LIVE_ACCOUNTS.tiktok.profileUrl,
          handle: CREATOR_LIVE_ACCOUNTS.tiktok.handle,
          preserveExisting: true
        };

  const youtube =
    youtubeSettled.status === 'fulfilled'
      ? youtubeSettled.value
      : {
          platform: 'youtube',
          isLive: false,
          status: 'OFFLINE',
          videoId: null,
          title: '',
          viewers: 0,
          liveUrl: CREATOR_LIVE_ACCOUNTS.youtube.liveUrl,
          replayUrl: `${CREATOR_LIVE_ACCOUNTS.youtube.profileUrl}/streams`,
          profileUrl: CREATOR_LIVE_ACCOUNTS.youtube.profileUrl,
          handle: CREATOR_LIVE_ACCOUNTS.youtube.handle,
          preserveExisting: true
        };

  const twitch =
    twitchSettled.status === 'fulfilled'
      ? twitchSettled.value
      : {
          platform: 'twitch',
          isLive: false,
          status: 'OFFLINE',
          streamId: null,
          title: '',
          viewers: 0,
          vods: [],
          clips: [],
          liveUrl: CREATOR_LIVE_ACCOUNTS.twitch.liveUrl,
          profileUrl: CREATOR_LIVE_ACCOUNTS.twitch.profileUrl,
          handle: CREATOR_LIVE_ACCOUNTS.twitch.handle,
          preserveExisting: true
        };

  const anyLive = Boolean(tiktok.isLive || youtube.isLive || twitch.isLive);
  const activePlatforms = [
    tiktok.isLive ? 'TikTok' : null,
    youtube.isLive ? 'YouTube' : null,
    twitch.isLive ? 'Twitch' : null
  ].filter(Boolean);

  const unifiedTitle =
    tiktok.title && tiktok.title !== 'TikTok Live en cours'
      ? tiktok.title
      : twitch.title || youtube.title || tiktok.title || 'Live Multi-Stream avec la communauté !';

  const sessionKey = [
    tiktok.isLive && tiktok.roomId ? `tt:${tiktok.roomId}` : null,
    youtube.isLive && youtube.videoId ? `yt:${youtube.videoId}` : null,
    twitch.isLive && twitch.streamId ? `tw:${twitch.streamId}` : null
  ]
    .filter(Boolean)
    .join('|');

  const summary = {
    anyLive,
    activePlatforms,
    unifiedTitle,
    sessionKey: sessionKey || null,
    totalConcurrentViewers:
      Number(tiktok.viewers || 0) + Number(youtube.viewers || 0) + Number(twitch.viewers || 0),
    tiktok,
    youtube,
    twitch,
    checkedAt: new Date().toISOString()
  };

  if (syncFirestore) {
    try {
      const docRef = doc(db, 'users', 'karamokho');
      const snap = await getDoc(docRef);
      const existing = snap.exists() ? snap.data() : {};
      const existingTt = existing.tiktokLiveAPI || {};
      const existingYt = existing.youtubeLiveAPI || {};
      const existingTw = existing.twitchLiveAPI || {};

      const updates = {};

      if (!tiktok.preserveExisting) {
        const ttNowLive = Boolean(tiktok.isLive);
        const ttCurrentViewers = ttNowLive ? Number(tiktok.viewers || existingTt.currentViewers || 0) : 0;
        const ttPeakViewers = ttNowLive
          ? Math.max(Number(existingTt.peakViewers || 0), ttCurrentViewers)
          : Number(existingTt.peakViewers || 0);
        const ttTotalUser = ttNowLive
          ? Math.max(
              Number(existingTt.totalUser || existingTt.cumulative_audience || 0),
              Number(tiktok.totalUser || 0),
              ttCurrentViewers
            )
          : Number(existingTt.totalUser || existingTt.cumulative_audience || 0);

        updates.tiktokLiveAPI = {
          ...existingTt,
          isLive: ttNowLive,
          status: ttNowLive ? 'LIVE' : 'OFFLINE',
          roomId: ttNowLive ? (tiktok.roomId || existingTt.roomId || null) : (existingTt.roomId || null),
          title: ttNowLive ? (tiktok.title || existingTt.title || 'TikTok Live en cours') : (existingTt.title || ''),
          currentViewers: ttCurrentViewers,
          peakViewers: ttPeakViewers,
          totalUser: ttTotalUser,
          cumulative_audience: ttTotalUser,
          lastCheckedAt: summary.checkedAt
        };
      }

      if (!youtube.preserveExisting) {
        updates.youtubeLiveAPI = {
          ...existingYt,
          isLive: Boolean(youtube.isLive),
          status: youtube.isLive ? 'LIVE' : 'OFFLINE',
          videoId: youtube.videoId || existingYt.videoId || null,
          latestVideoId: youtube.latestVideoId || existingYt.latestVideoId || null,
          replayUrl: youtube.replayUrl || existingYt.replayUrl || `${CREATOR_LIVE_ACCOUNTS.youtube.profileUrl}/streams`,
          title: youtube.title || existingYt.title || '',
          viewers: Number(youtube.viewers || 0),
          liveUrl: youtube.liveUrl || CREATOR_LIVE_ACCOUNTS.youtube.liveUrl,
          startedAt: youtube.startedAt || existingYt.startedAt || null,
          lastCheckedAt: summary.checkedAt
        };
      }

      if (!twitch.preserveExisting) {
        updates.twitchLiveAPI = {
          ...existingTw,
          isLive: Boolean(twitch.isLive),
          status: twitch.isLive ? 'LIVE' : 'OFFLINE',
          userId: twitch.userId || existingTw.userId || '740554414',
          displayName: twitch.displayName || existingTw.displayName || 'karam_drm',
          description: twitch.description || existingTw.description || 'Le créatif préféré derrière ton outil préféré.',
          accountCreatedAt: twitch.accountCreatedAt || existingTw.accountCreatedAt || '2021-11-06T17:12:52Z',
          streamId: twitch.streamId || existingTw.streamId || null,
          title: twitch.title || existingTw.title || '',
          viewers: Number(twitch.viewers || 0),
          game: twitch.game || existingTw.game || 'Just Chatting',
          gameBoxArtUrl: twitch.gameBoxArtUrl || existingTw.gameBoxArtUrl || '',
          previewImageUrl: twitch.previewImageUrl || existingTw.previewImageUrl || '',
          followers: Number(twitch.followers || existingTw.followers || 0),
          avatarUrl: twitch.avatarUrl || existingTw.avatarUrl || '',
          liveUrl: CREATOR_LIVE_ACCOUNTS.twitch.liveUrl,
          startedAt: twitch.startedAt || existingTw.startedAt || null,
          lastBroadcastAt: twitch.lastBroadcastAt || existingTw.lastBroadcastAt || null,
          totalVideosCount: Number(twitch.totalVideosCount ?? existingTw.totalVideosCount ?? 0),
          totalVodViews: Number(twitch.totalVodViews ?? existingTw.totalVodViews ?? 0),
          totalStreamedHours: Number(twitch.totalStreamedHours ?? existingTw.totalStreamedHours ?? 0),
          avgStreamDurationMinutes: Number(twitch.avgStreamDurationMinutes ?? existingTw.avgStreamDurationMinutes ?? 0),
          latestVodUrl: twitch.latestVodUrl || existingTw.latestVodUrl || `${CREATOR_LIVE_ACCOUNTS.twitch.profileUrl}/videos`,
          vods: Array.isArray(twitch.vods) && twitch.vods.length > 0 ? twitch.vods : (existingTw.vods || []),
          clips: Array.isArray(twitch.clips) && twitch.clips.length > 0 ? twitch.clips : (existingTw.clips || []),
          lastCheckedAt: summary.checkedAt
        };
      }

      if (Object.keys(updates).length > 0) {
        await setDoc(docRef, updates, { merge: true });
      }

      // Recommandation 1 : Si plus aucun live n'est en cours (!anyLive) et qu'un message Discord avait été envoyé,
      // on édite automatiquement ce message Discord pour afficher "⚪ LIVE TERMINÉ • Voir le Replay"
      if (!anyLive && !tiktok.preserveExisting && !youtube.preserveExisting && !twitch.preserveExisting) {
        if (existing.lastDiscordAlertMessageId && existing.lastDiscordAlertEndedEdited !== true) {
          await updateDiscordAlertOnLiveEndIfNeeded(existing, summary);
        }
      }
    } catch (err) {
      console.debug('[MultiLiveAlertService] Sync Firestore ignorée:', err.message);
    }
  }

  return summary;
}

/**
 * 4. Constructeur du Message d'Alerte Discord Unifié EN DIRECT (UN SEUL MESSAGE pour TikTok + YouTube + Twitch)
 * Respecte strictement toutes les exigences :
 * - Mention @here (JAMAIS @everyone)
 * - Logos officiels des applications (TikTok, YouTube, Twitch)
 * - Statut en direct des 3 plateformes dans un seul Embed
 * - 3 Boutons cliquables ultra-explicites (TikTok, YouTube, Twitch) + boutons-liens cliquables intégrés
 */
export function buildUnifiedDiscordAlertPayload(liveSummary = {}, customOptions = {}) {
  const tiktokLive = Boolean(liveSummary?.tiktok?.isLive);
  const youtubeLive = Boolean(liveSummary?.youtube?.isLive);
  const twitchLive = Boolean(liveSummary?.twitch?.isLive);

  const tiktokUrl = CREATOR_LIVE_ACCOUNTS.tiktok.liveUrl;
  const youtubeUrl =
    liveSummary?.youtube?.isLive && liveSummary?.youtube?.videoId
      ? `https://www.youtube.com/watch?v=${liveSummary.youtube.videoId}`
      : CREATOR_LIVE_ACCOUNTS.youtube.liveUrl;
  const twitchUrl = CREATOR_LIVE_ACCOUNTS.twitch.liveUrl;

  const streamTitle =
    customOptions.title ||
    liveSummary?.unifiedTitle ||
    liveSummary?.tiktok?.title ||
    liveSummary?.twitch?.title ||
    liveSummary?.youtube?.title ||
    'Session Live Multi-Stream avec la communauté !';

  const avatarUrl =
    customOptions.avatarUrl ||
    liveSummary?.twitch?.avatarUrl ||
    CREATOR_LIVE_ACCOUNTS.tiktok.logoUrl;

  const activeNames = [
    tiktokLive ? 'TikTok' : null,
    youtubeLive ? 'YouTube' : null,
    twitchLive ? 'Twitch' : null
  ].filter(Boolean);

  const platformsHeader =
    activeNames.length > 0
      ? activeNames.join(' • ')
      : 'TikTok • YouTube • Twitch';

  return {
    username: 'Karam • Alerte Live Multi-Stream',
    avatar_url: avatarUrl,
    content: `🔴 **@here — KARAM EST EN LIVE SUR ${platformsHeader.toUpperCase()} !** 🚀`,
    allowed_mentions: {
      parse: ['everyone'] // Requis par l'API Discord v10 pour activer @here (aucun @everyone n'est présent dans content)
    },
    embeds: [
      {
        author: {
          name: 'Karam • Diffusion Multi-Réseaux (TikTok • YouTube • Twitch)'
        },
        title: `🎥 EN DIRECT : ${streamTitle}`,
        color: 16657493, // #FE2C55
        fields: [
          {
            name: '🎵 TikTok',
            value: `\`${CREATOR_LIVE_ACCOUNTS.tiktok.handle}\`\n🟢 En direct`,
            inline: true
          },
          {
            name: '▶️ YouTube',
            value: `\`${CREATOR_LIVE_ACCOUNTS.youtube.handle}\`\n🟢 En direct`,
            inline: true
          },
          {
            name: '🟣 Twitch',
            value: `\`${CREATOR_LIVE_ACCOUNTS.twitch.handle}\`\n🟢 En direct`,
            inline: true
          }
        ],
        thumbnail: {
          url: avatarUrl
        }
      }
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: CREATOR_LIVE_ACCOUNTS.tiktok.buttonLabel,
            url: tiktokUrl,
            emoji: { name: '🎵' }
          },
          {
            type: 2,
            style: 5,
            label: CREATOR_LIVE_ACCOUNTS.youtube.buttonLabel,
            url: youtubeUrl,
            emoji: { name: '▶️' }
          },
          {
            type: 2,
            style: 5,
            label: CREATOR_LIVE_ACCOUNTS.twitch.buttonLabel,
            url: twitchUrl,
            emoji: { name: '🟣' }
          }
        ]
      }
    ]
  };
}

/**
 * 5. Constructeur du Message Discord "⚪ LIVE TERMINÉ • Voir le Replay" (Recommandation 1).
 * Édite automatiquement le message d'alerte dans #📢・ᴀɴɴᴏɴᴄᴇꜱ lorsque le multistream est terminé.
 */
export function buildEndedDiscordAlertPayload(liveSummary = {}, endedOptions = {}) {
  const streamTitle =
    endedOptions.title ||
    liveSummary?.unifiedTitle ||
    'On crée un site ensemble';

  const youtubeReplayUrl =
    endedOptions.youtubeReplayUrl ||
    liveSummary?.youtube?.replayUrl ||
    liveSummary?.youtube?.liveUrl ||
    `${CREATOR_LIVE_ACCOUNTS.youtube.profileUrl}/streams`;

  const twitchReplayUrl =
    endedOptions.twitchReplayUrl ||
    liveSummary?.twitch?.latestVodUrl ||
    `${CREATOR_LIVE_ACCOUNTS.twitch.profileUrl}/videos`;

  const tiktokProfileUrl = CREATOR_LIVE_ACCOUNTS.tiktok.profileUrl;

  return {
    content: `⚪ **LIVE TERMINÉ — MERCI À TOUS LES PARTICIPANTS !** 🙏`,
    embeds: [
      {
        author: {
          name: 'Karam • Diffusion Multi-Réseaux (TikTok • YouTube • Twitch)'
        },
        title: `⚪ LIVE TERMINÉ : ${streamTitle}`,
        color: 6582667, // #64748B Slate
        fields: [
          {
            name: '🎵 TikTok',
            value: `\`${CREATOR_LIVE_ACCOUNTS.tiktok.handle}\`\n⚪ Hors ligne`,
            inline: true
          },
          {
            name: '▶️ YouTube',
            value: `\`${CREATOR_LIVE_ACCOUNTS.youtube.handle}\`\n🎬 Replay`,
            inline: true
          },
          {
            name: '🟣 Twitch',
            value: `\`${CREATOR_LIVE_ACCOUNTS.twitch.handle}\`\n🎬 VOD`,
            inline: true
          }
        ]
      }
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: '▶️ CLIQUER ICI : VOIR LE REPLAY YOUTUBE ↗',
            url: youtubeReplayUrl,
            emoji: { name: '▶️' }
          },
          {
            type: 2,
            style: 5,
            label: '🟣 CLIQUER ICI : VOIR LE REPLAY TWITCH ↗',
            url: twitchReplayUrl,
            emoji: { name: '🟣' }
          },
          {
            type: 2,
            style: 5,
            label: '🎵 CLIQUER ICI : PROFIL TIKTOK ↗',
            url: tiktokProfileUrl,
            emoji: { name: '🎵' }
          }
        ]
      }
    ]
  };
}

/**
 * 6. Envoi sécurisé de l'alerte Discord avec fallback intelligent + capture du `messageId` (Recommandations 1 & 4).
 */
export async function sendUnifiedDiscordAlert(
  webhookUrl,
  liveSummary,
  { dryRun = true, customTitle = '' } = {}
) {
  const payload = buildUnifiedDiscordAlertPayload(liveSummary, { title: customTitle });

  if (dryRun || !webhookUrl) {
    return {
      ok: true,
      dryRun: true,
      sent: false,
      messageId: null,
      payload
    };
  }

  // Tentative 1 : Envoi avec les 3 boutons natifs (`components` pour Webhook rattaché à FireBOT)
  const separator = webhookUrl.includes('?') ? '&' : '?';
  const urlWithComponents = `${webhookUrl}${separator}wait=true&with_components=true`;

  const firstRes = await fetch(urlWithComponents, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (firstRes.ok) {
    let msgJson = null;
    try {
      msgJson = await firstRes.json();
    } catch (_) {}
    return {
      ok: true,
      dryRun: false,
      sent: true,
      messageId: msgJson?.id || null,
      mode: 'native-components',
      payload
    };
  }

  // Tentative 2 (Fallback automatique < 100ms) : Webhook standard (application_id: null)
  const { components, ...fallbackPayload } = payload;
  const fallbackRes = await fetch(`${webhookUrl}${separator}wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fallbackPayload)
  });

  let fallbackJson = null;
  if (fallbackRes.ok) {
    try {
      fallbackJson = await fallbackRes.json();
    } catch (_) {}
  }

  return {
    ok: fallbackRes.ok,
    dryRun: false,
    sent: fallbackRes.ok,
    messageId: fallbackJson?.id || null,
    mode: 'embed-links-fallback',
    status: fallbackRes.status,
    payload: fallbackPayload
  };
}

/**
 * 7. Mise à jour automatique ("⚪ LIVE TERMINÉ • Voir le Replay") du message Discord existant (Recommandation 1).
 */
export async function updateDiscordAlertOnLiveEndIfNeeded(userData, liveSummary = {}) {
  try {
    const messageId = userData?.lastDiscordAlertMessageId;
    const webhookUrl =
      userData?.lastDiscordAlertWebhookUrl ||
      userData?.discordBotWebhookUrl ||
      userData?.discordWebhookUrl ||
      DEFAULT_DISCORD_WEBHOOK_URL;

    if (!messageId || !webhookUrl || userData?.lastDiscordAlertEndedEdited === true) {
      return { updated: false, reason: 'no-active-message-to-edit' };
    }

    const baseWebhookUrl = webhookUrl.split('?')[0];
    const endedPayload = buildEndedDiscordAlertPayload(liveSummary, {
      title: userData?.lastDiscordAlertTitle || liveSummary?.unifiedTitle,
      youtubeReplayUrl: userData?.lastDiscordAlertYoutubeUrl || liveSummary?.youtube?.replayUrl,
      twitchReplayUrl: userData?.lastDiscordAlertTwitchVodUrl || liveSummary?.twitch?.latestVodUrl
    });

    // Tentative 1 avec components
    let patchRes = await fetch(`${baseWebhookUrl}/messages/${messageId}?with_components=true`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(endedPayload)
    });

    if (!patchRes.ok) {
      const { components, ...fallbackEndedPayload } = endedPayload;
      patchRes = await fetch(`${baseWebhookUrl}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackEndedPayload)
      });
    }

    if (patchRes.ok) {
      const docRef = doc(db, 'users', 'karamokho');
      await setDoc(
        docRef,
        {
          lastDiscordAlertEndedEdited: true,
          lastDiscordAlertEndedAt: new Date().toISOString()
        },
        { merge: true }
      );
      return { updated: true, messageId };
    }

    return { updated: false, status: patchRes.status };
  } catch (err) {
    console.warn('[MultiLiveAlertService] Erreur updateDiscordAlertOnLiveEndIfNeeded:', err.message);
    return { updated: false, error: err.message };
  }
}

/**
 * 8. Fenêtre d'Agrégation Intelligente Multi-Stream (Grace Period de 15s-45s — Recommandation 2).
 * Si OBS/Restream vient tout juste de lancer le flux (< 45s) et que moins de 3 plateformes sont détectées,
 * attend brièvement et revérifie pour agréger les titres et compteurs des 3 plateformes dans l'unique message @here.
 */
export async function aggregateMultiStreamWithGracePeriod(initialSummary, { skipWait = false } = {}) {
  if (!initialSummary || !initialSummary.anyLive) return initialSummary;

  const activeCount = (initialSummary.activePlatforms || []).length;
  if (activeCount >= 3 || skipWait) {
    return initialSummary;
  }

  // Vérifier si le démarrage du stream est très récent (< 45 secondes)
  const startedTimestamps = [
    initialSummary?.tiktok?.startedAt,
    initialSummary?.youtube?.startedAt,
    initialSummary?.twitch?.startedAt
  ]
    .filter(Boolean)
    .map((ts) => new Date(ts).getTime())
    .filter((ms) => !Number.isNaN(ms));

  const now = Date.now();
  const isVeryRecentStart =
    startedTimestamps.length === 0 ||
    startedTimestamps.some((ms) => now - ms < 45000);

  if (isVeryRecentStart) {
    await new Promise((resolve) => setTimeout(resolve, 6000));
    const refreshed = await checkMultiPlatformLiveStatus({
      forceRefresh: true,
      syncFirestore: true
    });
    if (refreshed?.anyLive) {
      return refreshed;
    }
  }

  return initialSummary;
}

/**
 * 9. Inspection des capacités du Webhook Discord (Recommandation 4 : Détection FireBOT Application Webhook vs Standard).
 */
export async function checkDiscordWebhookCapabilities(webhookUrl = DEFAULT_DISCORD_WEBHOOK_URL) {
  try {
    const cleanUrl = (webhookUrl || DEFAULT_DISCORD_WEBHOOK_URL).split('?')[0];
    const res = await fetch(cleanUrl);
    if (!res.ok) {
      return { ok: false, isBotWebhook: false };
    }
    const info = await res.json();
    return {
      ok: true,
      id: info.id,
      name: info.name,
      channelId: info.channel_id,
      guildId: info.guild_id,
      applicationId: info.application_id || null,
      isBotWebhook: Boolean(info.application_id),
      modeLabel: info.application_id
        ? 'FireBOT Application Webhook (Boutons Gris Natifs + Boutons Embed Actifs)'
        : 'Webhook Salon + Double Envoi Intelligent (3 Boutons Explicites Actifs)'
    };
  } catch (err) {
    return { ok: false, isBotWebhook: false, error: err.message };
  }
}

/**
 * 10. Déclencheur automatique unifié avec verrou de déduplication Firestore + Fenêtre d'Agrégation + Suivi Message ID.
 * Ne publie JAMAIS si `autoBroadcastEnabled !== true`.
 */
export async function dispatchDiscordAlertIfNeeded(liveSummary, { immediate = false } = {}) {
  if (!liveSummary || !liveSummary.anyLive) {
    return { dispatched: false, sent: false, reason: 'not-live' };
  }

  try {
    const docRef = doc(db, 'users', 'karamokho');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { dispatched: false, sent: false, reason: 'no-user-doc' };
    }

    const userData = snap.data();
    const isEnabled =
      userData.autoBroadcastEnabled === true ||
      userData?.tiktokLiveAPI?.autoBroadcastEnabled === true;

    if (!isEnabled) {
      return { dispatched: false, sent: false, reason: 'broadcast-disabled' };
    }

    const roomOrSessionId = String(
      liveSummary?.tiktok?.roomId ||
        liveSummary?.sessionKey ||
        liveSummary?.youtube?.videoId ||
        liveSummary?.twitch?.streamId ||
        ''
    );

    if (!roomOrSessionId) {
      return { dispatched: false, sent: false, reason: 'no-session-id' };
    }

    const lastAlertedRoom = String(userData.lastDiscordAlertRoomId || '');
    const lastAlertedKey = String(userData.lastDiscordAlertSessionKey || '');

    if (
      (liveSummary?.tiktok?.roomId && lastAlertedRoom === String(liveSummary.tiktok.roomId)) ||
      (liveSummary?.sessionKey && lastAlertedKey === String(liveSummary.sessionKey))
    ) {
      return { dispatched: false, sent: false, reason: 'already-alerted-for-session' };
    }

    // Recommandation 2 : Fenêtre d'Agrégation Intelligente Multi-Stream
    const aggregatedSummary = await aggregateMultiStreamWithGracePeriod(liveSummary, {
      skipWait: immediate
    });

    const finalRoomId = String(
      aggregatedSummary?.tiktok?.roomId || liveSummary?.tiktok?.roomId || roomOrSessionId
    );
    const finalSessionKey = String(
      aggregatedSummary?.sessionKey || liveSummary?.sessionKey || roomOrSessionId
    );

    // Verrouillage immédiat dans Firestore avant l'envoi pour éviter tout doublon
    await setDoc(
      docRef,
      {
        lastDiscordAlertRoomId: finalRoomId,
        lastDiscordAlertSessionKey: finalSessionKey,
        lastDiscordAlertAt: new Date().toISOString(),
        lastDiscordAlertEndedEdited: false
      },
      { merge: true }
    );

    // Recommandation 4 : Priorité au Webhook FireBOT (application_id) s'il est configuré, sinon Webhook officiel
    const webhookUrl =
      userData.discordBotWebhookUrl ||
      userData.discordWebhookUrl ||
      DEFAULT_DISCORD_WEBHOOK_URL;

    const sendResult = await sendUnifiedDiscordAlert(webhookUrl, aggregatedSummary, {
      dryRun: false
    });

    if (sendResult.sent && sendResult.messageId) {
      await setDoc(
        docRef,
        {
          lastDiscordAlertMessageId: String(sendResult.messageId),
          lastDiscordAlertWebhookUrl: webhookUrl,
          lastDiscordAlertTitle: aggregatedSummary?.unifiedTitle || 'Live Multi-Stream',
          lastDiscordAlertYoutubeUrl:
            aggregatedSummary?.youtube?.liveUrl || CREATOR_LIVE_ACCOUNTS.youtube.liveUrl,
          lastDiscordAlertTwitchVodUrl:
            aggregatedSummary?.twitch?.latestVodUrl || `${CREATOR_LIVE_ACCOUNTS.twitch.profileUrl}/videos`,
          lastDiscordAlertEndedEdited: false
        },
        { merge: true }
      );
    }

    return {
      dispatched: Boolean(sendResult.sent),
      sent: Boolean(sendResult.sent),
      messageId: sendResult.messageId || null,
      mode: sendResult.mode,
      sessionKey: finalSessionKey
    };
  } catch (err) {
    console.warn('[MultiLiveAlertService] Erreur dispatchDiscordAlertIfNeeded:', err.message);
    return { dispatched: false, sent: false, reason: 'error', error: err.message };
  }
}
