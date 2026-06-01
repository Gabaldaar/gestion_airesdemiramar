// Regentum Service Worker v1.8.0

function resolveNotificationUrl(path) {
  try {
    return new URL(path || '/', self.location.origin).href;
  } catch {
    return self.location.origin + '/';
  }
}

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('push', function (event) {
  const fallback = {
    title: 'Regentum',
    body: 'Tienes una nueva alerta.',
    tag: 'general-notification',
    url: '/bookings',
    icon: '/icons/icon-192x192.png',
  };

  let data = fallback;
  if (event.data) {
    try {
      data = { ...fallback, ...event.data.json() };
    } catch {
      data = { ...fallback, body: event.data.text() || fallback.body };
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'general-notification',
    renotify: true,
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || fallback.title, options),
      'setAppBadge' in self.navigator ? self.navigator.setAppBadge() : Promise.resolve(),
    ])
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = resolveNotificationUrl(event.notification.data?.url);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.startsWith(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      'clearAppBadge' in self.navigator ? self.navigator.clearAppBadge() : Promise.resolve(),
    ])
  );
});
