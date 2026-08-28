import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('tiktok_page.html', 'utf8');
const ch = cheerio.load(html);
const scriptEl = ch('#__UNIVERSAL_DATA_FOR_REHYDRATION__');

if (scriptEl.length > 0) {
  const text = scriptEl.text();
  console.log('Found script text, length:', text.length);
  const json = JSON.parse(text);
  fs.writeFileSync('tiktok_extracted.json', JSON.stringify(json, null, 2), 'utf8');
  console.log('Saved tiktok_extracted.json!');
  
  const userDetail = json.__DEFAULT_SCOPE__?.['webapp.user-detail'];
  console.log('User stats:', userDetail?.userInfo?.stats);
  console.log('User uniqueId:', userDetail?.userInfo?.user?.uniqueId);
  console.log('ItemList:', userDetail?.itemList?.length);
  
  const jsonStr = JSON.stringify(json);
  const playCountMatches = [...jsonStr.matchAll(/" playCount\:\s*(\d+)/g)];
 console.log('Total playCount occurrences in page:', playCountMatches.length);
 if (playCountMatches.length > 0) {
 console.log('First 5 playCounts:', playCountMatches.slice(0, 5).map(m => m[1]));
 }
} else {
 console.log('Element not found via cheerio');
}
