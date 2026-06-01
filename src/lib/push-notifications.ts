export type WebPushSubscriptionPayload = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Limpia llaves VAPID desde variables de entorno (Netlify, Firebase Functions, local). */
export function getVapidConfigFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const sanitize = (value: string) => value.replace(/["'\s\n\t]/g, '').trim();

  const publicKey = sanitize(
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      env.VAPID_PUBLIC_KEY ||
      env.PUSH_PUBKEY ||
      ''
  );
  const privateKey = sanitize(
    env.VAPID_PRIVATE_KEY || env.PUSH_PRIVKEY || ''
  );
  const subject = (env.VAPID_MAILTO || env.PUSH_MAILTO || '')
    .replace(/["']/g, '')
    .trim();

  return { publicKey, privateKey, subject };
}

/** Formato que exige web-push (sin orgId ni otros metadatos de Firestore). */
export function toWebPushSubscription(
  data: Record<string, unknown>
): WebPushSubscriptionPayload {
  const endpoint = data.endpoint;
  const keys = data.keys as { p256dh?: string; auth?: string } | undefined;

  if (typeof endpoint !== 'string' || !keys?.p256dh || !keys?.auth) {
    throw new Error('Suscripción push incompleta en Firestore');
  }

  return {
    endpoint,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
  };
}

export function isStalePushSubscriptionError(statusCode?: number) {
  return statusCode === 410 || statusCode === 404 || statusCode === 403 || statusCode === 401;
}
