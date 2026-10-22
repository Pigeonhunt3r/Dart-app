// Bump this version whenever packaged web assets change.
const CACHE='oche-club-v9';
const ASSETS=['./','./index.html','./manifest.webmanifest','./src/app.js','./src/storage.js','./src/i18n.js','./src/engine.js','./src/style.css','./src/fonts/barlow-condensed-latin-800-normal.woff2','./src/fonts/barlow-condensed-latin-600-normal.woff2','./src/fonts/dm-sans-latin-400-normal.woff2','./src/fonts/dm-sans-latin-700-normal.woff2','./public/icon-192.png','./public/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('oche-club-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(event.request,{ignoreSearch:true});
  if(cached)return cached;
  return fetch(event.request);
 }));
});
