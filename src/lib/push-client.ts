/**
 * Utilidades de registro push en el navegador (cliente).
 * Android: requiere gcm_sender_id en manifest + FCM (Google Play Services).
 */

export type PushClientDiagnostics = {
  userAgent: string;
  isAndroid: boolean;
  isSecureContext: boolean;
  notificationPermission: string;
  hasServiceWorkerController: boolean;
  vapidKeyLength: number;
  vapidKeyBytes: number | null;
  existingSubscription: boolean;
  hints: string[];
};

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isBraveBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (navigator as Navigator & { brave?: unknown }).brave !== undefined;
}

export function isHuaweiWithoutGms(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Huawei|Honor|HMSCore/i.test(ua);
}

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

/** Chrome en Android a veces exige ArrayBuffer en lugar de Uint8Array. */
export function toApplicationServerKey(publicKeyBase64: string): BufferSource {
  const bytes = decodeVapidPublicKey(publicKeyBase64);
  if (isAndroidDevice()) {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }
  return bytes;
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

export async function fetchPublicVapidKey(): Promise<string> {
  try {
    const res = await fetch('/api/push/vapid-public-key', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { publicKey?: string };
      if (data.publicKey) return sanitizeVapidPublicKey(data.publicKey);
    }
  } catch {
    /* fallback */
  }
  const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  return sanitizeVapidPublicKey(fromEnv);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    return 'Abre Regentum en Chrome (icono de Chrome), no desde WhatsApp, Gmail ni Facebook.';
  }

  if (isIOS && !isStandalone) {
    return 'En iPhone: Safari → Compartir → Añadir a pantalla de inicio, y abre la app desde el icono.';
  }

  if (!window.isSecureContext) {
    const host = window.location.hostname;
    if (/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
      return `Estás en http://${host} (red local). El móvil no puede registrar push por HTTP. Abre la misma URL HTTPS de producción (Netlify) en el teléfono.`;
    }
    return 'Las notificaciones push requieren HTTPS. Abre el sitio publicado en Netlify, no una IP local.';
  }

  if (isHuaweiWithoutGms()) {
    return 'Este teléfono Huawei/Honor puede no tener Google Play Services (FCM). Prueba con Chrome actualizado o un dispositivo con servicios de Google.';
  }

  if (isBraveBrowser()) {
    return 'En Brave: Ajustes → Privacidad → activa «Usar los servicios de Google para la mensajería push».';
  }

  if (isAndroidDevice() && /SamsungBrowser/i.test(ua)) {
    return 'En Samsung Internet a veces falla el registro. Prueba con Chrome instalado desde Play Store.';
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
    if (isAndroidDevice()) {
      return (
        'Android rechazó el registro con Google (FCM). Pasos: 1) Usa Chrome (no el navegador de Samsung si falla), ' +
        '2) Ajustes → Apps → Chrome → Notificaciones activadas, 3) Actualiza «Servicios de Google Play», ' +
        '4) Reseteo forzado aquí y recarga la página, 5) Si instalaste Regentum como app, desinstálala del inicio y vuelve a añadirla tras desplegar la actualización.'
      );
    }
    return 'El servicio push del navegador rechazó el registro. Usa Reseteo forzado y vuelve a intentar en Chrome.';
  }

  if (lower.includes('not allowed') || lower.includes('permission')) {
    return 'Permiso denegado. En Android: Ajustes → Apps → Chrome → Notificaciones → Permitir.';
  }

  return message || 'Error de registro. Usa Reseteo forzado y vuelve a intentar.';
}

export async function collectPushDiagnostics(publicKey: string): Promise<PushClientDiagnostics> {
  const hints: string[] = [];
  let vapidKeyBytes: number | null = null;
  let existingSubscription = false;

  try {
    vapidKeyBytes = decodeVapidPublicKey(publicKey).length;
  } catch (e) {
    hints.push(e instanceof Error ? e.message : 'Clave VAPID inválida');
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    hints.push('Este navegador no soporta notificaciones push.');
  }

  if (!navigator.serviceWorker.controller) {
    hints.push('El service worker aún no controla la página. Recarga después del reseteo.');
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    existingSubscription = !!(await reg.pushManager.getSubscription());
  } catch {
    hints.push('No se pudo leer el estado del service worker.');
  }

  const blocker = getPushEnvironmentBlocker();
  if (blocker) hints.push(blocker);

  return {
    userAgent: navigator.userAgent,
    isAndroid: isAndroidDevice(),
    isSecureContext: window.isSecureContext,
    notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    hasServiceWorkerController: !!navigator.serviceWorker.controller,
    vapidKeyLength: publicKey.length,
    vapidKeyBytes,
    existingSubscription,
    hints,
  };
}

export async function waitForServiceWorkerControl(timeoutMs = 12000): Promise<void> {
  if (navigator.serviceWorker.controller) return;

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(
        new Error(
          'El service worker no tomó control. Recarga la página (tira hacia abajo en Chrome) e intenta de nuevo.'
        )
      );
    }, timeoutMs);

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (navigator.serviceWorker.controller) {
        window.clearTimeout(timeout);
        resolve();
      }
    });
  });
}

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

  const installing = registration.installing || registration.waiting;
  if (!registration.active && installing) {
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
  await waitForServiceWorkerControl();
  return registration;
}

async function trySubscribe(
  registration: ServiceWorkerRegistration,
  publicKeyBase64: string,
  clearExisting: boolean
): Promise<PushSubscription> {
  if (clearExisting) {
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      try {
        await existing.unsubscribe();
        await delay(isAndroidDevice() ? 1200 : 400);
      } catch {
        /* ignorar */
      }
    }
  }

  const applicationServerKey = toApplicationServerKey(publicKeyBase64);
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
}

/** Re-registro completo del SW (útil en Android con estado corrupto). */
export async function resetServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  await delay(400);
  return waitForActiveServiceWorker();
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  publicKeyBase64: string
): Promise<PushSubscription> {
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    try {
      return existing;
    } catch {
      /* continuar con nuevo registro */
    }
  }

  try {
    return await trySubscribe(registration, publicKeyBase64, false);
  } catch {
    try {
      return await trySubscribe(registration, publicKeyBase64, true);
    } catch {
      const freshRegistration = await resetServiceWorkerRegistration();
      await delay(600);
      return trySubscribe(freshRegistration, publicKeyBase64, false);
    }
  }
}
