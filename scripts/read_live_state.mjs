const url = 'https://firestore.googleapis.com/v1/projects/lumina-analytics-kd-2026/databases/(default)/documents/users/karamokho';

async function main() {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('Fetch failed:', res.status, res.statusText);
      return;
    }
    const data = await res.json();
    console.log('--- FIRESTORE DOCUMENT FIELDS ---');
    console.log('tiktokLiveAPI:', JSON.stringify(data.fields?.tiktokLiveAPI || {}, null, 2));
    console.log('tiktokAPI isLive:', data.fields?.tiktokAPI?.mapValue?.fields?.isLive);
    console.log('root isLive:', data.fields?.isLive);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
