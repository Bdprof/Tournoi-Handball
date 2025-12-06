const CACHE_NAME = "tournoi-handball-v1";
const SCRIPT_CACHE = "tournoi-handball-scripts-v1";
const cdnUrl = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

self.addEventListener("install", event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(["./", "./index.html"])),
      caches.open(SCRIPT_CACHE).then(cache => cache.add(cdnUrl))
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name !== CACHE_NAME && name !== SCRIPT_CACHE)
          .map(name => caches.delete(name))
      )
    ).then(() => clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;

  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) return response;
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) return response;
          const responseToCache = response.clone();
          caches.open(SCRIPT_CACHE).then(cache => cache.put(event.request, responseToCache));
          return response;
        }).catch(() => caches.match(event.request));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return response;
      }).catch(() => caches.match(event.request));
    })
  );
});
