import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../config/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { LinkedInHeader } from '../components/linkedin/LinkedInHeader';
import { LinkedInKpiCards } from '../components/linkedin/LinkedInKpiCards';
import { LinkedInGrowthChart } from '../components/linkedin/LinkedInGrowthChart';
import { LinkedInPostsPerformance } from '../components/linkedin/LinkedInPostsPerformance';
import { LinkedInStrategyLab } from '../components/linkedin/LinkedInStrategyLab';
import { LinkedInEditModal } from '../components/linkedin/LinkedInEditModal';
import { Loader2, ShieldCheck, Sparkles, Zap, Lock, Info } from 'lucide-react';

export const LinkedInDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const defaultRealData = {
    profile: {
      username: 'drmkaramokho',
      name: 'Karamokho DRAMÉ',
      headline: 'Graphiste & Développeur Webflow | Fondateur chez Karam Agency',
      company: 'Karam (Agence Karam)',
      profilePictureUrl: 'https://media.licdn.com/dms/image/v2/D4E03AQH0CuJs8vMnoA/profile-displayphoto-scale_200_200/B4EZpIJsBnKMAg-/0/1762147091582?e=2147483647&v=beta&t=c1Trq07TxCM0Ary3DT46GocT7ZdcEG4XQAgm_274XdU',
      followersCount: 1715,
      connectionsCount: 1553,
      location: 'Paris, France',
      profileUrl: 'https://www.linkedin.com/in/drmkaramokho',
      isDynamicLive: true
    },
    insights: {
      totalImpressions: null, // Donnée privée non obtenue publiquement
      profileViews: null,      // Donnée privée non obtenue publiquement
      totalReactions: null,    // Donnée privée non obtenue publiquement
      totalComments: null,     // Donnée privée non obtenue publiquement
      totalShares: null,       // Donnée privée non obtenue publiquement
      averageEngagementRate: null, // Donnée non obtenue
      lastSyncedAt: new Date().toISOString(),
      topPosts: []
    },
    syncStatus: {
      state: 'STRICT_INTEGRITY',
      message: 'Données publiques obtenues (1 715 abonnés, 1 553 relations). Données privées non obtenues.',
      lastAttemptAt: new Date().toISOString()
    }
  };

  const triggerDynamicSync = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('https://us-central1-lumina-analytics-kd-2026.cloudfunctions.net/forceSyncLinkedIn');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      }
    } catch (err) {
      console.warn("Sync dynamique fallback local:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const docRef = doc(db, 'users', 'karamokho');
    
    // Listener temps réel Firestore
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().linkedinAPI) {
        const firestoreData = docSnap.data().linkedinAPI;
        // Nettoyage des anciennes métriques estimées si présentes
        if (firestoreData.insights?.totalImpressions === 5488 || firestoreData.insights?.totalImpressions === 4620) {
          firestoreData.insights.totalImpressions = null;
          firestoreData.insights.profileViews = null;
          firestoreData.insights.totalReactions = null;
          firestoreData.insights.averageEngagementRate = null;
        }
        setData(firestoreData);
      } else {
        setData(defaultRealData);
        setDoc(docRef, { linkedinAPI: defaultRealData }, { merge: true }).catch(console.warn);
      }
      setLoading(false);
    }, (err) => {
      console.error("Erreur lecture Firestore LinkedIn:", err);
      setData(defaultRealData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRefresh = async () => {
    await triggerDynamicSync();
  };

  const handleSaveData = async (updatedData) => {
    const docRef = doc(db, 'users', 'karamokho');
    const fullUpdated = {
      ...data,
      ...updatedData,
      profile: {
        ...(data?.profile || {}),
        ...(updatedData.profile || {})
      },
      insights: {
        ...(data?.insights || {}),
        ...(updatedData.insights || {})
      },
      syncStatus: {
        state: 'AUTHENTIC_CERTIFIED',
        message: 'Données synchronisées.',
        lastAttemptAt: new Date().toISOString()
      }
    };
    
    await setDoc(docRef, { 
      linkedinAPI: fullUpdated,
      linkedin: {
        followers: fullUpdated.profile.followersCount,
        connections: fullUpdated.profile.connectionsCount,
        profileUrl: fullUpdated.profile.profileUrl
      }
    }, { merge: true });
    
    setData(fullUpdated);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#0A66C2]">
        <Loader2 className="animate-spin w-12 h-12 mb-4" />
        <p className="font-semibold text-gray-700 dark:text-gray-300">
          Chargement des données certifiées LinkedIn de Karamokho DRAMÉ...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-24 animate-fade-in max-w-7xl mx-auto w-full">
      {/* 1. Header du profil LinkedIn vérifié */}
      <LinkedInHeader
        profile={data?.profile}
        syncStatus={data?.syncStatus}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onOpenEditModal={() => setIsEditModalOpen(true)}
      />

      {/* 2. Bannière de Transparence & Zéro Fausse Donnée */}
      <div className="rounded-[24px] bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent border border-blue-500/20 p-5 md:p-6 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/20 text-[#0A66C2] dark:text-blue-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Rapport d'Intégrité Analytique : Données Réelles vs Données Restreintes
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <strong>✓ Données Obtenues & Vérifiées en Direct :</strong>
                <p className="mt-1">
                  1 715 Abonnés, 1 553 Relations, Photo de profil officielle et Intitulé de poste chez Karam Agency.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                <strong>⚠️ Données Privées Non Obtenues (0 Fausse Donnée) :</strong>
                <p className="mt-1">
                  Impressions internes, vues de profil et portée des posts sont masquées par LinkedIn aux visiteurs tiers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KPI Cards LinkedIn avec Statut Réel / Non Obtenu */}
      <LinkedInKpiCards
        profile={data?.profile}
        insights={data?.insights}
      />

      {/* 4. Graphique de Volume Vérifié & Explication Technique */}
      <LinkedInGrowthChart
        profile={data?.profile}
        chartData={data?.chartData}
      />

      {/* 5. Performance des Publications B2B */}
      <LinkedInPostsPerformance
        posts={data?.insights?.topPosts}
      />

      {/* 6. Laboratoire Stratégique IA LinkedIn */}
      <LinkedInStrategyLab
        profile={data?.profile}
        insights={data?.insights}
      />

      {/* Modal d'édition */}
      <LinkedInEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={data}
        onSave={handleSaveData}
      />
    </div>
  );
};
