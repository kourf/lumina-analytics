import { describe, it, expect, vi } from 'vitest';

// Simuler les gestionnaires de webhooks / PubSub en émulant leur comportement assaini
describe('Validation & Parsing des Webhooks / PubSub', () => {
  it('devrait assainir correctement les identifiants de room Live TikTok', () => {
    const sanitizeRoomId = (rawId) => String(rawId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');
    expect(sanitizeRoomId('1234567890')).toBe('1234567890');
    expect(sanitizeRoomId('room_123-abc')).toBe('room_123-abc');
    expect(sanitizeRoomId('../eval(script)/123')).toBe('evalscript123');
    expect(sanitizeRoomId(null)).toBe('unknown');
  });

  it('devrait valider et parser correctement les payloads de message PubSub YouTube', () => {
    const parsePubSubMessage = (base64Data) => {
      if (!base64Data) throw new Error('Empty message');
      const dataBuffer = Buffer.from(base64Data, 'base64');
      const payload = JSON.parse(dataBuffer.toString('utf8'));
      if (!payload || typeof payload !== 'object') throw new Error('Invalid payload');

      const rawId = String(payload.resourceId || '');
      const liveId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!liveId) throw new Error('Invalid resourceId');

      const stats = payload.statistics || {};
      return {
        liveId,
        eventType: String(payload.eventType || 'unknown'),
        viewerCount: Math.max(0, Number(stats.viewerCount) || 0),
        likeCount: Math.max(0, Number(stats.likeCount) || 0),
        commentCount: Math.max(0, Number(stats.commentCount) || 0)
      };
    };

    const validPayload = {
      resourceId: 'yt_live_99',
      eventType: 'viewer_update',
      statistics: { viewerCount: '150', likeCount: '45', commentCount: '12' }
    };
    const base64Str = Buffer.from(JSON.stringify(validPayload)).toString('base64');

    const result = parsePubSubMessage(base64Str);
    expect(result).toEqual({
      liveId: 'yt_live_99',
      eventType: 'viewer_update',
      viewerCount: 150,
      likeCount: 45,
      commentCount: 12
    });
  });

  it('devrait rejeter les payloads PubSub YouTube malformés', () => {
    const parsePubSubMessage = (base64Data) => {
      const dataBuffer = Buffer.from(base64Data, 'base64');
      const payload = JSON.parse(dataBuffer.toString('utf8'));
      const rawId = String(payload.resourceId || '');
      const liveId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!liveId) throw new Error('Invalid resourceId');
      return liveId;
    };

    const invalidPayload = { resourceId: '!!!' };
    const base64Str = Buffer.from(JSON.stringify(invalidPayload)).toString('base64');

    expect(() => parsePubSubMessage(base64Str)).toThrow('Invalid resourceId');
  });
});
