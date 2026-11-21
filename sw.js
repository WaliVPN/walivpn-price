/* WaliVPN service worker: opens the last visited version when there is no internet. */
var CACHE = 'walivpn-v1';
var CORE = ['./', 'index.html', 'manifest.webmanifest', 'IMG_5518.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(CORE.map(function(u){ return c.add(u).catch(function(){}); }));
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== location.origin) return;
  if(req.mode === 'navigate'){
    // network first, so a new version always shows up when online
    e.respondWith(fetch(req).then(function(res){
      var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put('index.html', copy); });
      return res;
    }).catch(function(){ return caches.match('index.html').then(function(r){ return r || caches.match('./'); }); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){
    var net = fetch(req).then(function(res){
      if(res && res.ok){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); }
      return res;
    }).catch(function(){ return hit; });
    return hit || net;
  }));
});
