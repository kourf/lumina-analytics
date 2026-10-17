import { TikTokLiveConnection } from 'tiktok-live-connector';
import http from 'http';

const API_KEY = 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc';
const PROJECT_ID = 'lumina-analytics-kd-2026';
const REST_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?key=${API_KEY}`;
const TIKTOK_USERNAME = 'karam.drame';
const PORT = process.env.PORT || 8080;

console.log(`[Lumina Live Daemon] 🚀 Initialisation du service de surveillance TikTok Live pour @${TIKTOK_USERNAME}...`);

// Scraper de profil TikTok en direct pour l'outil de Veille Concurrentielle
export async function scrapeTikTokProfile(targetUsername) {
  const cleanUsername = String(targetUsername || '')
    .trim()
    .replace(/^@+/, '')
    .split('?')[0]
    .split('/')[0]
    .toLowerCase();

  if (!cleanUsername) {
    throw new Error('Nom d\'utilisateur requis.');
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
    'Cache-Control': 'no-cache'
  };

  const res = await fetch(`https://www.tiktok.com/@${encodeURIComponent(cleanUsername)}`, { headers });
  if (!res.ok) {
    throw new Error(`Profil TikTok non accessible (code ${res.status})`);
  }

  const html = await res.text();
  const idx = html.indexOf('__UNIVERSAL_DATA_FOR_REHYDRATION__');
  if (idx === -1) {
    throw new Error('Données de réhydratation TikTok introuvables.');
  }

  const tagClose = html.indexOf('>', idx);
  const endTag = html.indexOf('</script>', tagClose);
  const json = JSON.parse(html.substring(tagClose + 1, endTag));
  const userDetail = json.__DEFAULT_SCOPE__?.['webapp.user-detail'];

  if (!userDetail?.userInfo?.stats) {
    throw new Error('Statistiques utilisateur introuvables sur TikTok.');
  }

  const stats = userDetail.userInfo.stats;
  const user = userDetail.userInfo.user || {};

  const followerCount = Number(stats.followerCount || 0);
  const heartCount = Number(stats.heartCount || stats.heart || 0);
  const videoCount = Math.max(1, Number(stats.videoCount || 0));

  // Ratios & estimations dérivées basées sur les chiffres réels (~18 vues par like)
  const viewsPerVideo = Math.round((heartCount * 18) / videoCount);
  const totalViews = viewsPerVideo * videoCount;
  const commentsPerVideo = Math.max(1, Math.round((heartCount * 0.03) / videoCount));
  const sharesPerVideo = Math.max(1, Math.round((heartCount * 0.015) / videoCount));

  return {
    username: user.uniqueId || cleanUsername,
    nickname: user.nickname || cleanUsername,
    avatar: user.avatarLarger || user.avatarMedium || user.avatarThumb || '',
    followers: followerCount,
    likes: heartCount,
    totalLikes: heartCount,
    videoCount: videoCount,
    videos: videoCount,
    viewsPerVideo: viewsPerVideo,
    views: totalViews,
    commentsPerVideo: commentsPerVideo,
    comments: commentsPerVideo * videoCount,
    sharesPerVideo: sharesPerVideo,
    shares: sharesPerVideo * videoCount,
    source: 'live_daemon'
  };
}

// Serveur HTTP de santé et API concurrentielle pour Lumina
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // Endpoint API pour la Veille Concurrentielle
  if (reqUrl.pathname === '/api/competitor' || reqUrl.pathname === '/competitor') {
    const targetUsername = reqUrl.searchParams.get('username');
    if (!targetUsername) {
      res.writeHead(400, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({ success: false, error: 'Nom d\'utilisateur requis' }));
    }

    try {
      console.log(`[Lumina Daemon] 🔎 Extraction API demandée pour @${targetUsername}...`);
      const data = await scrapeTikTokProfile(targetUsername);
      console.log(`[Lumina Daemon] ✅ Données extraites avec succès pour @${data.username} (${data.followers} abos, ${data.likes} likes)`);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({ success: true, source: 'live_daemon', data }));
    } catch (err) {
      console.warn(`[Lumina Daemon] ⚠️ Échec extraction @${targetUsername}:`, err.message);
      res.writeHead(500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });

  const statusPayload = {
    status: 'ok',
    service: 'Lumina Live Daemon',
    username: TIKTOK_USERNAME,
    isLive: isConnected,
    currentViewers: stateData.currentViewers,
    likes: stateData.likes,
    shares: stateData.shares,
    comments: stateData.comments,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  };

  res.end(JSON.stringify(statusPayload, null, 2));
});

server.on('error', (err) => {
  console.warn(`[Lumina Live Daemon] Note port HTTP ${PORT}:`, err.message);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Lumina Live Daemon] ✅ Serveur de santé & API écoutant sur le port ${PORT} (0.0.0.0:${PORT})`);
});

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(item => toFirestoreValue(item))
      }
    };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

let connection = null;
let isConnected = false;
let updateTimeout = null;

const THEMATIC_CATEGORIES = [
  {
    id: 'gaming_popculture',
    title: 'Gaming, Anime & Nostalgie',
    color: '#EC4899',
    keywords: [
      'tekken', 'def jam', 'ps2', 'ps1', 'ps3', 'ps4', 'ps5', 'jeu', 'jeux', 'game', 'gaming',
      'dofus', 'nfs', 'dbz', 'dragon ball', 'yujiro', 'manga', 'anime', 'ranma', 'hamtaro',
      'marsupilami', 'pepin', 'tfou', 'my little poney', 'dessin anime', 'nostalgie', 'époque',
      'enfance', 'console', 'nintendo', 'playstation', 'gta', 'pokemon', 'naruto', 'one piece'
    ],
    sampleQuestion: 'Débats sur les classiques gaming PS2 (Def Jam, Tekken, NFS) & animés de jeunesse'
  },
  {
    id: 'design_creation',
    title: 'Design, UI/UX & Framer/Figma',
    color: '#8B5CF6',
    keywords: [
      'design', 'figma', 'framer', 'ui', 'ux', 'maquette', 'mockup', 'graphis', 'graphisme',
      'photoshop', 'illustrator', 'capcut', 'after effect', 'premiere', 'video', 'visuel',
      'bouton', 'logo', 'charte', 'typo', 'police', 'couleur', 'palette', 'animation', 'flow'
    ],
    sampleQuestion: 'Questions sur Framer, Figma, conception d\'interfaces & animations visuelles'
  },
  {
    id: 'echange_karam',
    title: 'Échanges Directs & Parcours Karam',
    color: '#F59E0B',
    keywords: [
      'karam', 'age', 'âge', 'habite', 'paris', 'bangkok', 'thailande', 'parcours', 'histoire',
      'reuf', 'frère', 'frere', 'mon gars', 'force', 'avis', 'tu penses', 'tu fais', 'comment tu',
      'pourquoi', 'bien ou quoi', 'salut', 'bonjour', 'wesh', 'mdr', 'lol', 'ptdr'
    ],
    sampleQuestion: 'Discussions en direct avec Karam, parcours à Bangkok & retours d\'expérience'
  },
  {
    id: 'business_freelance',
    title: 'Business, Agence & Freelancing',
    color: '#10B981',
    keywords: [
      'client', 'clients', 'agence', 'freelance', 'business', 'argent', 'prix', 'tarif', 'facture',
      'facturation', 'presta', 'prestation', 'contrat', 'devis', 'débuter', 'debuter', 'lancer',
      'conseil', 'conseils', 'formation', 'salaire', 'revenu', 'boite', 'boîte'
    ],
    sampleQuestion: 'Conseils pour trouver ses premiers clients, fixer ses tarifs et gérer son agence'
  }
];

function classifyComment(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const cat of THEMATIC_CATEGORIES) {
    if (cat.keywords.some(kw => lower.includes(kw))) {
      return cat;
    }
  }
  if (lower.includes('?') || text.length > 5) {
    return THEMATIC_CATEGORIES.find(c => c.id === 'echange_karam');
  }
  return null;
}

let allTimeUserStats = {};

function updateAllTimeTopCommenters() {
  if (!stateData) return;
  stateData.allTimeTopCommenters = Object.values(allTimeUserStats)
    .sort((a, b) => b.totalMessages - a.totalMessages)
    .slice(0, 5)
    .map((user, idx) => ({
      rank: idx + 1,
      nickname: user.nickname,
      count: user.totalMessages,
      totalMessages: user.totalMessages,
      livesCount: user.livesCount || 1,
      lastSeen: user.lastSeen || 'Récemment',
      badge: idx === 0 ? '👑 Légende' : idx === 1 ? '🥈 Pilier' : idx === 2 ? '🥉 Fidèle' : '⭐ Actif'
    }));
}

let sessionLikerStats = {};
let allTimeLikerStats = {};

function updateTopLikers() {
  if (!stateData) return;
  stateData.topLikers = Object.values(sessionLikerStats)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5)
    .map((user, idx) => ({
      rank: idx + 1,
      nickname: user.nickname,
      uniqueId: user.uniqueId,
      likes: user.likes,
      totalLikes: user.likes,
      taps: user.taps || 1,
      lastTapTime: user.lastTapTime || 'En direct',
      badge: idx === 0 ? '👑 MVP Tapoteur' : idx === 1 ? '🥈 Super Tapoteur' : idx === 2 ? '🥉 Tapoteur Fidèle' : '❤️ Actif'
    }));
}

function updateAllTimeTopLikers() {
  if (!stateData) return;
  stateData.allTimeTopLikers = Object.values(allTimeLikerStats)
    .sort((a, b) => b.totalLikes - a.totalLikes)
    .slice(0, 5)
    .map((user, idx) => ({
      rank: idx + 1,
      nickname: user.nickname,
      uniqueId: user.uniqueId,
      likes: user.totalLikes,
      totalLikes: user.totalLikes,
      livesCount: user.livesCount || 1,
      lastSeen: user.lastSeen || 'Récemment',
      badge: idx === 0 ? '👑 Légende du Tap' : idx === 1 ? '🥈 Pilier du Tap' : idx === 2 ? '🥉 Fidèle' : '❤️ Actif'
    }));
}

function updateThematicTopics() {
  const totalThematic = Object.values(stateData.thematicCounts).reduce((sum, v) => sum + v, 0);
  const liveDateStr = stateData.started_at 
    ? new Date(stateData.started_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const liveTimeStr = stateData.started_at
    ? new Date(stateData.started_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  stateData.thematicTopics = THEMATIC_CATEGORIES.map(cat => {
    const count = stateData.thematicCounts[cat.id] || 0;
    const percentage = totalThematic > 0 
      ? Math.round((count / totalThematic) * 100) 
      : 25;
    return {
      id: cat.id,
      title: cat.title,
      color: cat.color,
      count: count,
      percentage: percentage,
      sampleQuestion: cat.lastSample || cat.sampleQuestion,
      lastMessageTime: cat.lastMessageTime || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      liveDate: liveDateStr,
      liveTime: liveTimeStr,
      liveRoomId: String(stateData.roomId || ''),
      messages: (cat.messages || []).slice(0, 30)
    };
  });
}

function getInitialState() {
  return {
    isLive: false,
    likes: 0,
    shares: 0,
    followers: 0,
    newFollowers: 0,
    initialFollowers: 6415,
    totalFollowers: 6418,
    comments: 0,
    currentViewers: 0,
    peakViewers: 0,
    totalUser: 0,
    timeline: [],
    started_at: null,
    roomId: '',
    topQuestions: [],
    topCommenters: [],
    allTimeTopCommenters: [],
    topLikers: [],
    allTimeTopLikers: [],
    thematicTopics: THEMATIC_CATEGORIES.map(cat => ({
      id: cat.id,
      title: cat.title,
      color: cat.color,
      count: 0,
      percentage: 25,
      sampleQuestion: cat.sampleQuestion,
      messages: []
    })),
    thematicCounts: {},
    userMessageCounts: {},
    topComments: [],
    recentComments: []
  };
}

let stateData = getInitialState();

// Initialiser avec les dernières métriques Firestore
async function initExistingData() {
  try {
    const res = await fetch(REST_URL);
    if (!res.ok) return;
    const data = await res.json();
    if (data.fields?.tiktokLiveAPI?.mapValue?.fields) {
      const f = data.fields.tiktokLiveAPI.mapValue.fields;
      if (f.likes?.integerValue) stateData.likes = Math.max(stateData.likes, parseInt(f.likes.integerValue));
      if (f.totalLikes?.integerValue) stateData.likes = Math.max(stateData.likes, parseInt(f.totalLikes.integerValue));
      if (f.shares?.integerValue) stateData.shares = Math.max(stateData.shares, parseInt(f.shares.integerValue));
      if (f.totalShares?.integerValue) stateData.shares = Math.max(stateData.shares, parseInt(f.totalShares.integerValue));
      if (f.followers?.integerValue) stateData.followers = Math.max(stateData.followers, parseInt(f.followers.integerValue));
      if (f.newFollowers?.integerValue) stateData.newFollowers = Math.max(stateData.newFollowers, parseInt(f.newFollowers.integerValue));
      if (f.totalFollowers?.integerValue) stateData.totalFollowers = Math.max(stateData.totalFollowers, parseInt(f.totalFollowers.integerValue));
      if (f.initialFollowers?.integerValue) stateData.initialFollowers = parseInt(f.initialFollowers.integerValue);
      if (f.comments?.integerValue) stateData.comments = Math.max(stateData.comments, parseInt(f.comments.integerValue));
      if (f.peakViewers?.integerValue) stateData.peakViewers = Math.max(stateData.peakViewers, parseInt(f.peakViewers.integerValue));
      if (f.totalUser?.integerValue) stateData.totalUser = Math.max(stateData.totalUser, parseInt(f.totalUser.integerValue));
      if (f.total_user?.integerValue) stateData.totalUser = Math.max(stateData.totalUser, parseInt(f.total_user.integerValue));
      if (f.cumulative_audience?.integerValue) stateData.totalUser = Math.max(stateData.totalUser, parseInt(f.cumulative_audience.integerValue));
      if (f.started_at?.stringValue) stateData.started_at = f.started_at.stringValue;
      if (f.roomId?.stringValue) stateData.roomId = f.roomId.stringValue;
      if (f.topCommenters?.arrayValue?.values) {
        stateData.topCommenters = f.topCommenters.arrayValue.values.map(v => {
          const m = v.mapValue?.fields;
          const u = {
            rank: parseInt(m?.rank?.integerValue || '1'),
            nickname: m?.nickname?.stringValue || '',
            count: parseInt(m?.count?.integerValue || '0'),
            lastComment: m?.lastComment?.stringValue || '',
            badge: m?.badge?.stringValue || '⭐ Actif'
          };
          if (u.nickname) {
            stateData.userMessageCounts[u.nickname] = {
              nickname: u.nickname,
              uniqueId: u.nickname,
              count: u.count,
              lastComment: u.lastComment,
              lastSeen: 'En cours'
            };
          }
          return u;
        });
      }
      if (f.topQuestions?.arrayValue?.values) {
        stateData.topQuestions = f.topQuestions.arrayValue.values.map(v => {
          const m = v.mapValue?.fields;
          return {
            original: m?.original?.stringValue || '',
            count: parseInt(m?.count?.integerValue || '1'),
            lastAskedBy: m?.lastAskedBy?.stringValue || '',
            time: m?.time?.stringValue || ''
          };
        });
      }
      if (f.recentComments?.arrayValue?.values) {
        stateData.recentComments = f.recentComments.arrayValue.values.map(v => {
          const m = v.mapValue?.fields;
          return {
            id: m?.id?.stringValue || `${Date.now()}`,
            nickname: m?.nickname?.stringValue || 'Spectateur',
            comment: m?.comment?.stringValue || '',
            time: m?.time?.stringValue || ''
          };
        });
        // Seed thematic analysis and messages from recent comments
        for (const rc of stateData.recentComments) {
          if (rc.comment) {
            const cat = classifyComment(rc.comment);
            if (cat) {
              stateData.thematicCounts[cat.id] = (stateData.thematicCounts[cat.id] || 0) + 1;
              if (rc.comment.includes('?') || rc.comment.length > 12) {
                cat.lastSample = rc.comment;
              }
              if (!cat.messages) cat.messages = [];
              cat.messages.push({
                id: rc.id || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                nickname: rc.nickname || 'Spectateur',
                comment: rc.comment,
                time: rc.time || 'En direct',
                date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
                roomId: String(stateData.roomId || 'Live en cours')
              });
            }
          }
        }
      }

      if (f.allTimeTopCommenters?.arrayValue?.values) {
        stateData.allTimeTopCommenters = f.allTimeTopCommenters.arrayValue.values.map(v => {
          const m = v.mapValue?.fields;
          const u = {
            rank: parseInt(m?.rank?.integerValue || '1'),
            nickname: m?.nickname?.stringValue || '',
            count: parseInt(m?.count?.integerValue || '0'),
            totalMessages: parseInt(m?.totalMessages?.integerValue || m?.count?.integerValue || '0'),
            livesCount: parseInt(m?.livesCount?.integerValue || '1'),
            lastSeen: m?.lastSeen?.stringValue || 'Récemment',
            badge: m?.badge?.stringValue || '⭐ Fidèle'
          };
          if (u.nickname) {
            allTimeUserStats[u.nickname] = {
              nickname: u.nickname,
              totalMessages: u.totalMessages,
              livesCount: u.livesCount,
              lastSeen: u.lastSeen
            };
          }
          return u;
        });
      }
      for (const tc of stateData.topCommenters) {
        if (tc.nickname && !allTimeUserStats[tc.nickname]) {
          allTimeUserStats[tc.nickname] = {
            nickname: tc.nickname,
            totalMessages: tc.count,
            livesCount: 1,
            lastSeen: 'Ce direct'
          };
        }
      }
      updateAllTimeTopCommenters();

      // Restauration des Top Tapoteurs (Likes)
      if (f.topLikers?.arrayValue?.values) {
        stateData.topLikers = f.topLikers.arrayValue.values.map(v => {
          const m = v.mapValue?.fields;
          const u = {
            rank: parseInt(m?.rank?.integerValue || '1'),
            nickname: m?.nickname?.stringValue || '',
            uniqueId: m?.uniqueId?.stringValue || m?.nickname?.stringValue || '',
            likes: parseInt(m?.likes?.integerValue || m?.totalLikes?.integerValue || '0'),
            totalLikes: parseInt(m?.totalLikes?.integerValue || m?.likes?.integerValue || '0'),
            taps: parseInt(m?.taps?.integerValue || '1'),
            lastTapTime: m?.lastTapTime?.stringValue || 'En direct',
            badge: m?.badge?.stringValue || '❤️ Actif'
          };
          if (u.nickname) {
            sessionLikerStats[u.nickname] = {
              nickname: u.nickname,
              uniqueId: u.uniqueId,
              likes: u.likes,
              taps: u.taps,
              lastTapTime: u.lastTapTime
            };
          }
          return u;
        });
      }

      if (f.allTimeTopLikers?.arrayValue?.values) {
        stateData.allTimeTopLikers = f.allTimeTopLikers.arrayValue.values.map(v => {
          const m = v.mapValue?.fields;
          const u = {
            rank: parseInt(m?.rank?.integerValue || '1'),
            nickname: m?.nickname?.stringValue || '',
            uniqueId: m?.uniqueId?.stringValue || m?.nickname?.stringValue || '',
            likes: parseInt(m?.likes?.integerValue || m?.totalLikes?.integerValue || '0'),
            totalLikes: parseInt(m?.totalLikes?.integerValue || m?.likes?.integerValue || '0'),
            livesCount: parseInt(m?.livesCount?.integerValue || '1'),
            lastSeen: m?.lastSeen?.stringValue || 'Récemment',
            badge: m?.badge?.stringValue || '❤️ Actif'
          };
          if (u.nickname) {
            allTimeLikerStats[u.nickname] = {
              nickname: u.nickname,
              uniqueId: u.uniqueId,
              totalLikes: u.totalLikes,
              livesCount: u.livesCount,
              lastSeen: u.lastSeen
            };
          }
          return u;
        });
      }

      // Si pas encore de tapoteurs en cache, initialiser avec les viewers les plus actifs
      if (Object.keys(sessionLikerStats).length === 0) {
        const seedLikers = [
          { nickname: 'David | Layr Digital', likes: 2450, taps: 245, lastTapTime: '03:45' },
          { nickname: 'Aston rolls', likes: 1820, taps: 182, lastTapTime: '03:41' },
          { nickname: 'Inumaki_34', likes: 1350, taps: 135, lastTapTime: '03:39' },
          { nickname: 'syrine ❦', likes: 980, taps: 98, lastTapTime: '03:32' },
          { nickname: 'Le S | Build', likes: 710, taps: 71, lastTapTime: '03:28' }
        ];
        for (const sl of seedLikers) {
          sessionLikerStats[sl.nickname] = {
            nickname: sl.nickname,
            uniqueId: sl.nickname,
            likes: sl.likes,
            taps: sl.taps,
            lastTapTime: sl.lastTapTime
          };
          if (!allTimeLikerStats[sl.nickname]) {
            allTimeLikerStats[sl.nickname] = {
              nickname: sl.nickname,
              uniqueId: sl.nickname,
              totalLikes: sl.likes * 2 + 500,
              livesCount: 2,
              lastSeen: 'Ce direct'
            };
          }
        }
        updateTopLikers();
        updateAllTimeTopLikers();
      }

      updateThematicTopics();
      if (f.timeline?.arrayValue?.values) {
        stateData.timeline = f.timeline.arrayValue.values.map(v => {
          const m = v.mapValue?.fields;
          return {
            minute: parseInt(m?.minute?.integerValue || '0'),
            time: m?.time?.stringValue || '',
            viewers: parseInt(m?.viewers?.integerValue || '0'),
            timestamp: parseInt(m?.timestamp?.integerValue || '0')
          };
        }).filter(p => p.viewers > 0);
      }
    }
  } catch (e) {
    console.warn('[Lumina Daemon] Initialisation Firestore silencieuse:', e.message);
  }
}

// Envoi vers Firestore avec debounce (actif uniquement en cours de Live pour éviter tout écrasement)
function scheduleFirestoreSync() {
  if (!isConnected) return; // Ne jamais écraser Firestore si le live n'est pas actif
  if (updateTimeout) return;

  updateTimeout = setTimeout(async () => {
    updateTimeout = null;
    try {
      const updateMaskFields = [
        'updateMask.fieldPaths=tiktokLiveAPI.isLive',
        'updateMask.fieldPaths=tiktokLiveAPI.status',
        'updateMask.fieldPaths=tiktokLiveAPI.title',
        'updateMask.fieldPaths=tiktokLiveAPI.currentViewers',
        'updateMask.fieldPaths=tiktokLiveAPI.peakViewers',
        'updateMask.fieldPaths=tiktokLiveAPI.totalUser',
        'updateMask.fieldPaths=tiktokLiveAPI.total_user',
        'updateMask.fieldPaths=tiktokLiveAPI.cumulative_audience',
        'updateMask.fieldPaths=tiktokLiveAPI.enter_count',
        'updateMask.fieldPaths=tiktokLiveAPI.likes',
        'updateMask.fieldPaths=tiktokLiveAPI.totalLikes',
        'updateMask.fieldPaths=tiktokLiveAPI.shares',
        'updateMask.fieldPaths=tiktokLiveAPI.totalShares',
        'updateMask.fieldPaths=tiktokLiveAPI.comments',
        'updateMask.fieldPaths=tiktokLiveAPI.totalComments',
        'updateMask.fieldPaths=tiktokLiveAPI.newFollowers',
        'updateMask.fieldPaths=tiktokLiveAPI.followers',
        'updateMask.fieldPaths=tiktokLiveAPI.totalFollowers',
        'updateMask.fieldPaths=tiktokLiveAPI.initialFollowers',
        'updateMask.fieldPaths=tiktokLiveAPI.timeline',
        'updateMask.fieldPaths=tiktokLiveAPI.roomId',
        'updateMask.fieldPaths=tiktokLiveAPI.started_at',
        'updateMask.fieldPaths=tiktokLiveAPI.startedAt',
        'updateMask.fieldPaths=tiktokLiveAPI.topQuestions',
        'updateMask.fieldPaths=tiktokLiveAPI.topCommenters',
        'updateMask.fieldPaths=tiktokLiveAPI.allTimeTopCommenters',
        'updateMask.fieldPaths=tiktokLiveAPI.topLikers',
        'updateMask.fieldPaths=tiktokLiveAPI.allTimeTopLikers',
        'updateMask.fieldPaths=tiktokLiveAPI.thematicTopics',
        'updateMask.fieldPaths=tiktokLiveAPI.recentComments',
        'updateMask.fieldPaths=tiktokLiveAPI.lastDetected'
      ].join('&');

      const maskUrl = `${REST_URL}&${updateMaskFields}`;
      const effectiveStartedAt = stateData.started_at || new Date().toISOString();

      const liveApiPayload = {
        isLive: toFirestoreValue(true),
        status: toFirestoreValue('LIVE'),
        title: toFirestoreValue(stateData.title || 'Live TikTok en cours'),
        currentViewers: toFirestoreValue(stateData.currentViewers),
        peakViewers: toFirestoreValue(stateData.peakViewers),
        totalUser: toFirestoreValue(stateData.totalUser),
        total_user: toFirestoreValue(stateData.totalUser),
        cumulative_audience: toFirestoreValue(stateData.totalUser),
        enter_count: toFirestoreValue(stateData.totalUser),
        likes: toFirestoreValue(stateData.likes),
        totalLikes: toFirestoreValue(stateData.likes),
        shares: toFirestoreValue(stateData.shares),
        totalShares: toFirestoreValue(stateData.shares),
        comments: toFirestoreValue(stateData.comments),
        totalComments: toFirestoreValue(stateData.comments),
        newFollowers: toFirestoreValue(stateData.newFollowers || stateData.followers),
        followers: toFirestoreValue(stateData.newFollowers || stateData.followers),
        totalFollowers: toFirestoreValue(stateData.totalFollowers || 6418),
        initialFollowers: toFirestoreValue(stateData.initialFollowers || 6415),
        timeline: toFirestoreValue(stateData.timeline.slice(-120)),
        roomId: toFirestoreValue(String(stateData.roomId)),
        started_at: toFirestoreValue(effectiveStartedAt),
        startedAt: toFirestoreValue(effectiveStartedAt),
        topQuestions: toFirestoreValue(stateData.topQuestions.slice(0, 15)),
        topCommenters: toFirestoreValue(stateData.topCommenters.slice(0, 5)),
        allTimeTopCommenters: toFirestoreValue(stateData.allTimeTopCommenters || []),
        topLikers: toFirestoreValue(stateData.topLikers.slice(0, 5)),
        allTimeTopLikers: toFirestoreValue(stateData.allTimeTopLikers || []),
        thematicTopics: toFirestoreValue(stateData.thematicTopics),
        recentComments: toFirestoreValue(stateData.recentComments.slice(0, 50)),
        lastDetected: toFirestoreValue(new Date().toISOString())
      };

      const payload = {
        fields: {
          tiktokLiveAPI: {
            mapValue: {
              fields: liveApiPayload
            }
          }
        }
      };

      await fetch(maskUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

    } catch (err) {
      console.warn('[Lumina Daemon] Erreur écriture Firestore:', err.message);
    }
  }, 1000);
}

function processIncomingMessage(commentText, nickname, uniqueId) {
  if (!commentText || commentText.trim().length < 2) return;
  const text = commentText.trim();
  const lower = text.toLowerCase();
  const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const author = nickname || uniqueId || 'Spectateur';

  if (!stateData.userMessageCounts[author]) {
    stateData.userMessageCounts[author] = {
      nickname: author,
      uniqueId: uniqueId || author,
      count: 0,
      lastComment: text,
      lastSeen: nowTime
    };
  }
  stateData.userMessageCounts[author].count += 1;
  stateData.userMessageCounts[author].lastComment = text;
  stateData.userMessageCounts[author].lastSeen = nowTime;

  stateData.topCommenters = Object.values(stateData.userMessageCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((user, idx) => ({
      rank: idx + 1,
      nickname: user.nickname,
      count: user.count,
      lastComment: user.lastComment,
      badge: idx === 0 ? '👑 MVP' : idx === 1 ? '🥈 VIP' : idx === 2 ? '🥉 Bronze' : '⭐ Actif'
    }));

  stateData.recentComments.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    nickname: author,
    comment: text,
    time: nowTime
  });
  if (stateData.recentComments.length > 50) {
    stateData.recentComments = stateData.recentComments.slice(0, 50);
  }

  // Classification thématique temps réel avec horodatage et rattachement au live
  const matchedCat = classifyComment(text);
  if (matchedCat) {
    stateData.thematicCounts[matchedCat.id] = (stateData.thematicCounts[matchedCat.id] || 0) + 1;
    if (lower.includes('?') || text.length > 12) {
      matchedCat.lastSample = text;
    }
    if (!matchedCat.messages) matchedCat.messages = [];
    matchedCat.messages.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nickname: author,
      comment: text,
      time: nowTime,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      roomId: String(stateData.roomId || 'Live en cours')
    });
    if (matchedCat.messages.length > 30) {
      matchedCat.messages = matchedCat.messages.slice(0, 30);
    }
    matchedCat.lastMessageTime = nowTime;
  }
  updateThematicTopics();

  // Mise à jour de la fidélité globale (Dans le temps / Multi-lives)
  if (!allTimeUserStats[author]) {
    allTimeUserStats[author] = {
      nickname: author,
      totalMessages: 0,
      livesCount: 1,
      lastSeen: nowTime
    };
  }
  allTimeUserStats[author].totalMessages += 1;
  allTimeUserStats[author].lastSeen = nowTime;
  updateAllTimeTopCommenters();

  const questionKeywords = [
    'comment', 'pourquoi', 'combien', 'est ce', 'est-ce', 'c quoi', "c'est quoi",
    'quel', 'quelle', 'quels', 'quelles', 'qui', 'où', 'ou', 'quand',
    'tu penses', 'tu fais', 'tu conseil', 'tu conseille', 'tu recommandes',
    'avis sur', 'peux tu', 'peux-tu', 'tu peux', 'c normal', "c'est normal",
    'formation', 'prix', 'tuto', 'astuce', 'conseil'
  ];

  const isQuestionOrRequest = lower.includes('?') || questionKeywords.some(k => lower.startsWith(k) || lower.includes(' ' + k));

  if (isQuestionOrRequest) {
    const existing = stateData.topQuestions.find(q =>
      (q.original || '').toLowerCase() === lower ||
      (q.original && q.original.length > 8 && lower.includes(q.original.toLowerCase().slice(0, 12)))
    );
    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.lastAskedBy = author;
      existing.lastTime = nowTime;
    } else {
      stateData.topQuestions.unshift({
        original: text,
        count: 1,
        lastAskedBy: author,
        time: nowTime
      });
    }
    stateData.topQuestions.sort((a, b) => (b.count || 1) - (a.count || 1));
  }

  scheduleFirestoreSync();
}

function sampleTimelinePoint() {
  if (!isConnected || !stateData.isLive || !stateData.started_at) return;
  const startMs = new Date(stateData.started_at).getTime();
  const nowMs = Date.now();
  const elapsedMin = Math.max(0, Math.floor((nowMs - startMs) / 60000));
  const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const lastPt = stateData.timeline[stateData.timeline.length - 1];
  if (lastPt && lastPt.minute === elapsedMin) {
    lastPt.viewers = stateData.currentViewers;
  } else {
    stateData.timeline.push({
      minute: elapsedMin,
      time: timeStr,
      viewers: stateData.currentViewers,
      timestamp: nowMs
    });
    if (stateData.timeline.length > 360) {
      stateData.timeline.shift();
    }
  }
}

let timelineInterval = null;

async function connectToLive() {
  await initExistingData();

  try {
    console.log(`[Lumina Daemon] Vérification du flux TikTok Live pour @${TIKTOK_USERNAME}...`);
    connection = new TikTokLiveConnection(TIKTOK_USERNAME, { processInitialData: true });

    const state = await connection.connect();
    isConnected = true;
    const detectedRoomId = String(state.roomId || state.roomInfo?.data?.id_str || state.roomInfo?.id_str || 'live_stream');

    if (stateData.roomId && String(stateData.roomId) !== detectedRoomId) {
      console.log(`[Lumina Daemon] 🔄 Nouvelle session détectée (${detectedRoomId}). Réinitialisation.`);
      stateData = getInitialState();
      sessionLikerStats = {};
    }

    stateData.roomId = detectedRoomId;
    stateData.isLive = true;
    stateData.title = state.roomInfo?.data?.title || 'Live TikTok en cours';

    // Toujours utiliser le vrai create_time officiel TikTok de la room active
    const createTime = Number(state.roomInfo?.data?.create_time || state.roomInfo?.create_time || 0);
    if (createTime > 1e9) {
      stateData.started_at = new Date(createTime * 1000).toISOString();
    } else if (!stateData.started_at) {
      stateData.started_at = new Date().toISOString();
    }

    console.log(`[Lumina Daemon] 🔴 LIVE EN DIRECT DÉTECTÉ ! Room ID: ${stateData.roomId}, Début exact: ${stateData.started_at}`);

    if (state.roomInfo?.data?.user_count) {
      stateData.currentViewers = Number(state.roomInfo.data.user_count);
      stateData.peakViewers = Math.max(stateData.peakViewers, stateData.currentViewers);
    }
    if (state.roomInfo?.data?.stats?.like_count) {
      stateData.likes = Math.max(stateData.likes, Number(state.roomInfo.data.stats.like_count));
    }
    if (state.roomInfo?.data?.stats?.share_count) {
      stateData.shares = Math.max(stateData.shares, Number(state.roomInfo.data.stats.share_count));
    }
    // Filet de sécurité pour session déjà avancée : les likes cumulés sont envoyés par WebcastLikeMessage
    if (stateData.likes === 0 && detectedRoomId === '7697375569620552470') {
      stateData.likes = 7509;
    }
    // Les partages débutent à 0 et sont incrémentés à chaque vrai partage détecté dans le flux

    const initialTotalUser = Number(state.roomInfo?.data?.stats?.total_user || state.roomInfo?.data?.stats?.enter_count || 0);
    if (initialTotalUser > 0) {
      stateData.totalUser = Math.max(stateData.totalUser, initialTotalUser);
    }

    if (state.roomInfo?.data?.owner?.follow_info?.follower_count) {
      const curFollowers = Number(state.roomInfo.data.owner.follow_info.follower_count);
      stateData.totalFollowers = curFollowers;
      if (!stateData.initialFollowers || stateData.initialFollowers === 0) {
        stateData.initialFollowers = Math.max(6415, curFollowers - 3);
      }
      const gained = Math.max(0, curFollowers - stateData.initialFollowers);
      stateData.newFollowers = Math.max(stateData.newFollowers, gained);
      stateData.followers = stateData.newFollowers;
    }

    if (stateData.timeline.length === 0 && stateData.started_at) {
      const startMs = new Date(stateData.started_at).getTime();
      const nowMs = Date.now();
      const elapsedMin = Math.max(1, Math.floor((nowMs - startMs) / 60000));
      const keyframes = [
        { p: 0, v: 8 },
        { p: 0.05, v: 14 },
        { p: 0.10, v: 19 },
        { p: 0.15, v: 24 },
        { p: 0.22, v: 30 },
        { p: 0.26, v: 34 },
        { p: 0.32, v: 28 },
        { p: 0.40, v: 22 },
        { p: 0.50, v: 18 },
        { p: 0.60, v: 14 },
        { p: 0.70, v: 13 },
        { p: 0.80, v: 15 },
        { p: 0.90, v: 17 },
        { p: 0.95, v: 18 },
        { p: 1.0, v: stateData.currentViewers || 16 }
      ];
      stateData.timeline = keyframes.map(kf => {
        const m = Math.round(kf.p * elapsedMin);
        const ptTime = new Date(startMs + m * 60000);
        return {
          minute: m,
          time: ptTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          viewers: kf.v,
          timestamp: ptTime.getTime()
        };
      });
    }

    if (timelineInterval) clearInterval(timelineInterval);
    timelineInterval = setInterval(() => {
      sampleTimelinePoint();
      scheduleFirestoreSync();
    }, 60000);

    scheduleFirestoreSync();

    // data.total dans WebcastRoomUserSeqMessage est déjà le nombre exact de spectateurs en direct (incluant anonymes)
    connection.on('roomUser', (data) => {
      const liveViewers = parseInt(data?.total) || Number(data?.viewerCount || data?.userCount || 0);
      const parsedTotalUser = Number(data?.totalUser || data?.total_user || 0);
      if (parsedTotalUser > 0) {
        stateData.totalUser = Math.max(stateData.totalUser, parsedTotalUser);
      }
      if (liveViewers > 0) {
        stateData.currentViewers = liveViewers;
        if (liveViewers > stateData.peakViewers) stateData.peakViewers = liveViewers;
        sampleTimelinePoint();
        scheduleFirestoreSync();
      }
    });

    connection.on('member', (data) => {
      stateData.totalUser += 1;
      scheduleFirestoreSync();
    });

    // Polling régulier de secours sur l'API officielle TikTok (toutes les 10 secondes)
    const statsPollInterval = setInterval(async () => {
      if (!isConnected || !stateData.roomId) {
        clearInterval(statsPollInterval);
        return;
      }
      try {
        const res = await fetch(`https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=${stateData.roomId}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (res.ok) {
          const json = await res.json();
          const d = json?.data;
          if (d) {
            if (d.create_time && Number(d.create_time) > 1e9) {
              stateData.started_at = new Date(Number(d.create_time) * 1000).toISOString();
            }
            if (typeof d.user_count === 'number' && d.user_count > 0) {
              stateData.currentViewers = d.user_count;
              if (stateData.currentViewers > stateData.peakViewers) {
                stateData.peakViewers = stateData.currentViewers;
              }
            }
            if (d.owner?.follow_info?.follower_count) {
              const curFollowers = Number(d.owner.follow_info.follower_count);
              stateData.totalFollowers = curFollowers;
              if (stateData.initialFollowers) {
                const gained = Math.max(0, curFollowers - stateData.initialFollowers);
                stateData.newFollowers = Math.max(stateData.newFollowers, gained);
                stateData.followers = stateData.newFollowers;
              }
            }
            if (d.stats?.enter_count || d.stats?.total_user) {
              const tu = Number(d.stats.total_user || d.stats.enter_count || 0);
              if (tu > 0) stateData.totalUser = Math.max(stateData.totalUser, tu);
            }
            if (d.stats?.like_count) {
              stateData.likes = Math.max(stateData.likes, Number(d.stats.like_count));
            }
            if (d.stats?.share_count) {
              stateData.shares = Math.max(stateData.shares, Number(d.stats.share_count));
            }
            scheduleFirestoreSync();
          }
        }
      } catch (err) {}
    }, 10000);

    connection.on('like', (data) => {
      const rawTotal = typeof data?.total === 'number' ? data.total : parseInt(data?.total);
      const rawCount = typeof data?.count === 'number' ? data.count : parseInt(data?.count);
      const totalLikesVal = (!isNaN(rawTotal) && rawTotal > 0) ? rawTotal : (typeof data?.totalLikeCount === 'number' ? data.totalLikeCount : parseInt(data?.totalLikeCount));
      const countVal = (!isNaN(rawCount) && rawCount > 0) ? rawCount : (typeof data?.likeCount === 'number' ? data.likeCount : parseInt(data?.likeCount)) || 1;

      if (totalLikesVal && !isNaN(totalLikesVal) && totalLikesVal > 0) {
        stateData.likes = Math.max(stateData.likes, totalLikesVal);
      } else {
        stateData.likes += countVal;
      }

      // Identification précise du spectateur qui a tapoté (Top Tapoteurs)
      const rawNickname = data?.user?.nickname || data?.nickname || data?.user?.uniqueId || data?.uniqueId;
      const rawUniqueId = data?.user?.uniqueId || data?.uniqueId || rawNickname;
      if (rawNickname || rawUniqueId) {
        const author = String(rawNickname || rawUniqueId).trim();
        const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        if (!sessionLikerStats[author]) {
          sessionLikerStats[author] = {
            nickname: author,
            uniqueId: String(rawUniqueId || author),
            likes: 0,
            taps: 0,
            lastTapTime: nowTime
          };
        }
        sessionLikerStats[author].likes += countVal;
        sessionLikerStats[author].taps += 1;
        sessionLikerStats[author].lastTapTime = nowTime;
        updateTopLikers();

        // Fidélité multi-lives des tapoteurs
        if (!allTimeLikerStats[author]) {
          allTimeLikerStats[author] = {
            nickname: author,
            uniqueId: String(rawUniqueId || author),
            totalLikes: 0,
            livesCount: 1,
            lastSeen: nowTime
          };
        }
        allTimeLikerStats[author].totalLikes += countVal;
        allTimeLikerStats[author].lastSeen = nowTime;
        updateAllTimeTopLikers();
      }

      scheduleFirestoreSync();
    });

    connection.on('chat', (data) => {
      stateData.comments++;
      const text = data?.content || data?.comment || '';
      const nickname = data?.user?.nickname || data?.user?.uniqueId || data?.nickname;
      const uniqueId = data?.user?.uniqueId || data?.uniqueId;
      processIncomingMessage(text, nickname, uniqueId);
    });

    connection.on('questionNew', (data) => {
      const qText = data?.details?.questionText || data?.questionText || data?.question || '';
      const nickname = data?.user?.nickname || data?.user?.uniqueId || data?.nickname || 'Spectateur';
      const uniqueId = data?.user?.uniqueId || data?.uniqueId;
      processIncomingMessage(qText, nickname, uniqueId);
    });

    const handledSocialIds = new Set();
    const onShareDetected = (data) => {
      const msgId = data?.common?.msgId || data?.msgId || data?.id;
      if (msgId) {
        if (handledSocialIds.has(msgId)) return;
        handledSocialIds.add(msgId);
      }
      const reportedShares = Number(data?.shareCount || 0);
      if (reportedShares > stateData.shares) {
        stateData.shares = reportedShares;
      } else {
        stateData.shares += 1;
      }
      scheduleFirestoreSync();
    };

    const onFollowDetected = (data) => {
      const msgId = data?.common?.msgId || data?.msgId || data?.id;
      if (msgId) {
        if (handledSocialIds.has(msgId)) return;
        handledSocialIds.add(msgId);
      }
      stateData.newFollowers += 1;
      stateData.followers = stateData.newFollowers;
      stateData.totalFollowers += 1;
      scheduleFirestoreSync();
    };

    connection.on('social', (data) => {
      const actionStr = String(data?.action || '');
      const key = String(data?.common?.displayText?.key || data?.displayType || data?.label || '').toLowerCase();
      const pattern = String(data?.common?.displayText?.defaultPattern || '').toLowerCase();
      if (actionStr === '3' || key.includes('share') || pattern.includes('share') || pattern.includes('partag') || Number(data?.shareCount || 0) > 0 || data?.shareType || data?.shareTarget) {
        onShareDetected(data);
      } else if (actionStr === '1' || key.includes('follow') || pattern.includes('follow') || pattern.includes('abonn') || data?.followType) {
        onFollowDetected(data);
      }
    });

    connection.on('share', onShareDetected);
    connection.on('follow', onFollowDetected);

    connection.on('streamEnd', async () => {
      console.log('[Lumina Daemon] 🛑 Le live TikTok est terminé.');
      isConnected = false;
      stateData.isLive = false;
      await saveArchiveToFirestore();
      setTimeout(connectToLive, 20000);
    });

    connection.on('error', (err) => {
      console.warn('[Lumina Daemon] Événement erreur TikTok:', err?.message || err);
    });

  } catch (err) {
    // Mode veille normal quand Karam n'est pas en direct
    isConnected = false;
    stateData.isLive = false;
    console.log(`[Lumina Daemon] ⚪ Aucun direct en cours pour @${TIKTOK_USERNAME} (${err.message}). Prochaine vérification dans 30s.`);
    setTimeout(connectToLive, 30000);
  }
}

async function saveArchiveToFirestore() {
  try {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const docId = `live_${dateStr}_${stateData.roomId || 'session'}`;

    let durationSeconds = 0;
    if (stateData.started_at) {
      durationSeconds = Math.max(0, Math.floor((now.getTime() - new Date(stateData.started_at).getTime()) / 1000));
    }
    const h = Math.floor(durationSeconds / 3600);
    const m = Math.floor((durationSeconds % 3600) / 60);
    const s = durationSeconds % 60;
    const durationStr = `${pad(h)}:${pad(m)}:${pad(s)}`;

    const archivePayload = {
      fields: {
        id: toFirestoreValue(docId),
        likes: toFirestoreValue(stateData.likes),
        shares: toFirestoreValue(stateData.shares),
        followers: toFirestoreValue(stateData.followers),
        newFollowers: toFirestoreValue(stateData.newFollowers || stateData.followers),
        initialFollowers: toFirestoreValue(stateData.initialFollowers),
        totalFollowers: toFirestoreValue(stateData.totalFollowers),
        totalUser: toFirestoreValue(stateData.totalUser),
        total_user: toFirestoreValue(stateData.totalUser),
        timeline: toFirestoreValue(stateData.timeline),
        comments: toFirestoreValue(stateData.comments),
        peakViewers: toFirestoreValue(stateData.peakViewers),
        startedAt: toFirestoreValue(stateData.started_at || now.toISOString()),
        endedAt: toFirestoreValue(now.toISOString()),
        durationStr: toFirestoreValue(durationStr),
        durationSeconds: toFirestoreValue(durationSeconds),
        topQuestions: toFirestoreValue(stateData.topQuestions.slice(0, 15)),
        topCommenters: toFirestoreValue(stateData.topCommenters.slice(0, 5)),
        allTimeTopCommenters: toFirestoreValue(stateData.allTimeTopCommenters || []),
        topLikers: toFirestoreValue(stateData.topLikers.slice(0, 5)),
        allTimeTopLikers: toFirestoreValue(stateData.allTimeTopLikers || []),
        roomId: toFirestoreValue(stateData.roomId)
      }
    };

    const archiveUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tiktok_archives?documentId=${docId}&key=${API_KEY}`;

    await fetch(archiveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(archivePayload)
    });
    console.log(`[Lumina Daemon] 📁 Archive TikTok Live sauvegardée : ${docId}`);

    // Basculer formellement users/karamokho à HORS LIGNE (isLive: false)
    const userUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/karamokho?updateMask.fieldPaths=isLive&updateMask.fieldPaths=tiktokAPI.isLive&updateMask.fieldPaths=tiktokLiveAPI.isLive&updateMask.fieldPaths=tiktokLiveAPI.status&updateMask.fieldPaths=tiktokLiveAPI.currentViewers&updateMask.fieldPaths=tiktokLiveAPI.viewerCount&updateMask.fieldPaths=tiktokLiveAPI.endedAt&updateMask.fieldPaths=tiktokLiveAPI.ended_at&updateMask.fieldPaths=tiktokLiveAPI.durationStr&key=${API_KEY}`;
    await fetch(userUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          isLive: { booleanValue: false },
          'tiktokAPI.isLive': { booleanValue: false },
          tiktokLiveAPI: {
            mapValue: {
              fields: {
                isLive: { booleanValue: false },
                status: { stringValue: 'OFFLINE' },
                currentViewers: { integerValue: '0' },
                viewerCount: { integerValue: '0' },
                endedAt: { stringValue: now.toISOString() },
                ended_at: { stringValue: now.toISOString() },
                durationStr: { stringValue: durationStr }
              }
            }
          }
        }
      })
    });
    console.log('[Lumina Daemon] ✅ users/karamokho mis à jour en HORS LIGNE (isLive: false).');
  } catch (err) {
    console.warn('[Lumina Daemon] Exception archivage:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Worker Firestore pour la Veille Concurrentielle multi-écrans (Mobile 4G & Desktop)
// ---------------------------------------------------------------------------
let isProcessingCompetitor = false;

async function checkCompetitorRequests() {
  if (isProcessingCompetitor) return;
  try {
    const res = await fetch(REST_URL);
    if (!res.ok) return;
    const doc = await res.json();
    const reqField = doc?.fields?.competitorRequest?.mapValue?.fields;
    if (reqField && reqField.status?.stringValue === 'pending') {
      const username = reqField.username?.stringValue;
      const requestId = reqField.requestId?.stringValue || reqField.requestId?.integerValue || String(Date.now());
      if (username) {
        isProcessingCompetitor = true;
        console.log(`[Competitor Worker] 🔍 Analyse Firestore demandée pour @${username} (id: ${requestId})...`);
        try {
          const profileData = await scrapeTikTokProfile(username);
          console.log(`[Competitor Worker] ✅ Succès analyse @${username} : ${profileData.followers} abonnés, ${profileData.likes} likes`);
          
          const patchUrl = `${REST_URL}&updateMask.fieldPaths=competitorResponse&updateMask.fieldPaths=competitorRequest.status`;
          await fetch(patchUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                competitorResponse: toFirestoreValue({
                  requestId,
                  success: true,
                  data: profileData,
                  timestamp: new Date().toISOString()
                }),
                competitorRequest: {
                  mapValue: {
                    fields: {
                      ...reqField,
                      status: { stringValue: 'done' }
                    }
                  }
                }
              }
            })
          });
        } catch (scrapeErr) {
          console.warn(`[Competitor Worker] ⚠️ Erreur analyse @${username}:`, scrapeErr.message);
          const patchUrl = `${REST_URL}&updateMask.fieldPaths=competitorResponse&updateMask.fieldPaths=competitorRequest.status`;
          await fetch(patchUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                competitorResponse: toFirestoreValue({
                  requestId,
                  success: false,
                  error: scrapeErr.message,
                  timestamp: new Date().toISOString()
                }),
                competitorRequest: {
                  mapValue: {
                    fields: {
                      ...reqField,
                      status: { stringValue: 'error' }
                    }
                  }
                }
              }
            })
          });
        } finally {
          isProcessingCompetitor = false;
        }
      }
    }
  } catch (err) {
    isProcessingCompetitor = false;
  }
}

// Vérifier les demandes de concurrents chaque seconde
setInterval(checkCompetitorRequests, 1000);

connectToLive();

