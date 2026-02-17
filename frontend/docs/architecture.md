# Arquitectura del Frontend

## Visión General

El frontend de la plataforma Nexia está construido sobre una arquitectura moderna, modular y escalable. El núcleo de la aplicación es **Next.js con App Router**, lo que proporciona un enrutamiento basado en el sistema de archivos y capacidades de renderizado tanto del lado del servidor (SSR) como del cliente (CSR).

La organización del código sigue un patrón de **Arquitectura Modular Basada en Características (Feature-Driven Architecture)**. Esto significa que la lógica de la aplicación se agrupa por funcionalidad de negocio en lugar de por tipo de archivo técnico. Esta estructura mejora la mantenibilidad, la escalabilidad y la facilidad para que los equipos trabajen en paralelo.

## Principios Arquitectónicos Fundamentales

1.  **Separación por Dominio (Feature-Driven):** El código se organiza principalmente en módulos `features/`, cada uno encapsulando todo lo relacionado con una capacidad de negocio específica (ej. `auth`, `solicitudes`, `documentos`).
2.  **Separación por Capas (Layered Architecture):** Dentro de cada característica y a nivel global, se mantiene una separación clara de responsabilidades: UI (componentes), lógica de aplicación (servicios, hooks) y acceso a datos/infraestructura (servicios, librerías).
3.  **Enrutamiento Basado en Sistema de Archivos (File-System Routing):** Utiliza el App Router de Next.js (`src/app/`), donde la estructura de carpetas define las rutas de la aplicación.
4.  **Agrupación de Rutas (Route Grouping):** Se emplean grupos de rutas `(auth)` y `(dashboard)` para organizar layouts y lógica específica para secciones autenticadas y no autenticadas de la aplicación sin afectar la estructura de la URL.
5.  **Tipado Estricto:** TypeScript es fundamental en toda la aplicación, asegurando la integridad de los datos en cada capa y mejorando la experiencia de desarrollo con autocompletado y detección temprana de errores.
## Nombre del Patrón Arquitectónico

**`Next.js App Router + Feature-Driven Modular Architecture con separación por capas (Layered Frontend Architecture).`**

## Capas de la Arquitectura (Layered View)

La aplicación se puede visualizar como una serie de capas concéntricas, donde las capas externas pueden depender de las internas, pero no al revés.

-   **Capa de Presentación (UI Layer):** `src/components/`
    -   **Contenido:** Componentes de UI reutilizables, puramente de presentación. Aquí residen los componentes atómicos y moleculares de la interfaz (botones, inputs, modales, cards, etc.) construidos con Material-UI (MUI). También se incluyen componentes de layout global.
    -   **Responsabilidad:** Renderizar la interfaz de usuario y manejar las interacciones del usuario, delegando la lógica de negocio a las capas inferiores.
-   **Capa de Dominio (Domain Layer):** `src/features/`
    -   **Contenido:** El corazón de la lógica de negocio. Cada subcarpeta (`auth`, `solicitudes`, `usuario`, etc.) es un módulo independiente que contiene todo lo necesario para esa funcionalidad:
        -   **Hooks personalizados:** (`hooks/useDocumentos.ts`) Encapsulan la lógica de estado y las interacciones con los servicios.
        -   **Tipos y Schemas:** (`*.types.ts`, `*.schema.ts`) Definen las estructuras de datos y las validaciones (usando Zod) específicas del dominio.
        -   **Servicios:** (`services/`) Actúan como un punto de entrada a la capa de aplicación para esta característica.
    -   **Responsabilidad:** Orquestar la lógica de negocio para una característica específica, coordinando entre la UI y los servicios de aplicación/infraestructura.
-   **Capa de Aplicación (Application Layer):** `src/services/`
    -   **Contenido:** Servicios que orquestan casos de uso de la aplicación. Son los responsables de realizar llamadas a la API (a través de `axios`), gestionar la autenticación con NextAuth, y manipular datos. No contienen lógica de UI.
    -   **Responsabilidad:** Gestionar el flujo de datos entre la capa de dominio y la capa de infraestructura.
-   **Capa de Infraestructura (Infrastructure Layer):** `src/lib/`
    -   **Contenido:** Configuración de clientes externos y herramientas. Ejemplos notables son `axios.ts` (cliente HTTP configurado con interceptores) y `supabase.ts` (cliente de Supabase). Aquí también se configura NextAuth (`auth.ts`).
    -   **Responsabilidad:** Actuar como un adaptador entre la aplicación y los servicios externos (API, Supabase, etc.). Esta capa aísla a la aplicación de los detalles de implementación de terceros.
-   **Capa de Validación (Validation Layer):** `src/schemas/`
    -   **Contenido:** Esquemas de validación globales y reutilizables, definidos con la librería **Zod**.
    -   **Responsabilidad:** Validar la integridad de los datos en los límites de la aplicación, como en los formularios de entrada del usuario.
-   **Núcleo Compartido (Shared Kernel):** `src/shared/`, `src/utils/`, `src/context/`
    -   **Contenido:** Utilidades, tipos genéricos, contexto global (como `SessionSyncProvider`) y otros elementos que son compartidos por múltiples características.
    -   **Responsabilidad:** Proporcionar funcionalidad común y reutilizable en toda la aplicación sin crear dependencias circulares.

