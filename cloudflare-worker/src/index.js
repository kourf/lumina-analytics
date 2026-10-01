const FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/lumina-analytics-kd-2026/databases/(default)/documents/users/karamokho';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function updateFirestoreLive(liveData) {
  const fields = {
    'tiktokLiveAPI.isLive': { booleanValue: Boolean(liveData.isLive) },
    'tiktokLiveAPI.roomId': { stringValue: String(liveData.roomId || '') },
    'tiktokLiveAPI.title': { stringValue: String(liveData.title || (liveData.isLive ? 'Live TikTok en cours' : '')) },
    'tiktokLiveAPI.currentViewers': { integerValue: Number(liveData.currentViewers || 0) },
    'tiktokLiveAPI.peakViewers': { integerValue: Number(liveData.peakViewers || 0) },
    'tiktokLiveAPI.totalUser': { integerValue: Number(liveData.totalUser || 0) },
    'tiktokLiveAPI.likes': { integerValue: Number(liveData.likes || 0) },
    'tiktokLiveAPI.comments': { integerValue: Number(liveData.comments || 0) },
    'tiktokLiveAPI.shares': { integerValue: Number(liveData.shares || 0) },
    'tiktokLiveAPI.followers': { integerValue: Number(liveData.followers || 0) },
    'tiktokLiveAPI.lastDetected': { stringValue: new Date().toISOString() },
    'tiktokAPI.isLive': { booleanValue: Boolean(liveData.isLive) },
    'isLive': { booleanValue: Boolean(liveData.isLive) }
  };

  if (liveData.isLive && liveData.startedAt) {
    fields['tiktokLiveAPI.startedAt'] = { stringValue: String(liveData.startedAt) };
    fields['tiktokLiveAPI.started_at'] = { stringValue: String(liveData.startedAt) };
  } else if (!liveData.isLive) {
    fields['tiktokLiveAPI.startedAt'] = { nullValue: null };
    fields['tiktokLiveAPI.started_at'] = { nullValue: null };
  }

  const updateMask = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const url = `${FIRESTORE_URL}?${updateMask}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });

  return res.ok;
}

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tiktok-signature'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    // 1. TikTok Webhook Challenge Verification (GET)
    if (request.method === 'GET') {
      const challenge = url.searchParams.get('challenge');
      if (challenge) {
        return new Response(challenge, {
          status: 200,
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        });
      }

      // Endpoint temps réel /live-status pour interroger TikTok Webcast à la demande
      if (url.pathname === '/live-status' || url.pathname === '/api/live') {
        try {
          const profileRes = await fetch('https://www.tiktok.com/@karam.drame', {
            headers: {
              'User-Agent': USER_AGENT,
              'Accept': 'text/html',
              'Accept-Language': 'fr-FR,fr;q=0.9',
              'Cache-Control': 'no-cache'
            }
          });

          let roomId = '';
          if (profileRes.ok) {
            const html = await profileRes.text();
            const idx = html.indexOf('__UNIVERSAL_DATA_FOR_REHYDRATION__');
            if (idx !== -1) {
              try {
                const tagClose = html.indexOf('>', idx);
                const endTag = html.indexOf('</script>', tagClose);
                const json = JSON.parse(html.substring(tagClose + 1, endTag));
                const rId = json.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.user?.roomId;
                if (rId && String(rId) !== '0') {
                  roomId = String(rId);
                }
              } catch (e) {}
            }

            if (!roomId) {
              const match = html.match(/"roomId"\s*:\s*"?(\d+)"?/);
              if (match && match[1] && match[1] !== '0') {
                roomId = match[1];
              }
            }
          }

          // Si aucun roomId n'est présent sur le profil de Karam, il n'est PAS en live
          if (!roomId) {
            const notLivePayload = {
              isLive: false,
              roomId: '',
              title: 'Aucun direct en cours',
              currentViewers: 0,
              peakViewers: 0,
              totalUser: 602,
              likes: 0,
              comments: 0,
              shares: 0,
              followers: 0
            };
            ctx.waitUntil(updateFirestoreLive(notLivePayload));

            return new Response(JSON.stringify({
              status: 'offline',
              data: notLivePayload,
              timestamp: new Date().toISOString()
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          const roomRes = await fetch(`https://webcast.tiktok.com/webcast/room/info/?aid=1988&room_id=${roomId}`, {
            headers: {
              'User-Agent': USER_AGENT,
              'Accept': 'application/json',
              'Referer': 'https://www.tiktok.com/@karam.drame'
            }
          });

          if (roomRes.ok) {
            const json = await roomRes.json();
            const room = json.data;
            if (room) {
              // SEUL le status 2 SANS finish_time signifie qu'un live est ACTIF en direct
              const finishTime = Number(room.finish_time || room.finishTime || 0);
              const hasEnded = finishTime > 0;
              const isLive = room.status === 2 && !hasEnded;
              const stats = room.stats || {};
              const currentViewers = isLive ? Number(room.user_count || 0) : 0;
              const totalUser = Number(stats.total_user || 0);
              const followers = Number(stats.follow_count || 0);
              const realLikes = Number(stats.like_count || stats.digg_count || room.like_count || 0);
              const realComments = Number(stats.comment_count || 0);
              const realShares = Number(stats.share_count || 0);

              const startedAt = isLive && room.create_time 
                ? new Date(room.create_time * 1000).toISOString()
                : null;

              const livePayload = {
                isLive,
                roomId: isLive ? roomId : '',
                title: isLive ? (room.title || 'Live TikTok en cours') : '',
                startedAt,
                currentViewers,
                peakViewers: currentViewers,
                totalUser,
                likes: isLive ? realLikes : 0,
                comments: isLive ? realComments : 0,
                shares: isLive ? realShares : 0,
                followers: isLive ? followers : 0
              };

              // Met à jour Firestore en arrière-plan
              ctx.waitUntil(updateFirestoreLive(livePayload));

              return new Response(JSON.stringify({
                status: isLive ? 'success' : 'offline',
                data: livePayload,
                timestamp: new Date().toISOString()
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
            }
          }
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      return new Response(JSON.stringify({
        status: 'online',
        service: 'TikTok Live Webhook Gateway & Real-time Live Engine',
        message: 'Endpoint operationnel pour TikTok',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 2. Réception des Webhooks Officiels TikTok (POST)
    if (request.method === 'POST') {
      try {
        let payload = {};
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          payload = await request.json();
        } else {
          const text = await request.text();
          try { payload = JSON.parse(text); } catch (e) { payload = { raw: text }; }
        }

        const event = payload.event || payload.type || 'ping_test';
        const data = payload.data || {};

        if (event === 'live_start' || event === 'live_end' || event === 'live_metrics') {
          const isLive = event !== 'live_end';
          const livePayload = {
            isLive,
            roomId: data.room_id || data.roomId || '',
            title: data.title || 'Live TikTok',
            currentViewers: Number(data.viewer_count || data.viewerCount || 0),
            likes: Number(data.like_count || data.likeCount || 0),
            comments: Number(data.comment_count || data.commentCount || 0),
            shares: Number(data.share_count || 0),
            followers: Number(data.new_followers || 0)
          };

          ctx.waitUntil(updateFirestoreLive(livePayload));
        }

        return new Response(JSON.stringify({
          success: true,
          event_received: event,
          status: 'processed',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: true, status: 'fallback_ok' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }
};

