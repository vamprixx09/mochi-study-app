const CACHE_NAME = 'mochi-study-v2';
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener("install", (event) => {
  console.log("Mochi SW installing... 🍡");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching critical assets");
      return cache.addAll(CRITICAL_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated 🍡");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Check if this is a navigation request
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Only cache valid responses from same origin or Drive CDN
        if (
          fetchResponse && 
          fetchResponse.status === 200 && 
          (fetchResponse.type === 'basic' || event.request.url.includes('drive.google.com') || event.request.url.includes('thumbnail'))
        ) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    })
  );
});

