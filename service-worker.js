
const CACHE='bioacus-cache-v1-1';
const CORE=['./','./index.html','./assets/css/style.css','./assets/js/app.js','./assets/js/audio.js','./assets/js/ml.js','./assets/js/chart.js','./assets/img/logo.svg','./data/config.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.origin===location.origin){ e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request))); }
});
