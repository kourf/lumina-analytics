import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'lumina-analytics-kd-2026',
  apiKey: 'AIzaSyCOggZGYa8yhu8fYv30Yw1vvA09EH27zyc',
  appId: '1:766102727241:web:670178653dfc59d24aad98',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function archiveAndSetOffline() {
  try {
    const userRef = doc(db, 'users', 'karamokho');
    const snap = await getDoc(userRef);
    const data = snap.data() || {};
    const liveApi = data.tiktokLiveAPI || {};

    const startedAt = liveApi.startedAt || liveApi.started_at || '2026-10-12T17:15:21.512Z';
    const endedAt = new Date().toISOString();
    const startMs = new Date(startedAt).getTime();
    const endMs = new Date(endedAt).getTime();
    const diffSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;
    const durationStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const archiveId = 'live_20261012_7695846892931910422';
    const archiveData = {
      id: archiveId,
      title: liveApi.title || 'Live TikTok @karam.drame',
      startedAt,
      endedAt,
      ended_at: endedAt,
      durationStr,
      duration_seconds: diffSec,
      peakViewers: Number(liveApi.peakViewers || 48),
      replayViewers: Number(liveApi.cumulative_audience || liveApi.total_user || liveApi.totalUser || 642),
      enter_count: Number(liveApi.cumulative_audience || liveApi.total_user || liveApi.totalUser || 642),
      totalUser: Number(liveApi.cumulative_audience || liveApi.total_user || liveApi.totalUser || 642),
      cumulative_audience: Number(liveApi.cumulative_audience || liveApi.total_user || liveApi.totalUser || 642),
      likes: Number(liveApi.totalLikes || liveApi.likes || 1480),
      totalLikes: Number(liveApi.totalLikes || liveApi.likes || 1480),
      shares: Number(liveApi.totalShares || liveApi.shareCount || liveApi.shares || 2),
      totalShares: Number(liveApi.totalShares || liveApi.shareCount || liveApi.shares || 2),
      newFollowers: Number(liveApi.newFollowers || 4),
      topQuestions: Array.isArray(liveApi.topQuestions) ? liveApi.topQuestions : [],
      topCommenters: Array.isArray(liveApi.topCommenters) ? liveApi.topCommenters : [],
      archivedAt: endedAt,
      status: 'COMPLETED'
    };

    console.log('Archiving session to tiktok_archives/' + archiveId);
    await setDoc(doc(db, 'tiktok_archives', archiveId), archiveData, { merge: true });
    console.log('✅ Session live archivée avec succès !');

    console.log('Mise à jour de users/karamokho en HORS LIGNE (OFFLINE)...');
    await updateDoc(userRef, {
      isLive: false,
      'tiktokAPI.isLive': false,
      'tiktokLiveAPI.isLive': false,
      'tiktokLiveAPI.status': 'OFFLINE',
      'tiktokLiveAPI.currentViewers': 0,
      'tiktokLiveAPI.viewerCount': 0,
      'tiktokLiveAPI.roomId': '',
      'tiktokLiveAPI.endedAt': endedAt,
      'tiktokLiveAPI.durationStr': durationStr,
      'tiktokLiveAPI.lastChecked': endedAt
    });

    console.log('✅ users/karamokho est maintenant 100% HORS LIGNE !');
  } catch (error) {
    console.error('Erreur :', error);
  }
  process.exit(0);
}

archiveAndSetOffline();
