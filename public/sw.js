
const CACHE_NAME = 'mi-app-cache-v1';
// Lista de recursos esenciales para la "carcasa" de la aplicación.
const urlsToCache = [
  '/',
  '/manifest.json',
  // Agrega aquí los íconos y otros assets estáticos cruciales
];

// 1. Instalación del Service Worker: Cachear la carcasa de la aplicación.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 2. Activación del Service Worker: Limpiar cachés antiguas.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Interceptación de Peticiones (Fetch)
self.addEventListener('fetch', event => {
  const { request } = event;

  // No interceptar peticiones de la API de Firestore ni del Cron
  if (request.url.includes('firestore.googleapis.com') || request.url.includes('/api/cron/')) {
    return;
  }
  
  // Estrategia "Network First" para la navegación y otros recursos.
  event.respondWith(
    fetch(request)
      .then(response => {
        // Si la petición a la red es exitosa, la usamos y la guardamos en caché.
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Si la red falla (estamos offline), intentamos servir desde la caché.
        return caches.match(request).then(response => {
          if (response) {
            return response;
          }
          // Opcional: Podrías devolver una página offline personalizada aquí si no se encuentra en caché.
        });
      })
  );
});


// 4. Listen for Push Notifications
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Error parsing push data:', e);
      data = { title: 'Notificación', body: event.data.text() };
    }
  }

  const title = data.title || 'Recordatorio';
  const options = {
    body: data.body || 'Tienes un nuevo recordatorio.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-96x96.png',
    tag: data.tag || 'default-tag', // Tag to group notifications
    renotify: true, // Renotify if a new notification has the same tag
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Optional: Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('On notification click: ', event.notification.tag);
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(clients.matchAll({
    type: "window"
  }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      if (client.url == '/' && 'focus' in client)
        return client.focus();
    }
    if (clients.openWindow)
      return clients.openWindow('/');
  }));
});
