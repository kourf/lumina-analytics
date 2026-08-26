import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { YouTubeHeader } from '../components/youtube/YouTubeHeader';
import { KpiCards } from '../components/youtube/KpiCards';
import { GrowthCharts } from '../components/youtube/GrowthCharts';
import { VideoPerformance } from '../components/youtube/VideoPerformance';
import { TopVideos } from '../components/youtube/TopVideos';
import { OptimizationOpps } from '../components/youtube/OptimizationOpps';
import { DataAvailability } from '../components/youtube/DataAvailability';
import { CompetitorInspiration } from '../components/youtube/CompetitorInspiration';
import { YouTubeConnect } from '../components/youtube/YouTubeConnect';
import { YouTubePrivateStats } from '../components/youtube/YouTubePrivateStats';
import { GoalsWidget } from '../components/youtube/GoalsWidget';
import { SponsorshipCalculator } from '../components/youtube/SponsorshipCalculator';
import { PublishRadar } from '../components/youtube/PublishRadar';
import { AILab } from '../components/youtube/AILab';
import { CompetitorKeywords } from '../components/youtube/CompetitorKeywords';
import { Loader2 } from 'lucide-react';

export const YouTubeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [youtubeToken, setYoutubeToken] = useState(null);

  const fetchYouTubeData = useCallback(async () => {
    try {
      const docRef = doc(db, 'users', 'karamokho');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().youtubeAPI) {
        const ytData = docSnap.data().youtubeAPI;
        if (ytData.videos) {
          ytData.videos = ytData.videos.filter(v => v.id !== '2kFVi1l41Eo');
        }
        if (ytData.topVideos) {
          ytData.topVideos = ytData.topVideos.filter(v => v.id !== '2kFVi1l41Eo');
        }
        if (ytData.weakVideos) {
          ytData.weakVideos = ytData.weakVideos.filter(v => v.id !== '2kFVi1l41Eo');
        }
        setData(ytData);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données YouTube:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYouTubeData();
  }, [fetchYouTubeData]);

  const handleManualRefresh = async () => {
    const response = await fetch('https://us-central1-lumina-analytics-kd-2026.cloudfunctions.net/forceSyncYouTube', {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la synchronisation avec YouTube');
    }
    
    await fetchYouTubeData();
  };

  const handleRemoveCompetitorLocal = (competitorId) => {
    setData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        competitors: prevData.competitors.filter(c => c.id !== competitorId)
      };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <Loader2 className="animate-spin w-12 h-12 mb-4" />
        <p className="font-medium">Analyse des données YouTube en cours...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="mb-2 font-medium">Aucune donnée YouTube disponible.</p>
        <p className="text-sm mb-6">La synchronisation initiale est peut-être en cours ou n'a pas encore été déclenchée.</p>
        <button 
          onClick={async () => {
            setLoading(true);
            try {
              await handleManualRefresh();
            } catch (err) {
              setLoading(false);
            }
          }}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
        >
          Lancer la synchronisation avec YouTube
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-24 animate-fade-in max-w-7xl mx-auto w-full">
      <YouTubeHeader channel={data.channel} onRefresh={handleManualRefresh} />
      
      <KpiCards channel={data.channel} videos={data.videos} analytics={data.analytics} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GrowthCharts channel={data.channel} videos={data.videos} />
        </div>
        <div className="lg:col-span-1">
          <GoalsWidget channel={data.channel} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SponsorshipCalculator videos={data.videos} channel={data.channel} />
        </div>
        <div className="lg:col-span-2">
          <PublishRadar />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopVideos videos={data.videos} />
        <OptimizationOpps videos={data.weakVideos} />
      </div>
      
      <VideoPerformance videos={data.videos} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AILab />
        <CompetitorKeywords competitors={data.competitors || []} />
      </div>

      <CompetitorInspiration 
        competitors={data.competitors || []} 
        onRefresh={handleManualRefresh} 
        onRemoveLocal={handleRemoveCompetitorLocal}
      />
      
      <YouTubeConnect onTokenReceived={setYoutubeToken} />
      {youtubeToken && <YouTubePrivateStats accessToken={youtubeToken} channelId={data.channel?.id} />}

      <DataAvailability />
    </div>
  );
};

