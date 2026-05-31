# Instrucciones para Corregir Error de Carga de Imágenes (CORS)

¡Hola! El error `404` que recibiste indica que el nombre del "bucket" no es el predeterminado. Firebase ha actualizado recientemente sus dominios.

---

## 1. El Comando Correcto

Casi con seguridad, tu comando correcto es este. Cópialo y pégalo en la terminal:

```bash
gsutil cors set cors.json gs://miramar-rentals-manager.firebasestorage.app
```

## 2. Cómo verificar si falla

1.  Ve a la [Consola de Firebase](https://console.firebase.google.com/).
2.  Entra en tu proyecto **Miramar Rentals Manager**.
3.  En el menú de la izquierda, ve a **Storage** (Almacenamiento).
4.  Arriba verás una dirección que empieza por `gs://`. Por ejemplo: `gs://miramar-rentals-manager.firebasestorage.app`.
5.  Usa **esa dirección exacta** en el comando: `gsutil cors set cors.json <DIRECCIÓN_COPIADA>`

---

### ¿Por qué es necesario?
Sin esto, el navegador bloquea la subida de fotos por "falta de permisos de origen". Una vez que la terminal diga "Setting CORS... OK", las fotos se subirán al instante.
