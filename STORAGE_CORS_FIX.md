# Instrucciones para Corregir Error de Carga de Imágenes (CORS)

Si la subida de imágenes se queda "colgada" en "Subiendo..." y no muestra ningún error, es casi seguro que se debe a que la política de CORS (Cross-Origin Resource Sharing) no está configurada en tu bucket de Firebase Storage.

Por seguridad, los navegadores bloquean las subidas de archivos a un dominio diferente (como el de Firebase Storage) a menos que ese dominio lo permita explícitamente.

Sigue estos pasos para solucionarlo:

---

## 1. Instala la CLI de Google Cloud

Si aún no la tienes, esta herramienta de línea de comandos es la forma más rápida y sencilla de gestionar la configuración de tu proyecto.

-   **Descarga e instala la Google Cloud SDK:** [Sigue las instrucciones oficiales aquí.](https://cloud.google.com/sdk/docs/install)
-   **Inicia sesión:** Una vez instalada, abre tu terminal y ejecuta `gcloud auth login`.
-   **Configura tu proyecto:** Ejecuta `gcloud config set project miramar-rentals-manager` (reemplaza `miramar-rentals-manager` con tu ID de proyecto si es diferente).

---

## 2. Crea un Archivo de Configuración CORS

En la raíz de tu proyecto, crea un nuevo archivo llamado `cors.json` con el siguiente contenido exacto:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

**Nota:** `origin: ["*"]` permite la subida desde cualquier dominio, lo cual es útil para el desarrollo. Para producción, es más seguro reemplazar `"*"` con el dominio de tu aplicación (ej. `https://mi-app.com`).

---

## 3. Aplica la Configuración al Bucket

En tu terminal, estando en la misma carpeta donde creaste `cors.json`, ejecuta el siguiente comando:

```bash
gsutil cors set cors.json gs://miramar-rentals-manager.appspot.com
```

**Importante:**
- Reemplaza `miramar-rentals-manager.appspot.com` con el nombre de tu bucket si es diferente. Puedes encontrarlo en tu archivo `src/lib/firebase.ts` bajo la clave `storageBucket`.
- `gsutil` es parte de la Google Cloud SDK que instalaste.

---

Una vez que el comando se complete con éxito, **la subida de imágenes debería funcionar inmediatamente en tu aplicación.** No es necesario reiniciar ni redesplegar nada.