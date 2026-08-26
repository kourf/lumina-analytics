/**
 * Types et structures de données pour Instagram Analytics (@karam.drm)
 */

export const InstagramAccountType = {
  PERSONAL: 'PERSONAL',
  BUSINESS: 'BUSINESS',
  CREATOR: 'CREATOR',
  PUBLIC_EXTRACT: 'PUBLIC_EXTRACT'
};

export const InstagramMediaType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  CAROUSEL_ALBUM: 'CAROUSEL_ALBUM',
  REEL: 'REEL'
};

/**
 * Structure d'un média Instagram
 * @typedef {Object} InstagramMedia
 * @property {string} id
 * @property {string} caption
 * @property {string} mediaType - REEL, IMAGE, VIDEO, CAROUSEL_ALBUM
 * @property {string} mediaUrl
 * @property {string} permalink
 * @property {string} [thumbnailUrl]
 * @property {string} timestamp
 * @property {number} likeCount
 * @property {number} commentsCount
 * @property {number} [reach]
 * @property {number} [impressions]
 * @property {number} [saved]
 * @property {number} [shares]
 * @property {number} [plays]
 * @property {number} engagementRate
 */

/**
 * Structure de données du profil
 * @typedef {Object} InstagramProfile
 * @property {string} [id]
 * @property {string} username
 * @property {string} name
 * @property {string} biography
 * @property {string} profilePictureUrl
 * @property {string} [website]
 * @property {number} followersCount
 * @property {number} followsCount
 * @property {number} mediaCount
 * @property {string} accountType
 * @property {boolean} isConnectedViaMeta
 * @property {string} [externalUrl]
 */

/**
 * Structure globale des insights Instagram
 * @typedef {Object} InstagramData
 * @property {InstagramProfile} profile
 * @property {Object} insights
 * @property {InstagramMedia[]} [insights.recentMedia]
 * @property {InstagramMedia[]} [insights.topPerformingMedia]
 * @property {number} insights.totalLikes
 * @property {number} insights.totalComments
 * @property {number} insights.totalSaves
 * @property {number} insights.totalShares
 * @property {number} insights.totalReach
 * @property {number} insights.totalImpressions
 * @property {number} insights.averageEngagementRate
 * @property {string} insights.lastSyncedAt
 */
