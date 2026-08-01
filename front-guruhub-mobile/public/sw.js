const CACHE_NAME = "guruhub-mobile-cache-v3";

// Install Event - skip waiting immediately to activate new SW
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate Event - purge ALL old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First for ALL HTML and JS pages, Network Only for APIs
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Exclude non-http(s)
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Network Only for API and Auth
  if (url.pathname.startsWith("/auth") || url.pathname.includes("/api")) {
    return;
  }

  // Network First strategy for HTML/JS/CSS to ensure users always receive latest app build
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === "GET") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
