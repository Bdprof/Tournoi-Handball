// service-worker.js
const CACHE_NAME = 'tournoi-handball-v2';
const RUNTIME_CACHE = 'tournoi-handball-runtime';
const urlsToCache = [
  '/',
  '/Tournoi-Handball/',
  '/Tournoi-Handball/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://raw.githubusercontent.com/Bdprof/Tournoi-Handball/refs/heads/main/Logo%20apps%20tournoi%20Handball%202.png',
  'https://raw.githubusercontent.com/Bdprof/Tournoi-Handball/refs/heads/main/Accueil%20apps%20tournoi%20Handball.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker en installation...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache créé');
      return cache.addAll(urlsToCache).catch(err => {
        console.log('Erreur cache initial:', err);
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activé');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Stratégie "Stale While Revalidate"
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes data: et chrome-extension:
  if (request.url.startsWith('data:') || request.url.startsWith('chrome-extension:')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Si en cache, le retourner immédiatement
      if (cachedResponse) {
        // Mais mettre à jour le cache en arrière-plan
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            const cacheName = request.url.includes('cdnjs') || request.url.includes('github') 
              ? CACHE_NAME 
              : RUNTIME_CACHE;
            caches.open(cacheName).then((cache) => {
              cache.put(request, response);
            });
          }
        }).catch(() => {
          // Pas de connexion, c'est ok, on utilise le cache
        });
        
        return cachedResponse;
      }

      // Si pas en cache, faire la requête réseau
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseClone = response.clone();
        const cacheName = request.url.includes('cdnjs') || request.url.includes('github') 
          ? CACHE_NAME 
          : RUNTIME_CACHE;
        caches.open(cacheName).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      }).catch(() => {
        // Erreur réseau et pas en cache
        console.log('Requête échouée et pas en cache:', request.url);
        return new Response('Indisponible hors ligne', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain; charset=utf-8'
          })
        });
      });
    })
  );
});
