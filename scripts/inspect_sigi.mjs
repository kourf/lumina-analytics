async function searchLikes() {
  const res = await fetch('https://www.tiktok.com/@karam.drame/live', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  });

  const html = await res.text();
  const regex = /("?[a-zA-Z0-9_]*(?:like|digg)[a-zA-Z0-9_]*"?\s*:\s*[0-9]+)/gi;
  const matches = html.match(regex) || [];
  console.log("Matches count:", matches.length);
  const unique = [...new Set(matches)];
  console.log("Unique matches:", unique);
}

searchLikes().then(() => setTimeout(() => process.exit(0), 100));
