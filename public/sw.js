self.addEventListener("install", (event) => {
  console.log("Service Worker installed 🍡");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated 🍡");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Basic fetch handler to satisfy PWA requirements
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

