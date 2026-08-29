export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tiktok-signature'
        }
      });
    }

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const challenge = url.searchParams.get('challenge');
      if (challenge) {
        return new Response(challenge, {
          status: 200,
          headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' }
        });
      }

      return new Response(JSON.stringify({
        status: 'online',
        service: 'TikTok Live Webhook Gateway',
        message: 'Endpoint operationnel pour TikTok',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

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
        return new Response(JSON.stringify({
          success: true,
          event_received: event,
          status: 'processed',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: true, status: 'fallback_ok' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  }
};
