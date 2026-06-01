
# Guía de Sincronización de Llaves (v1.4.3)

Para que las notificaciones funcionen, los valores en **Netlify** deben coincidir exactamente con tus archivos locales.

## 1. Mapeo para `functions/.env`
Copia desde el panel de Netlify a tu archivo local en la carpeta `functions`:

| Variable en Netlify | Variable en `functions/.env` | Formato Correcto |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | **`PUSH_PUBKEY`** | Empieza con 'B', muy larga. |
| `VAPID_PRIVATE_KEY` | **`PUSH_PRIVKEY`** | Llave más corta. |
| `VAPID_MAILTO` | **`PUSH_MAILTO`** | Debe ser `mailto:tu@email.com` |

## 2. Mapeo para `.env.local` (Raíz)
Copia estos valores para que la App reconozca tu configuración:

| Variable en Netlify | Variable en `.env.local` |
| :--- | :--- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `FB_PRIVATE_KEY` | `FB_PRIVATE_KEY` |
| `FB_CLIENT_EMAIL` | `FB_CLIENT_EMAIL` |
| `FINANCE_API_KEY` | `FINANCE_API_KEY` |

> **Finanzas (Personal):** Si usás la modalidad Personal y querés sincronizar cobros con *Gestiono Mis Cuentas*, copiá también `FINANCE_API_KEY` desde Netlify (o la clave que definiste en esa app). Reiniciá `npm run dev` después de agregarla.

---

## **Checklist de Verificación (¿Por qué falla el registro?)**

1.  **La Pareja de Llaves**: La Pública y la Privada se generan juntas. Si cambiaste una en Netlify pero no la otra, el navegador dará error de registro.
2.  **Mailto**: Asegúrate de que `VAPID_MAILTO` en Netlify incluya el prefijo `mailto:`.
3.  **Comillas**: Nunca uses comillas en el panel de Netlify.
4.  **Reseteo**: Si las llaves son correctas y sigue fallando, usa el botón **"Reseteo Forzado"** en la sección de Alertas para limpiar el navegador.

## **Diagnóstico de Consola**
Al pulsar "Activar", abre la consola (`F12`). 
- **Bytes=65**: Significa que la llave pública es íntegra.
- **FirstByte=4**: Significa que el formato VAPID es correcto.
- Si ves ambos y da error, el problema es que la **Llave Privada** en el servidor no es la pareja de esa Pública.

## **Android (móvil)**
- Usa la **misma URL HTTPS de producción** (Netlify) en el teléfono. `http://192.168.x.x` **no** registra push.
- Navegador recomendado: **Chrome** (actualizado). Evita visores de WhatsApp/Gmail.
- Si la **comprobación** llega al PC pero no al móvil: el móvil **no está registrado** (solo el PC figura en `pushSubscriptions`).
- Tras desplegar: **Reseteo forzado** → recargar → **Activar**. Si instalaste la app en el inicio, quítala y vuelve a añadirla.
- El `manifest.json` incluye `gcm_sender_id` (requerido por FCM en Chrome Android).
