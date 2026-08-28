import fs from 'fs';

const html = fs.readFileSync('tiktok_page.html', 'utf8');
const idStr = '__UNIVERSAL_DATA_FOR_REHYDRATION__';
const idx = html.indexOf(idStr);

if (idx !== -1) {
  const startTag = html.lastIndexOf('<script', idx);
  const tagClose = html.indexOf('>', idx);
  const endTag = html.indexOf('</script>', tagClose);
  const content = html.substring(tagClose + 1, endTag);
  
  console.log('Found content, length:', content.length);
  const json = JSON.parse(content);
  fs.writeFileSync('tiktok_extracted.json', JSON.stringify(json, null, 2), 'utf8');
  console.log('Saved tiktok_extracted.json successfully!');
  
  const userDetail = json.__DEFAULT_SCOPE__?.['webapp.user-detail'];
  console.log('User stats:', userDetail?.userInfo?.stats);
  console.log('User user:', userDetail?.userInfo?.user?.uniqueId, userDetail?.userInfo?.user?.nickname, userDetail?.userInfo?.user?.avatarLarger);
  
  const items = userDetail?.itemList || [];
  console.log('ItemList count:', items.length);
  
  const jsonStr = JSON.stringify(json);
  const playMatches = [...jsonStr.matchAll(/" playCount\:\s*(\d+)/g)];
 console.log('PlayCount matches count:', playMatches.length);
 if (playMatches.length > 0) {
 console.log('Matches:', playMatches.map(m => m[1]));
 }
} else {
 console.log('idStr not found in html');
}
