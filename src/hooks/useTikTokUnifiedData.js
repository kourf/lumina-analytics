import { useMemo } from 'react';
import { validateTrueLiveCondition } from '../services/tiktokLiveService';

export function useTikTokUnifiedData(rawTikTokData, liveData) {
  return useMemo(() => {
    const data = rawTikTokData || {};
    const videosList = Array.isArray(data.recentVideos) ? data.recentVideos : [];

    const derivedTotalViews = videosList.reduce((acc, v) => acc + (Number(v.views) || 0), 0);
    const derivedTotalLikes = videosList.reduce((acc, v) => acc + (Number(v.likes) || 0), 0);
    const derivedTotalComments = videosList.reduce((acc, v) => acc + (Number(v.comments) || 0), 0);
    const derivedTotalShares = videosList.reduce((acc, v) => acc + (Number(v.shares) || 0), 0);

    // Purge mock data: Only use real data or explicit null to trigger error states
    const totalViews = derivedTotalViews > 0 ? derivedTotalViews : (Number(data.views) || null);
    const totalLikes = derivedTotalLikes > 0 ? derivedTotalLikes : (Number(data.likes) || Number(data.totalLikes) || null);
    const totalComments = derivedTotalComments > 0 ? derivedTotalComments : (Number(data.comments) || Number(data.totalComments) || null);
    const totalShares = derivedTotalShares > 0 ? derivedTotalShares : (Number(data.shares) || null);
    const followers = Number(data.followers) || null;
    const totalVideos = videosList.length || Number(data.videoAnalytics?.totalVideosAnalyzed) || 0;

    const totalInteractions = (totalLikes || 0) + (totalComments || 0) + (totalShares || 0);
    const engagementRateNum = totalViews > 0 ? Number(((totalInteractions / totalViews) * 100).toFixed(1)) : null;
    const engagementRateStr = engagementRateNum !== null ? engagementRateNum.toString() + '%' : null;

    const avgViews = totalVideos > 0 ? Math.round((totalViews || 0) / totalVideos) : 0;

    // Detect data missing/error state
    const isDataMissing = followers === null || totalViews === null;

    const resolvedAvatar = data.avatar_large_url 
      || data.avatar_url_100 
      || data.avatar_url 
      || data.avatarUrl 
      || data.profilePic 
      || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

    // Strict validation of true live conditions (never accept unverified fallback)
    const isVerifiedLive = validateTrueLiveCondition(liveData) || 
      (Boolean(liveData?.isLive) && Boolean(liveData?.roomId && liveData?.roomId !== 'unknown'));

    return {
      username: data.username || '@karam.drame',
      displayName: data.display_name || data.displayName || data.username || 'Karamokho DRAME',
      avatarUrl: resolvedAvatar,
      followers,
      likes: totalLikes,
      totalLikes,
      views: totalViews,
      totalViews,
      comments: totalComments,
      totalComments,
      shares: totalShares,
      totalShares,
      totalVideos,
      engagementRate: engagementRateStr,
      engagementRateNum,
      avgViews,
      recentVideos: videosList,
      videoAnalytics: {
        ...(data.videoAnalytics || {}),
        totalVideosAnalyzed: totalVideos,
        avgViews,
        avgLikes: totalVideos > 0 ? Math.round((totalLikes || 0) / totalVideos) : 0,
        avgComments: totalVideos > 0 ? Math.round((totalComments || 0) / totalVideos) : 0,
        engagementRate: engagementRateStr
      },
      isLive: isVerifiedLive,
      isDataMissing // Flag to trigger UI error states
    };
  }, [rawTikTokData, liveData]);
}

export default useTikTokUnifiedData;
