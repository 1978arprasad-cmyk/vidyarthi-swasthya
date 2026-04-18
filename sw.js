// ── Vidyarthi Swasthya — Service Worker v1.0 ──────────
// Caches the app shell for instant loading and offline use.
// Data (students, records) always comes from Supabase when online.

var CACHE = 'vs-shell-v7';
var SHELL = [
  '/',
  '/index.html',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js'
];

// Install — cache the app shell
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(SHELL); })
  );
  self.skipWaiting();
});

// Activate — remove old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', function(e){
  // Never intercept Supabase API calls — always go to network for data
  if(e.request.url.includes('supabase.co')){return;}

  e.respondWith(
    fetch(e.request)
      .then(function(res){
        // Cache successful GET responses
        if(e.request.method==='GET'&&res.status===200){
          var clone=res.clone();
          caches.open(CACHE).then(function(c){c.put(e.request,clone);});
        }
        return res;
      })
      .catch(function(){
        // Offline fallback — serve from cache
        return caches.match(e.request).then(function(cached){
          return cached||caches.match('/');
        });
      })
  );
});
