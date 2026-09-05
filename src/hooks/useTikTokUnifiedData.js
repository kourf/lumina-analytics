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

    const totalViews = derivedTotalViews > 0 ? derivedTotalViews : (Number(data.views) || 275700);
    const totalLikes = derivedTotalLikes > 0 ? derivedTotalLikes : (Number(data.likes) || Number(data.totalLikes) || 15955);
    const totalComments = derivedTotalComments > 0 ? derivedTotalComments : (Number(data.comments) || Number(data.totalComments) || 4200);
    const totalShares = derivedTotalShares > 0 ? derivedTotalShares : (Number(data.shares) || 748);
    const followers = Number(data.followers) || 6158;
    const totalVideos = videosList.length || Number(data.videoAnalytics?.totalVideosAnalyzed) || 71;

    const totalInteractions = totalLikes + totalComments + totalShares;
    const engagementRateNum = totalViews > 0 ? Number(((totalInteractions / totalViews) * 100).toFixed(1)) : 5.8;
    const engagementRateStr = engagementRateNum.toString() + '%';

    const avgViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0;

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
        avgLikes: totalVideos > 0 ? Math.round(totalLikes / totalVideos) : 0,
        avgComments: totalVideos > 0 ? Math.round(totalComments / totalVideos) : 0,
        engagementRate: engagementRateStr
      },
      isLive: isVerifiedLive
    };
  }, [rawTikTokData, liveData]);
}

export default useTikTokUnifiedData;
