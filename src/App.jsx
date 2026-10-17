import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { db } from './config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import PinScreen from './components/PinScreen';
import { useTikTokLiveStatus } from './hooks/useTikTokLiveStatus';

// Code-Splitting / Dynamic Imports des pages tableaux de bord
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const YouTubeDashboard = lazy(() => import('./pages/YouTubeDashboard').then(m => ({ default: m.YouTubeDashboard })));
const InstagramDashboard = lazy(() => import('./pages/InstagramDashboard').then(m => ({ default: m.InstagramDashboard })));
const TikTokDashboard = lazy(() => import('./pages/TikTokDashboard').then(m => ({ default: m.TikTokDashboard })));
const LinkedInDashboard = lazy(() => import('./pages/LinkedInDashboard').then(m => ({ default: m.LinkedInDashboard })));
const WebsiteDashboard = lazy(() => import('./pages/WebsiteDashboard').then(m => ({ default: m.WebsiteDashboard })));
const DiscordDashboard = lazy(() => import('./pages/DiscordDashboard').then(m => ({ default: m.DiscordDashboard })));
const TwitchDashboard = lazy(() => import('./pages/TwitchDashboard').then(m => ({ default: m.TwitchDashboard })));
const Insights = lazy(() => import('./pages/Insights').then(m => ({ default: m.Insights })));

const JARVIS_PHRASES = [
  "Bonjour Karamokho. Analyse de vos performances en cours...",
  "Initialisation des systèmes tactiques sociaux...",
  "Extraction des données d'engagement en temps réel...",
  "Compilation de vos métriques de croissance, veuillez patienter...",
  "Bonjour Monsieur. Synchronisation avec vos plateformes..."
];

// Fallback skeleton loader pendant le chargement dynamique d'un tableau de bord
function DashboardLoader() {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto" role="status" aria-label="Chargement du tableau de bord">
      <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/4 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        ))}
      </div>
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl mt-6"></div>
    </div>
  );
}

function App() {
  const [isUnlocked, setIsUnlocked] = useState(() => sessionStorage.getItem('isUnlocked') === 'true');
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPhrase] = useState(() => JARVIS_PHRASES[Math.floor(Math.random() * JARVIS_PHRASES.length)]);

  // Détection TikTok Live globale 24/7 au niveau racine de l'application
  const globalLiveChecker = useTikTokLiveStatus('karam.drame', {
    autoCheck: true,
    pollInterval: 15000,
    initialData: appData?.tiktokLiveAPI
  });

  // Détection TikTok Live globale :
  // 1. Si Firestore (alimenté par le daemon backend) confirme isLive === true, c'est LIVE en temps réel sur PC et Mobile.
  // 2. Si le checker Edge confirme LIVE, c'est LIVE.
  // 3. Ne jamais bloquer le live sur mobile à cause d'un proxy CORS tiers défaillant.
  const isGlobalTikTokLive = Boolean(
    appData?.tiktokLiveAPI?.isLive === true ||
    (globalLiveChecker.status === 'LIVE' && globalLiveChecker.isLive)
  );

  useEffect(() => {
    let unsubscribe;

    async function initData() {
      try {
        let baseData = {};
        try {
          const response = await fetch('/api/data.json');
          if (response.ok) {
            baseData = await response.json();
          }
        } catch (e) {
          console.error("Erreur mockData:", e);
        }

        const docRef = doc(db, 'users', 'karamokho');
        
        // Listener temps réel Firestore
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const firebaseData = docSnap.data();
            // Purge mock data: Only use real Firestore/API data, no baseData fallbacks for lists/archives
            const historyArchivesList = firebaseData.historyArchives || firebaseData.tiktokLiveAPI?.historyArchives || [];
            
            const realRecentVideos = (firebaseData.tiktokAPI?.recentVideos && firebaseData.tiktokAPI.recentVideos.length > 0)
              ? firebaseData.tiktokAPI.recentVideos
              : (firebaseData.recentVideos && firebaseData.recentVideos.length > 0)
                ? firebaseData.recentVideos
                : [];

            const tiktokCombined = {
              ...(firebaseData.tiktok || {}),
              ...(firebaseData.tiktokAPI || {}),
              isLive: Boolean(firebaseData.tiktokLiveAPI?.isLive === true && (firebaseData.tiktokLiveAPI?.status === 2 || firebaseData.tiktokLiveAPI?.roomId)),
              recentVideos: realRecentVideos,
              followers: firebaseData.tiktokAPI?.followers ?? firebaseData.tiktok?.followers ?? 6392,
              likes: firebaseData.tiktokAPI?.likes ?? firebaseData.tiktok?.likes ?? 17100,
              totalLikes: firebaseData.tiktokAPI?.totalLikes ?? firebaseData.tiktok?.totalLikes ?? 17100,
              views: firebaseData.tiktokAPI?.views ?? firebaseData.tiktok?.views ?? 298809,
              shares: firebaseData.tiktokAPI?.shares ?? firebaseData.tiktok?.shares ?? 798,
              totalVideos: firebaseData.tiktokAPI?.totalVideos ?? firebaseData.tiktok?.totalVideos ?? realRecentVideos.length ?? 75,
              lastSync: firebaseData.tiktokAPI?.lastSync || firebaseData.lastSync || new Date().toISOString(),
              avatar_url: firebaseData.tiktokAPI?.avatar_url || firebaseData.tiktok?.avatar_url || "https://www.tiktok.com/api/img/?userId=7030929632657638405&location=2&aid=1988"
            };

            const liveRaw = firebaseData.tiktokLiveAPI || {};
            const tiktokLiveClean = {
              ...liveRaw,
              isLive: Boolean((liveRaw.isLive === true || firebaseData.isLive === true) && firebaseData.isLive !== false),
              status: liveRaw.status || (liveRaw.isLive ? 'LIVE' : 'OFFLINE'),
              currentViewers: Number(liveRaw.currentViewers || 0),
              peakViewers: Number(liveRaw.peakViewers || 0),
              totalUser: Number(liveRaw.totalUser || liveRaw.total_user || liveRaw.enter_count || liveRaw.cumulative_audience || 0),
              cumulative_audience: Number(liveRaw.cumulative_audience || liveRaw.totalUser || liveRaw.total_user || liveRaw.enter_count || 0),
              likes: Number(liveRaw.likes ?? liveRaw.totalLikes ?? liveRaw.likeCount ?? 0),
              totalLikes: Number(liveRaw.totalLikes ?? liveRaw.likes ?? liveRaw.likeCount ?? 0),
              shares: Number(liveRaw.shares ?? liveRaw.totalShares ?? liveRaw.shareCount ?? 0),
              totalShares: Number(liveRaw.totalShares ?? liveRaw.shares ?? liveRaw.shareCount ?? 0),
              followers: Number(liveRaw.followers ?? liveRaw.newFollowers ?? liveRaw.followCount ?? 0),
              newFollowers: Number(liveRaw.newFollowers ?? liveRaw.followers ?? liveRaw.followCount ?? 0),
              diamonds: Number(liveRaw.diamonds ?? liveRaw.totalDiamonds ?? 0),
              totalDiamonds: Number(liveRaw.totalDiamonds ?? liveRaw.diamonds ?? 0),
              comments: Number(liveRaw.comments ?? liveRaw.totalComments ?? 0),
              roomId: liveRaw.roomId || '',
              title: liveRaw.title || '',
              startedAt: liveRaw.started_at || liveRaw.startedAt || null,
              started_at: liveRaw.started_at || liveRaw.startedAt || null,
              timeline: Array.isArray(liveRaw.timeline) ? liveRaw.timeline : [],
              viewersHistory: Array.isArray(liveRaw.viewersHistory) ? liveRaw.viewersHistory : [],
              history: liveRaw.history || [],
              historyArchives: historyArchivesList,
              topQuestions: liveRaw.topQuestions || [],
              topChatters: Array.isArray(liveRaw.topChatters) ? liveRaw.topChatters : (Array.isArray(liveRaw.topCommenters) ? liveRaw.topCommenters : []),
              topCommenters: Array.isArray(liveRaw.topCommenters) ? liveRaw.topCommenters : (Array.isArray(liveRaw.topChatters) ? liveRaw.topChatters : []),
              topContributors: liveRaw.topContributors || [],
              topContributor: liveRaw.topContributor || null,
              topDonator: liveRaw.topDonator || null,
              recentComments: liveRaw.recentComments || [],
              thematicTopics: Array.isArray(liveRaw.thematicTopics) ? liveRaw.thematicTopics : [],
              allTimeTopCommenters: Array.isArray(liveRaw.allTimeTopCommenters) ? liveRaw.allTimeTopCommenters : [],
              topLikers: Array.isArray(liveRaw.topLikers) ? liveRaw.topLikers : [],
              allTimeTopLikers: Array.isArray(liveRaw.allTimeTopLikers) ? liveRaw.allTimeTopLikers : [],
              lastDetected: liveRaw.lastDetected || null,
              workerLastHeartbeat: liveRaw.workerLastHeartbeat || null
            };

            const mergedData = {
              ...baseData,
              ...firebaseData,
              historyArchives: historyArchivesList,
              tiktok: tiktokCombined,
              tiktokAPI: tiktokCombined,
              tiktokLiveAPI: tiktokLiveClean
            };
            setAppData(mergedData);
          } else {
            setAppData(baseData);
          }
          setLoading(false);
        }, (error) => {
          console.error("Erreur onSnapshot:", error);
          setAppData(baseData);
          setLoading(false);
        });

      } catch (error) {
        console.error("Erreur d'initialisation:", error);
        setLoading(false);
      }
    }

    initData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (!isUnlocked) {
    return <PinScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  if (loading || !appData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-lumina-light dark:bg-lumina-dark transition-colors duration-300 px-6 text-center" role="status" aria-live="polite">
        <div className="w-16 h-16 border-4 border-lumina-primary/20 dark:border-lumina-primary/10 border-t-lumina-primary dark:border-t-lumina-primaryHover rounded-full animate-spin mb-8 shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
        <p className="text-[15px] font-medium text-gray-700 dark:text-gray-300 tracking-wide leading-relaxed animate-pulse">
          {loadingPhrase}
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<DashboardLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <Layout
                isTikTokLive={isGlobalTikTokLive}
                isTwitchLive={Boolean(appData?.twitchLiveAPI?.isLive)}
                isYouTubeLive={Boolean(appData?.youtubeLiveAPI?.isLive)}
              />
            }
          >
            <Route index element={<Dashboard data={appData} />} />
            <Route path="youtube" element={<YouTubeDashboard data={appData.youtube} />} />
            <Route path="website" element={<WebsiteDashboard />} />
            <Route path="instagram" element={<InstagramDashboard />} />
            <Route path="tiktok" element={
              <TikTokDashboard
                data={appData.tiktokAPI || appData.tiktok || null}
                auth={appData.tiktokAuth}
                liveData={{
                  ...(appData.tiktokLiveAPI || {}),
                  isLive: isGlobalTikTokLive,
                  roomId: appData?.tiktokLiveAPI?.roomId || globalLiveChecker.roomId || '',
                  currentViewers: isGlobalTikTokLive
                    ? (appData?.tiktokLiveAPI?.currentViewers !== undefined && Number(appData?.tiktokLiveAPI?.currentViewers) > 0
                        ? Number(appData.tiktokLiveAPI.currentViewers)
                        : Number(globalLiveChecker.viewerCount || 0))
                    : 0
                }}
              />
            } />
            <Route path="twitch" element={<TwitchDashboard data={appData} />} />
            <Route path="linkedin" element={<LinkedInDashboard />} />
            <Route path="discord" element={
              <DiscordDashboard
                data={{
                  ...(appData.discordData || appData.discord || {}),
                  autoBroadcastEnabled: appData.autoBroadcastEnabled,
                  discordWebhookUrl: appData.discordWebhookUrl,
                  discordBotWebhookUrl: appData.discordBotWebhookUrl,
                  lastDiscordAlertRoomId: appData.lastDiscordAlertRoomId,
                  lastDiscordAlertSessionKey: appData.lastDiscordAlertSessionKey,
                  lastDiscordAlertMessageId: appData.lastDiscordAlertMessageId,
                  lastDiscordAlertEndedEdited: appData.lastDiscordAlertEndedEdited,
                  tiktokLiveAPI: {
                    ...(appData.tiktokLiveAPI || {}),
                    isLive: isGlobalTikTokLive,
                    roomId: appData?.tiktokLiveAPI?.roomId || globalLiveChecker.roomId || '',
                    currentViewers: isGlobalTikTokLive
                      ? (Number(appData?.tiktokLiveAPI?.currentViewers || 0) || Number(globalLiveChecker.viewerCount || 0))
                      : 0
                  },
                  youtubeLiveAPI: appData.youtubeLiveAPI || null,
                  twitchLiveAPI: appData.twitchLiveAPI || null,
                  youtubeAPI: appData.youtubeAPI || null,
                  tiktokAPI: appData.tiktokAPI || null
                }}
              />
            } />
            <Route path="insights" element={<Insights data={appData} />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
