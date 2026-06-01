/**
 * Utilidades de registro push en el navegador (cliente).
 * Pensado para móvil: iOS PWA, SW activo, llave VAPID válida.
 */

export function sanitizeVapidPublicKey(raw: string): string {
  return raw.replace(/["'\s\n\t]/g, '').trim();
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const cleaned = sanitizeVapidPublicKey(base64String);
  const padding = '='.repeat((4 - (cleaned.length % 4)) % 4);
  const base64 = (cleaned + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function validateVapidPublicKeyBytes(key: Uint8Array): void {
  if (key.length !== 65) {
    throw new Error(
      `Clave VAPID inválida (${key.length} bytes, se esperan 65). Revisa NEXT_PUBLIC_VAPID_PUBLIC_KEY en Netlify.`
    );
  }
  if (key[0] !== 0x04) {
    throw new Error(
      'Formato de clave VAPID incorrecto. Regenera el par con: npx web-push generate-vapid-keys'
    );
  }
}

export function decodeVapidPublicKey(base64String: string): Uint8Array {
  const bytes = urlBase64ToUint8Array(base64String);
  validateVapidPublicKeyBytes(bytes);
  return bytes;
}

/** Llave pública desde el servidor (misma que usa web-push al enviar). */
export async function fetchPublicVapidKey(): Promise<string> {
  try {
    const res = await fetch('/api/push/vapid-public-key', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { publicKey?: string };
      if (data.publicKey) return sanitizeVapidPublicKey(data.publicKey);
    }
  } catch {
    // fallback al bundle
  }
  const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  return sanitizeVapidPublicKey(fromEnv);
}

export function getPushEnvironmentBlocker(): string | null {
  if (typeof window === 'undefined') return null;

  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (/FBAN|FBAV|Instagram|Line\//i.test(ua)) {
    return 'Abre Regentum en Chrome o Safari directamente (no desde Instagram, WhatsApp ni el visor de Gmail).';
  }

  if (isIOS && !isStandalone) {
    return 'En iPhone/iPad: en Safari pulsa Compartir → «Añadir a pantalla de inicio», abre Regentum desde el icono instalado y activa las alertas ahí. Safari normal no admite push.';
  }

  if (!window.isSecureContext) {
    return 'Las notificaciones push requieren HTTPS. No funcionan en conexiones inseguras.';
  }

  return null;
}

export function explainPushSubscribeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  const blocker = getPushEnvironmentBlocker();
  if (blocker && (lower.includes('push service') || lower.includes('registration failed'))) {
    return blocker;
  }

  if (lower.includes('push service')) {
    return (
      'El servicio push del navegador rechazó el registro. Prueba: 1) Reseteo forzado abajo, 2) Cerrar y abrir el navegador, ' +
      '3) En Android, activar notificaciones para Chrome en Ajustes del sistema. Si usas iPhone, instala la app en la pantalla de inicio.'
    );
  }

  if (lower.includes('not allowed') || lower.includes('permission')) {
    return 'Permiso de notificaciones denegado. Actívalo en Ajustes → Notificaciones para este navegador o app.';
  }

  return message || 'Error de registro. Usa Reseteo forzado y vuelve a intentar.';
}

/** Espera a que el SW esté activo (en móvil `ready` a veces no basta). */
export async function waitForActiveServiceWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none',
  });

  try {
    await registration.update();
  } catch {
    /* ignorar */
  }

  if (registration.active) {
    return registration;
  }

  const installing = registration.installing || registration.waiting;
  if (installing) {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('Service worker timeout')), 15000);
      installing.addEventListener('statechange', () => {
        if (installing.state === 'activated') {
          window.clearTimeout(timeout);
          resolve();
        }
        if (installing.state === 'redundant') {
          window.clearTimeout(timeout);
          reject(new Error('Service worker no pudo activarse'));
        }
      });
    });
  }

  await navigator.serviceWorker.ready;
  return registration;
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  publicKeyBase64: string
): Promise<PushSubscription> {
  const applicationServerKey = decodeVapidPublicKey(publicKeyBase64);
  const options: PushSubscriptionOptionsInit = {
    userVisibleOnly: true,
    applicationServerKey,
  };

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    try {
      await existing.unsubscribe();
    } catch {
      /* puede fallar si la suscripción ya no es válida */
    }
  }

  try {
    return await registration.pushManager.subscribe(options);
  } catch (firstError) {
    // Segundo intento tras limpiar (común en Android con suscripción corrupta)
    const stale = await registration.pushManager.getSubscription();
    if (stale) {
      try {
        await stale.unsubscribe();
      } catch {
        /* ignorar */
      }
    }
    return await registration.pushManager.subscribe(options);
  }
}
