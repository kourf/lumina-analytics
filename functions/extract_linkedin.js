const fs = require('fs');
const cheerio = require('cheerio');

async function extract() {
  try {
    const res = await fetch('https://www.linkedin.com/in/drmkaramokho', {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    const html = await res.text();
    fs.writeFileSync('functions/linkedin_real.html', html);
    const $ = cheerio.load(html);

    console.log('Title:', $('title').text());
    console.log('OG Title:', $('meta[property="og:title"]').attr('content'));
    console.log('OG Image:', $('meta[property="og:image"]').attr('content'));
    console.log('OG Description:', $('meta[property="og:description"]').attr('content'));

    // Search for JSON-LD scripts
    $('script[type="application/ld+json"]').each((i, el) => {
      console.log('JSON-LD ' + i + ':', $(el).html());
    });

    // Search for followers / relations patterns
    const bodyText = $('body').text();
    const matchesFollowers = html.match(/(\d[\d\s,.]*)\s*(abonn[ée]s?|followers?)/gi);
    const matchesConnections = html.match(/(\d[\d\s,.]*\+?)\s*(relations?|connections?)/gi);
    console.log('Matches Followers:', matchesFollowers);
    console.log('Matches Connections:', matchesConnections);

  } catch(e) {
    console.error(e);
  }
}

extract();
