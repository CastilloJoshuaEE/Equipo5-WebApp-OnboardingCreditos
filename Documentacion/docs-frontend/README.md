# Documentación del Frontend - Nexia

Bienvenido a la documentación técnica del frontend de la plataforma Nexia. Esta guía está diseñada para desarrolladores y tiene como objetivo proporcionar una comprensión profunda de la arquitectura, las decisiones de diseño y las convenciones de código utilizadas en el proyecto.

---

## . Índice de Documentación

- **[Arquitectura](./architecture.md)**
  - Visión general de la arquitectura del frontend.
  - Principios de diseño (Feature-Driven, Layered Architecture).
  - Descripción de las capas de la aplicación (UI, Domain, Application, Infrastructure, etc.).
  - Resumen del patrón arquitectónico.

- **[Consumo de API](./api-consumption.md)**
  - Detalles sobre el cliente HTTP (Axios) y sus interceptores.
  - Organización de los servicios de API en `src/services/`.
  - Estructura esperada de las respuestas del backend.
  - Patrón de uso de hooks personalizados para consumir APIs.

- **[Gestión del Estado](./state-management.md)**
  - Estrategias para diferentes tipos de estado: local, de servidor, compartido y de sesión.
  - Uso de hooks personalizados para el estado del servidor.
  - Aplicación del Context API para estado global.
  - Gestión de formularios con React Hook Form y Zod.

- **[Sistema de Componentes](./components.md)**
  - Filosofía de diseño basada en Material-UI (MUI).
  - Estructura de carpetas para componentes (`/components` y `/features/[feature]/components`).
  - Patrones de diseño comunes: Componentes de Página, de Presentación, de Contenedor y Wrappers de MUI.
  - Descripción de componentes clave.

---

## . Cómo Empezar a Contribuir

1. **Familiarízate con la arquitectura:**  
   Comienza leyendo el documento de [Arquitectura](./architecture.md) para entender cómo está organizado el proyecto.

2. **Comprende el flujo de datos:**  
   Revisa cómo se consumen las APIs y se gestiona el estado en [Consumo de API](./api-consumption.md) y [Gestión del Estado](./state-management.md).

3. **Explora los componentes:**  
   Mira la estructura de componentes en [Sistema de Componentes](./components.md) para entender cómo construir nueva UI.

---

## . Stack Tecnológico Principal

- **Framework:** Next.js 15 (con App Router)
- **Lenguaje:** TypeScript
- **UI Library:** Material-UI (MUI) v5
- **Autenticación:** NextAuth.js
- **HTTP Client:** Axios
- **Gestión de Formularios:** React Hook Form + Zod
- **Cliente Supabase:** @supabase/supabase-js

---

## . Estructura de Carpetas (Resumen)

```
src/
├── app/                # App Router de Next.js (páginas y API routes)
├── components/         # Componentes de UI compartidos y globales
│   ├── ui/             # Componentes de UI genéricos (wrappers de MUI)
│   ├── layout/         # Componentes de layout (navigation, headers)
│   └── ...             # Otros componentes compartidos (auth, chatbot, etc.)
├── features/           # Módulos de funcionalidad (Feature-Driven)
│   ├── auth/
│   ├── documentos/
│   ├── solicitudes/
│   └── ...             # Otras características (usuario, operador, etc.)
├── lib/                # Configuración de infraestructura (axios, supabase, auth)
├── providers/          # Proveedores de contexto global (Session, SessionExpired)
├── schemas/            # Esquemas de validación globales (Zod)
├── services/           # Servicios de API (capa de aplicación)
├── shared/             # Tipos y utilidades compartidas
├── styles/             # Configuración de temas y estilos globales
├── utils/              # Funciones de utilidad
└── middleware.ts       # Middleware de Next.js para protección de rutas
```

---

## . Configuración de Variables de Entorno

### . Archivo `.env.local`

Crear un archivo en la raíz del frontend llamado `.env.local` con el siguiente contenido:

> . **IMPORTANTE:**  
> Usa valores reales propios en lugar de los que aparecen aquí.  
> Donde corresponda, coloca: `PON_TU_CLAVE_AQUI`

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=PON_TU_CLAVE_AQUI
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=PON_TU_SUPABASE_URL_AQUI
NEXT_PUBLIC_SUPABASE_ANON_KEY=PON_TU_SUPABASE_ANON_KEY_AQUI
```

---

### . Archivo `.env.production`

Crear un archivo `.env.production` con la configuración de producción:

```
NEXTAUTH_URL=https://TU_DOMINIO_EN_PRODUCCION.com/
NEXTAUTH_SECRET=PON_TU_CLAVE_AQUI
NEXT_PUBLIC_API_URL=https://TU_BACKEND_EN_PRODUCCION.com/api
NEXT_PUBLIC_SUPABASE_URL=PON_TU_SUPABASE_URL_AQUI
NEXT_PUBLIC_SUPABASE_ANON_KEY=PON_TU_SUPABASE_ANON_KEY_AQUI
```

---

Esta documentación sirve como guía estructural y técnica para mantener el frontend de Nexia escalable, mantenible y alineado con buenas prácticas modernas de desarrollo en Next.js.
