const CACHE_NAME = "sri-amman-static-v2";

// Clean old caches on activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Clearing Old Cache", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event interceptor
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Skip API calls (handled by the window.fetch interceptor in main.jsx)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 2. Only handle GET requests for static assets
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, clone and cache it
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback: search in cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If navigation request fails, return cached root index.html
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          
          return new Response("Offline Resource Not Found", {
            status: 503,
            statusText: "Service Unavailable"
          });
        });
      })
  );
});
