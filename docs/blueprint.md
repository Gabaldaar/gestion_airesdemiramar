# Requisitos de la Aplicación de Gestión de Alquileres

## 1. Resumen General

El objetivo es crear una aplicación web interna para la gestión de alquileres temporarios de propiedades. La aplicación debe permitir a un administrador (el usuario) gestionar propiedades, inquilinos, reservas, pagos y gastos, así como obtener informes financieros y de ocupación.

La aplicación será una PWA (Progressive Web App) para poder ser "instalada" en dispositivos móviles y de escritorio, y debe tener capacidades offline para la consulta de datos.

## 2. Flujo de Usuario y Funcionalidades Principales

### 2.1. Gestión de Propiedades
- **Añadir/Editar Propiedad:**
  - Campos: Nombre, Dirección, URL de imagen, ID de Google Calendar (opcional para futura sincronización), Plantilla de Contrato (texto largo), Campos personalizados (etiqueta y valor, para datos como "Clave WiFi", "Código de Alarma", etc.).
- **Listar Propiedades:**
  - Vista de tarjetas con imagen, nombre y dirección.
- **Detalle de Propiedad:**
  - Muestra toda la información de la propiedad.
  - Pestañas para ver:
    - **Reservas:** Lista de todas las reservas de esa propiedad.
    - **Gastos:** Lista de gastos asociados a la propiedad.
    - **Calendario de Ocupación:** Una vista de calendario (ej. 12 meses) que muestre visualmente los días ocupados.
  - Formulario para añadir una nueva reserva directamente desde aquí.
  - Formulario para añadir un nuevo gasto a la propiedad.

### 2.2. Gestión de Inquilinos
- **Añadir/Editar Inquilino:**
  - Campos: Nombre completo, DNI, Email, Teléfono, Dirección, Ciudad, País, Origen (lista desplegable configurable, ej: "Airbnb", "Booking", "Directo"), Notas.
- **Listar Inquilinos:**
  - Tabla con búsqueda y filtros.
  - Columnas: Nombre, DNI, Email, Teléfono.
  - Acciones por fila: Editar, Eliminar, Ver Historial de Reservas (enlaza a la pantalla de reservas filtrada por ese inquilino).

### 2.3. Gestión de Reservas
- **Crear/Editar Reserva:**
  - Asociada a una Propiedad y un Inquilino.
  - Fechas de Check-in y Check-out (selector de calendario que muestre días ya ocupados).
  - Monto del alquiler y Moneda (ARS/USD).
  - Estado del Contrato (desplegable: "No enviado", "Enviado", "Firmado", "No requerido").
  - Estado de la Garantía (desplegable: "No solicitada", "Solicitada", "Recibida", "Devuelta", "No aplica").
  - Notas de la reserva.
- **Listar Reservas:**
  - Tabla principal con filtros (por propiedad, por rango de fechas, por estado del contrato).
  - Columnas: Propiedad, Inquilino, Fechas, Noches, Monto, Saldo, Estado Contrato.
  - **Acciones Clave por Reserva:**
    - **Gestionar Pagos:** Abre un modal para ver, añadir, editar y eliminar pagos de esa reserva.
    - **Gestionar Gastos:** Abre un modal para gestionar gastos específicos de esa reserva (ej. comisión de plataforma).
    - **Ver/Generar Contrato:** Abre una nueva pestaña con el contrato generado a partir de la plantilla de la propiedad, rellenado con los datos de la reserva y el inquilino.
    - **Editar Reserva**.
    - **Eliminar Reserva**.

### 2.4. Gestión de Pagos y Gastos
- **Pagos (asociados a una reserva):**
  - Campos: Fecha, Monto, Moneda (ARS/USD). Si es ARS, se debe poder ingresar la cotización del dólar en ese momento para convertirlo a USD internamente.
  - El sistema debe calcular automáticamente el **saldo pendiente** de la reserva.
- **Gastos de Propiedad (fijos):**
  - Asociados a una propiedad.
  - Campos: Fecha, Descripción, Monto, Moneda (ARS/USD, con conversión), Categoría (configurable, ej: "Impuestos", "Mantenimiento", "Servicios").
- **Gastos de Reserva (variables):**
  - Asociados a una reserva.
  - Campos: Fecha, Descripción, Monto, Moneda (ARS/USD, con conversión), Categoría (configurable, ej: "Comisión Airbnb", "Limpieza").

### 2.5. Informes
- **Dashboard Principal (Página de Inicio):**
  - Tarjetas de KPI (Key Performance Indicators):
    - Ingresos totales (USD).
    - Resultado Neto (Ingresos - Gastos) (USD).
    - Total de propiedades activas.
    - Total de inquilinos.
  - Lista de "Próximos Check-ins" (próximos 7 días).
  - Lista de "Reservas en Curso".
- **Página de Informes Detallados:**
  - **Filtro por rango de fechas.**
  - **Resumen Financiero por Propiedad (Tabla):**
    - Filas: una por propiedad + fila de totales.
    - Columnas: Propiedad, Ingresos Totales, Gastos Totales, Resultado Neto. (Mostrar en ARS y USD).
  - **Gráficos:**
    - Gráfico de torta de Ingresos por Propiedad.
    - Gráfico de torta de Gastos por Categoría.
    - Gráfico de torta de Origen de Inquilinos.

### 2.6. Configuración
- Pestaña para gestionar **Categorías de Gastos** (CRUD simple: Crear, Leer, Actualizar, Eliminar).
- Pestaña para gestionar **Orígenes de Inquilinos** (CRUD simple: Nombre y un color asociado).
- Pestaña para gestionar **Plantillas de Email** (CRUD para plantillas de confirmación de pago, recordatorios, etc.).
- Pestaña para **Alertas**: campos numéricos para definir con cuántos días de anticipación mostrar alertas de check-in y check-out en el dashboard.

## 3. Requisitos Técnicos y de Estilo

- **Stack Tecnológico:** Next.js (App Router), React, TypeScript, Tailwind CSS.
- **UI/Componentes:** Utilizar **shadcn/ui** como base para todos los componentes (botones, tarjetas, tablas, modales, etc.). El diseño debe ser limpio, moderno y profesional.
- **Base de Datos:** **Firestore**. La estructura de datos debe ser flexible.
- **Autenticación:** Firebase Authentication (Login con Google).
- **Offline First:**
  - La aplicación debe cargar y ser navegable sin conexión.
  - Los datos consultados (propiedades, inquilinos, reservas) deben ser cacheados localmente usando la persistencia de Firestore para poder ser vistos offline.
  - Un Service Worker gestionará el cacheo de los assets de la aplicación (la "carcasa" o "app shell").
- **Estilo de Código:**
  - Código limpio, bien organizado y comentado donde sea necesario.
  - Componentes reutilizables.
  - Server Components por defecto en Next.js.
  - Server Actions para las mutaciones de datos (añadir, editar, eliminar).

## 4. Estructura de Archivos Sugerida

```
/src
├── /app
│   ├── /api (para futuras APIs)
│   ├── /(dashboard)
│   │   ├── /bookings
│   │   ├── /properties
│   │   ├── /tenants
│   │   ├── /reports
│   │   ├── /settings
│   │   └── layout.tsx
│   ├── /login
│   ├── layout.tsx
│   └── page.tsx (Dashboard)
├── /components
│   ├── /ui (componentes de shadcn)
│   ├── property-card.tsx
│   ├── booking-form.tsx
│   └── ...
├── /lib
│   ├── firebase.ts (configuración de Firebase)
│   ├── data.ts (funciones para leer datos de Firestore)
│   ├── actions.ts (Server Actions para escribir datos)
│   └── utils.ts (funciones de utilidad)
└── ...
```
