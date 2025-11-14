
const CACHE_NAME = 'gestion-adm-v1.3';
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// 1. Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Abriendo caché y guardando el app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(error => {
        console.error('[Service Worker] Falló el cacheo del app shell:', error);
      })
  );
});

// 2. Activación del Service Worker y limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Interceptación de peticiones (estrategia Network First para navegación)
self.addEventListener('fetch', (event) => {
  // Para peticiones de navegación (páginas HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Si la petición a la red es exitosa, la usamos y la guardamos en caché
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // Si la red falla, intentamos servir desde la caché
          return caches.match(event.request)
            .then(response => {
              // Si encontramos una respuesta en caché, la devolvemos
              if (response) {
                return response;
              }
              // Si no hay nada en caché, podemos mostrar una página offline genérica (opcional)
              // Por ahora, dejamos que el navegador muestre su error de "sin conexión"
            });
        })
    );
    return;
  }

  // Para otros tipos de peticiones (CSS, JS, imágenes), usamos una estrategia "Cache First"
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si la respuesta está en la caché, la devolvemos. Si no, la buscamos en la red.
        return response || fetch(event.request).then(networkResponse => {
            // Opcional: podemos cachear estos recursos también para futuras visitas offline
            const responseToCache = networkResponse.clone();
             caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
             });
            return networkResponse;
        });
      })
  );
});

// Forzar al nuevo service worker a tomar el control inmediatamente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
