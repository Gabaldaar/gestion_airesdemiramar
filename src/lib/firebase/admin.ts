import { initializeApp, getApps, cert, App, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth as getFirebaseAdminAuth, Auth } from 'firebase-admin/auth';

/**
 * Reconstruye una clave privada PEM de forma ultra-robusta.
 * Este método soluciona el problema de los '\n' literales que Netlify 
 * y los archivos .env introducen al procesar variables de entorno.
 */
function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  
  // 1. Eliminar comillas accidentales al principio y final
  let cleaned = key.trim().replace(/^["']|["']$/g, '');
  
  // 2. IMPORTANTE: Netlify a veces escapa los saltos de línea como la cadena literal "\n".
  // Necesitamos convertirlos en saltos de línea reales (\n).
  if (cleaned.includes('\\n')) {
    cleaned = cleaned.replace(/\\n/g, '\n');
  }

  // 3. Asegurar que tenga los encabezados PEM correctos
  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';

  if (!cleaned.includes('BEGIN PRIVATE KEY')) {
    // Si la llave viene sin cabeceras (solo el base64), las añadimos
    return `${header}\n${cleaned}\n${footer}\n`;
  }

  // Aseguramos que termine con un salto de línea limpio después del footer por compatibilidad
  if (!cleaned.endsWith('\n')) {
    cleaned += '\n';
  }

  return cleaned;
}

function initializeFirebaseAdmin(): App {
  const ADMIN_APP_NAME = 'regentum-admin';
  const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
  if (existingApp) return existingApp;

  // Prioridad de variables de entorno
  // Buscamos el Project ID en Netlify o usamos el valor por defecto si coincide
  const projectId = process.env.FB_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'miramar-rentals-manager';
  const clientEmail = (process.env.FB_CLIENT_EMAIL || '').trim();
  const privateKey = formatPrivateKey(process.env.FB_PRIVATE_KEY);

  if (clientEmail && privateKey.includes('BEGIN PRIVATE KEY')) {
    try {
        return initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          storageBucket: `${projectId}.firebasestorage.app`
        }, ADMIN_APP_NAME);
    } catch (e: any) {
        console.error("[ADMIN SDK] Error crítico en inicialización con certificado:", e.message);
        throw e;
    }
  }

  // Fallback para entornos con credenciales por defecto (ADC)
  if (getApps().length > 0) return getApp();
  
  try {
      return initializeApp({
          projectId: projectId,
          storageBucket: `${projectId}.firebasestorage.app`
      }, ADMIN_APP_NAME);
  } catch (e) {
      console.error("[ADMIN SDK] Falló inicialización por defecto:", e);
      throw new Error("No se pudieron configurar las credenciales administrativas de Firebase.");
  }
}

export const getDb = (): Firestore => {
  const app = initializeFirebaseAdmin();
  return getFirestore(app);
};

export const getAuth = (): Auth => {
  const app = initializeFirebaseAdmin();
  return getFirebaseAdminAuth(app);
};
