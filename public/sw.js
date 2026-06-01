// Regentum Service Worker v1.9.0

function resolveNotificationUrl(path) {
  try {
    return new URL(path || '/', self.location.origin).href;
  } catch {
    return self.location.origin + '/';
  }
}

function urlB64ToUint8Array(base64String) {
  var cleaned = String(base64String).replace(/["'\s\n\t]/g, '').trim();
  var padding = '='.repeat((4 - (cleaned.length % 4)) % 4);
  var base64 = (cleaned + padding).replace(/-/g, '+').replace(/_/g, '/');
  var rawData = atob(base64);
  var outputArray = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function subscribeWithKey(publicKey, clearExisting) {
  return self.registration.pushManager.getSubscription().then(function (existing) {
    if (clearExisting && existing) {
      return existing.unsubscribe().catch(function () {}).then(function () {
        return delay(800);
      });
    }
    return undefined;
  }).then(function () {
    var keyBytes = urlB64ToUint8Array(publicKey);
    return self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes,
    });
  });
}

function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('message', function (event) {
  var data = event.data;
  if (!data || data.type !== 'PUSH_SUBSCRIBE') return;

  var replyPort = event.ports && event.ports[0];
  if (!replyPort) return;

  event.waitUntil(
    subscribeWithKey(data.publicKey, !!data.clearExisting)
      .then(function (subscription) {
        replyPort.postMessage({
          success: true,
          subscription: subscription.toJSON(),
        });
      })
      .catch(function (err) {
        var keyBytes = urlB64ToUint8Array(data.publicKey);
        var bufferKey = keyBytes.buffer.slice(
          keyBytes.byteOffset,
          keyBytes.byteOffset + keyBytes.byteLength
        );
        return self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: bufferKey,
        })
          .then(function (subscription) {
            replyPort.postMessage({
              success: true,
              subscription: subscription.toJSON(),
            });
          })
          .catch(function (err2) {
            replyPort.postMessage({
              success: false,
              error: (err2 && err2.message) || String(err2),
              name: (err2 && err2.name) || 'Error',
            });
          });
      })
  );
});

self.addEventListener('push', function (event) {
  var fallback = {
    title: 'Regentum',
    body: 'Tienes una nueva alerta.',
    tag: 'general-notification',
    url: '/bookings',
    icon: '/icons/icon-192x192.png',
  };

  var payload = fallback;
  if (event.data) {
    try {
      payload = Object.assign({}, fallback, event.data.json());
    } catch (e) {
      payload = Object.assign({}, fallback, { body: event.data.text() || fallback.body });
    }
  }

  var options = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: payload.tag || 'general-notification',
    renotify: true,
    data: { url: payload.url || '/' },
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title || fallback.title, options),
      'setAppBadge' in self.navigator ? self.navigator.setAppBadge() : Promise.resolve(),
    ])
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var urlToOpen = resolveNotificationUrl(event.notification.data && event.notification.data.url);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(urlToOpen) === 0 && 'focus' in client) {
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
