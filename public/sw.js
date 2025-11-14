// Define a name for our cache
const CACHE_NAME = 'gestion-pwa-cache-v1.4';

// List of files to cache
const urlsToCache = [
  '/',
  '/manifest.json',
  // Add other static assets like CSS, JS, and images you want to precache.
  // Next.js automatically chunks these, so you might need to adjust based on your build output.
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


// --- Fetch Event Strategies ---

// 1. Network Only for Firestore API calls
// Allows the app's logic in data.ts to handle the try/catch for Dexie fallback.
const firestoreApiStrategy = (event) => {
  return fetch(event.request);
};

// 2. Network First, then Cache for navigation and main resources
const networkFirstStrategy = (event) => {
  return fetch(event.request)
    .then(response => {
      // Check if we received a valid response
      if (!response || response.status !== 200 || response.type !== 'basic') {
        // If not, we don't cache it, but we return it.
        return response;
      }

      // IMPORTANT: Clone the response. A response is a stream
      // and because we want the browser to consume the response
      // as well as the cache consuming the response, we need
      // to clone it so we have two streams.
      const responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then(cache => {
          cache.put(event.request, responseToCache);
        });

      return response;
    })
    .catch(() => {
      // If the network request fails, try to get it from the cache.
      return caches.match(event.request);
    });
};

// Listen for fetch events
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // If the request is for the Firestore API, use a network-only strategy.
  // The app logic will handle offline fallback to Dexie.
  if (url.hostname.includes('firestore.googleapis.com')) {
    event.respondWith(firestoreApiStrategy(event));
  }
  // For all other requests (navigation, static assets, etc.), use network-first.
  else {
    event.respondWith(networkFirstStrategy(event));
  }
});
