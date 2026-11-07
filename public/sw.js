const CACHE_NAME = 'lions-karate-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline pages');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event with Stale-While-Revalidate strategy for static resources
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests, Vite development modules, Chrome extensions, or Firebase backend requests
  if (
    req.method !== 'GET' || 
    url.protocol === 'chrome-extension:' || 
    url.pathname.includes('/node_modules/') || 
    url.pathname.includes('/src/') || 
    url.pathname.includes('/@vite') || 
    url.pathname.includes('/@fs') ||
    url.hostname.includes('firestore.googleapis.com') || 
    url.hostname.includes('identitytoolkit.googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in the background and update the cache
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, networkResponse);
            });
          }
        }).catch(() => {
          // Ignore network errors during stale background update
        });
        return cachedResponse;
      }

      // If not in cache, fetch from network and save to cache
      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Cache static files (JS, CSS, images, etc.)
        const isStaticAsset = 
          url.pathname.endsWith('.js') || 
          url.pathname.endsWith('.css') || 
          url.pathname.endsWith('.png') || 
          url.pathname.endsWith('.jpg') || 
          url.pathname.endsWith('.jpeg') || 
          url.pathname.endsWith('.svg') || 
          url.pathname.endsWith('.woff') || 
          url.pathname.endsWith('.woff2') || 
          url.pathname.endsWith('.json') ||
          req.destination === 'script' ||
          req.destination === 'style' ||
          req.destination === 'image' ||
          req.destination === 'font' ||
          url.origin === self.location.origin;

        if (isStaticAsset) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }

        return networkResponse;
      }).catch((err) => {
        // Offline fallback for html requests
        if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
          return caches.match('/');
        }
        throw err;
      });
    })
  );
});
