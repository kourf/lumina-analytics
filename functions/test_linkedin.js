const fs = require('fs');

async function test() {
  const bots = [
    { name: 'Twitterbot', ua: 'Twitterbot/1.0' },
    { name: 'facebookexternalhit', ua: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' },
    { name: 'Googlebot', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
    { name: 'LinkedInBot', ua: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)' }
  ];

  for (const b of bots) {
    try {
      const res = await fetch('https://www.linkedin.com/in/drmkaramokho', {
        headers: { 'User-Agent': b.ua }
      });
      console.log(b.name, 'Status:', res.status);
      if (res.ok) {
        const text = await res.text();
        console.log(b.name, 'HTML len:', text.length);
        const matchTitle = text.match(/<title>([^<]+)<\/title>/i);
        const matchDesc = text.match(/<meta property="og:description" content="([^"]+)"/i) || text.match(/<meta name="description" content="([^"]+)"/i);
        console.log(b.name, 'Title:', matchTitle ? matchTitle[1] : 'None');
        console.log(b.name, 'Desc:', matchDesc ? matchDesc[1] : 'None');
      }
    } catch(e) {
      console.log(b.name, 'Err:', e.message);
    }
  }
}

test();
