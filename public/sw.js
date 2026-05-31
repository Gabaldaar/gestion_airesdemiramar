// Regentum Service Worker v1.6.9

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png', // Icono para la barra de estado
      vibrate: [200, 100, 200],
      tag: data.tag || 'general-notification',
      renotify: true,
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(data.title, options),
        // Actualizar el globo (badge) en el icono de la aplicación
        'setAppBadge' in self.navigator ? self.navigator.setAppBadge() : Promise.resolve()
      ])
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Limpiar el badge cuando se abre la aplicación
self.addEventListener('activate', function(event) {
    if ('clearAppBadge' in self.navigator) {
        self.navigator.clearAppBadge();
    }
});
