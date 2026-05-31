# Guía para Migrar al Repositorio Definitivo

Si estás moviendo tu código desde el repositorio de pruebas (`_Test`) al repositorio original, sigue estos pasos en tu terminal.

## Paso 1: Configurar la nueva URL del Repositorio

Ejecuta este comando para cambiar el destino de tus subidas:

```bash
git remote set-url origin https://github.com/Gabaldaar/gestion_airesdemiramar.git
```

## Paso 2: Verificar la Configuración

Para estar seguro de que la dirección es correcta, ejecuta:
`git remote -v`

Deberías ver la URL de `github.com/Gabaldaar/gestion_airesdemiramar.git` (sin el _Test) junto al nombre `origin`.

## Paso 3: Subir los cambios (Push)

Si el repositorio nuevo está vacío:
```bash
git push -u origin main
```

---

## Solución al Error: ECONNREFUSED (Socket de VS Code)

Si recibes un error que menciona `/tmp/vscode-git-xxxx.sock`, es porque el ayudante de credenciales está bloqueado. Usa este comando para forzar la subida con tu token:

```bash
git push https://<TU_TOKEN_AQUÍ>@github.com/Gabaldaar/gestion_airesdemiramar.git
```

---

## Solución al Error: GITHUB PUSH PROTECTION (Secretos detectados)

Si al hacer push recibes el error `GH013`, es porque GitHub detectó una llave de seguridad en el historial.

1. **Busca el enlace único** que GitHub te da en el mensaje de error (empieza por `https://github.com/Gabaldaar/.../unblock-secret/...`).
2. **Haz clic en el enlace** o cópialo en tu navegador.
3. Selecciona la opción que dice que **el secreto es usado para pruebas o es un placeholder**, y confirma.
4. Vuelve a la terminal e intenta el push de nuevo.

---

## Solución: Error de Autenticación (PAT Token)

Si recibes el error `remote: Invalid username or token`, necesitas usar un **Token de Acceso Personal (PAT)** de GitHub en lugar de tu contraseña:

1. Ve a **Settings** -> **Developer settings** -> **Tokens (classic)** en tu GitHub.
2. Genera uno nuevo con el permiso **repo**.
3. **Copia el Token** (empieza por `ghp_...`).
4. Actualiza la URL inyectando el token:

```bash
git remote set-url origin https://<TU_TOKEN_AQUÍ>@github.com/Gabaldaar/gestion_airesdemiramar.git
```
