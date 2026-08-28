import fs from 'fs';

const html = fs.readFileSync('tiktok_page.html', 'utf8');
const regex = /<script id=" __UNIVERSAL_DATA_FOR_REHYDRATION__\ type=\application\/json\>([\s\S]*?)<\/script>/;
const match = html.match(regex);

if (match) {
 const json = JSON.parse(match[1]);
 fs.writeFileSync('tiktok_extracted.json', JSON.stringify(json, null, 2), 'utf8');
 console.log('Successfully extracted JSON!');
 const keys = Object.keys(json.__DEFAULT_SCOPE__ || {});
 console.log('DEFAULT SCOPE KEYS:', keys);
 
 const userDetail = json.__DEFAULT_SCOPE__?.['webapp.user-detail'];
 console.log('User stats:', userDetail?.userInfo?.stats);
 console.log('User user:', userDetail?.userInfo?.user?.uniqueId, userDetail?.userInfo?.user?.nickname);
 
 // Look for videos / items
 const itemList = userDetail?.itemList;
 console.log('ItemList:', itemList);
 
 const videoDetail = json.__DEFAULT_SCOPE__?.['webapp.video-detail'];
 console.log('VideoDetail keys:', Object.keys(videoDetail || {}));

 // Find any other scopes
 for (const k of keys) {
 const val = json.__DEFAULT_SCOPE__[k];
 if (val && typeof val === 'object') {
 const subkeys = Object.keys(val);
 console.log('Scope key:', k, 'Subkeys:', subkeys.slice(0, 10));
 }
 }
} else {
 console.log('No match found');
}
