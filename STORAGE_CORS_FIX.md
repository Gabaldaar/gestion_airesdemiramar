# Instrucciones para Corregir Error de Carga de Imágenes (CORS)

¡Ups! El error "NotFoundException: 404 The specified bucket does not exist" indica que el nombre del bucket que te di era incorrecto, o que tu CLI está apuntando a otro proyecto. ¡Mis disculpas por eso!

Para solucionarlo, necesitamos encontrar el nombre correcto de tu bucket en la consola de Firebase y usar ese.

Sigue estos pasos actualizados:

---

## 1. Encuentra el Nombre Correcto de tu Bucket

Antes de ejecutar cualquier comando, necesitas saber el nombre exacto de tu bucket de almacenamiento.

-   **Abre la Consola de Firebase:** Ve a [https://console.firebase.google.com/](https://console.firebase.google.com/) y selecciona tu proyecto.
-   **Ve a Storage:** En el menú de la izquierda, haz clic en "Storage" (o "Almacenamiento").
-   **Copia la URL del Bucket:** En la parte superior de la página de Storage (en la pestaña "Files" o "Archivos"), verás una URL que comienza con `gs://`. **Copia esa URL completa.** Se verá algo como `gs://tu-proyecto-12345.appspot.com`.

---

## 2. Instala y Configura la CLI de Google Cloud

Si aún no la tienes, esta herramienta de línea de comandos es la forma más rápida y sencilla de gestionar la configuración de tu proyecto.

-   **Descarga e instala la Google Cloud SDK:** [Sigue las instrucciones oficiales aquí.](https://cloud.google.com/sdk/docs/install)
-   **Inicia sesión:** Una vez instalada, abre tu terminal y ejecuta `gcloud auth login`.
-   **Configura tu proyecto:** Ejecuta `gcloud config set project <TU_ID_DE_PROYECTO>` (reemplaza `<TU_ID_DE_PROYECTO>` con el ID de tu proyecto de Firebase, que puedes ver en la configuración del proyecto en la consola de Firebase).

---

## 3. Crea/Verifica tu Archivo de Configuración CORS

En la raíz de tu proyecto, asegúrate de tener un archivo llamado `cors.json` con el siguiente contenido:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

**Nota:** `origin: ["*"]` permite la subida desde cualquier dominio. Para producción, es más seguro reemplazar `"*"` con el dominio de tu aplicación (ej. `https://mi-app.com`).

---

## 4. Aplica la Configuración al Bucket Correcto

En tu terminal, estando en la misma carpeta donde está `cors.json`, ejecuta el siguiente comando. **Asegúrate de reemplazar `<URL_DE_TU_BUCKET_COPIADA_EN_PASO_1>` con la URL completa que copiaste de la consola de Firebase.**

```bash
gsutil cors set cors.json <URL_DE_TU_BUCKET_COPIADA_EN_PASO_1>
```

**Ejemplo:** Si tu bucket se llama `mi-app-genial.appspot.com`, el comando sería:
`gsutil cors set cors.json gs://mi-app-genial.appspot.com`

---

Una vez que el comando se complete con éxito, **la subida de imágenes debería funcionar inmediatamente en tu aplicación.** No es necesario reiniciar ni redesplegar nada.
