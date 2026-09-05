import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  sanitizeTikTokUsername, 
  validateTrueLiveCondition, 
  verifyTikTokLiveStatus, 
  clearTikTokLiveCache, 
  LIVE_STATUS 
} from './tiktokLiveService';

describe('TikTok Live Status Detection Suite', () => {
  beforeEach(() => {
    clearTikTokLiveCache();
    vi.restoreAllMocks();
  });

  describe('1. sanitizeTikTokUsername', () => {
    it('should strip leading @ from handles', () => {
      expect(sanitizeTikTokUsername('@jkaram')).toBe('jkaram');
      expect(sanitizeTikTokUsername('@@jkaram')).toBe('jkaram');
    });

    it('should handle full TikTok profile URLs with query parameters', () => {
      expect(sanitizeTikTokUsername('https://www.tiktok.com/@jkaram?lang=fr&is_from_webapp=1')).toBe('jkaram');
      expect(sanitizeTikTokUsername('https://tiktok.com/@karam.drame#live')).toBe('karam.drame');
    });

    it('should normalize case and remove forbidden characters', () => {
      expect(sanitizeTikTokUsername('  JKARAM  ')).toBe('jkaram');
      expect(sanitizeTikTokUsername('jkaram<script>alert(1)</script>')).toBe('jkaramscriptalert1script');
    });

    it('should return empty string for null or non-string inputs', () => {
      expect(sanitizeTikTokUsername(null)).toBe('');
      expect(sanitizeTikTokUsername(undefined)).toBe('');
      expect(sanitizeTikTokUsername(12345)).toBe('');
    });
  });

  describe('2. validateTrueLiveCondition', () => {
    it('should return true ONLY when roomId is valid and status === 2', () => {
      const activeStream = {
        roomId: '73921839218392',
        status: 2,
        user_count: 142
      };
      expect(validateTrueLiveCondition(activeStream)).toBe(true);
    });

    it('should return false when status !== 2 (e.g. status 4 = stream ended)', () => {
      const endedStream = {
        roomId: '73921839218392',
        status: 4,
        user_count: 0
      };
      expect(validateTrueLiveCondition(endedStream)).toBe(false);
    });

    it('should return false when roomId is missing, empty, or unknown', () => {
      expect(validateTrueLiveCondition({ roomId: '', status: 2 })).toBe(false);
      expect(validateTrueLiveCondition({ roomId: 'unknown', status: 2 })).toBe(false);
      expect(validateTrueLiveCondition({ roomId: '0', status: 2 })).toBe(false);
      expect(validateTrueLiveCondition({ status: 2 })).toBe(false);
    });

    it('should return false for null, undefined, or empty payload', () => {
      expect(validateTrueLiveCondition(null)).toBe(false);
      expect(validateTrueLiveCondition({})).toBe(false);
      expect(validateTrueLiveCondition('invalid')).toBe(false);
    });
  });

  describe('3. verifyTikTokLiveStatus (Fail-Safe & Dynamic Logic)', () => {
    it('should confirm LIVE state when API returns status 2', async () => {
      const mockResponse = {
        room: {
          roomId: '76891234567890',
          status: 2,
          user_count: 54,
          title: 'Live Session • Coding',
          create_time: Math.floor(Date.now() / 1000) - 300,
          owner: { nickname: 'JKaram Stream' }
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await verifyTikTokLiveStatus('jkaram');

      expect(result.status).toBe(LIVE_STATUS.LIVE);
      expect(result.isLive).toBe(true);
      expect(result.roomId).toBe('76891234567890');
      expect(result.viewerCount).toBe(54);
      expect(result.displayName).toBe('JKaram Stream');
      expect(result.error).toBeNull();
    });

    it('should return OFFLINE when API confirms no active live stream', async () => {
      const mockResponse = {
        room: null,
        isLive: false,
        displayName: 'JKaram'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await verifyTikTokLiveStatus('jkaram');

      expect(result.status).toBe(LIVE_STATUS.OFFLINE);
      expect(result.isLive).toBe(false);
      expect(result.roomId).toBeNull();
      expect(result.viewerCount).toBe(0);
    });

    it('CRITICAL: must default to STATUS_UNKNOWN (never LIVE) on HTTP 429 rate limit', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const result = await verifyTikTokLiveStatus('jkaram');

      expect(result.status).toBe(LIVE_STATUS.STATUS_UNKNOWN);
      expect(result.isLive).toBe(false); // MUST NOT BE TRUE!
      expect(result.error).toContain('429');
    });

    it('CRITICAL: must default to STATUS_UNKNOWN (never LIVE) on HTTP 403 Forbidden', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const result = await verifyTikTokLiveStatus('jkaram');

      expect(result.status).toBe(LIVE_STATUS.STATUS_UNKNOWN);
      expect(result.isLive).toBe(false); // MUST NOT BE TRUE!
      expect(result.error).toContain('403');
    });

    it('CRITICAL: must default to STATUS_UNKNOWN (never LIVE) on network timeout or exception', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network connection timeout'));

      const result = await verifyTikTokLiveStatus('jkaram');

      expect(result.status).toBe(LIVE_STATUS.STATUS_UNKNOWN);
      expect(result.isLive).toBe(false); // MUST NOT BE TRUE!
      expect(result.error).toContain('Network connection timeout');
    });

    it('should return OFFLINE when profile returns HTTP 404 (user not found / no live)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await verifyTikTokLiveStatus('jkaram');

      expect(result.status).toBe(LIVE_STATUS.OFFLINE);
      expect(result.isLive).toBe(false);
    });
  });

  describe('4. SWR 60-Second Cache Validation', () => {
    it('should serve from cache within 60s TTL and not make duplicate network requests', async () => {
      const mockResponse = {
        room: {
          roomId: '9988776655',
          status: 2,
          user_count: 88,
        }
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });
      global.fetch = fetchSpy;

      // 1st call: network fetch
      const result1 = await verifyTikTokLiveStatus('jkaram');
      expect(result1.fromCache).toBe(false);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // 2nd call immediately: should hit SWR cache
      const result2 = await verifyTikTokLiveStatus('jkaram');
      expect(result2.fromCache).toBe(true);
      expect(result2.viewerCount).toBe(88);
      expect(fetchSpy).toHaveBeenCalledTimes(1); // No new network call!

      // 3rd call with forceRefresh: true bypasses cache
      const result3 = await verifyTikTokLiveStatus('jkaram', { forceRefresh: true });
      expect(result3.fromCache).toBe(false);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
