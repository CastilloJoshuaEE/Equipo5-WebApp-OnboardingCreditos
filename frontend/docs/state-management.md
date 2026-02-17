# Gestión del Estado

La gestión del estado en la aplicación Nexia sigue un enfoque pragmático y descentralizado, utilizando las herramientas que React y Next.js proporcionan de forma nativa, evitando la complejidad de librerías externas como Redux a menos que sea estrictamente necesario.

---

## Principios de Gestión de Estado

1. **Estado Local (Component State):**  
   Se utiliza `useState` y `useReducer` para el estado que pertenece a un solo componente, como la entrada de un formulario, la visibilidad de un modal o el valor de una pestaña activa.

2. **Estado de Servidor (Server State):**  
   El estado que se sincroniza con el backend (ej. listas de solicitudes, documentos) se gestiona mediante **hooks personalizados** que encapsulan la lógica de fetching, caché y actualización.  
   Estos hooks suelen utilizar `useState` y `useEffect` internamente.  

   Para operaciones de mutación (POST, PUT, DELETE), se actualiza el estado local después de una respuesta exitosa del servidor para mantener la UI sincronizada.

3. **Estado Compartido (Shared State):**  
   Para el estado que debe ser accesible por múltiples componentes en diferentes partes del árbol de componentes, se utiliza el **Context API de React**.

4. **Estado de la Sesión (Session State):**  
   La autenticación y los datos de la sesión del usuario se gestionan exclusivamente a través de **NextAuth.js**.  
   El hook `useSession()` de NextAuth es la fuente de verdad para la información del usuario autenticado en toda la aplicación.

---

## Estado de Servidor con Hooks Personalizados

Esta es la estrategia principal para manejar datos provenientes de la API. Cada entidad o funcionalidad principal tiene su propio hook que expone el estado y las operaciones relacionadas.

### Ejemplo: `src/features/solicitudes/hooks/useSolicitudes.ts` (Conceptual)

```typescript
import { useState, useCallback } from 'react';
import { SolicitudesService } from '@/services/solicitudes.service';
import { Solicitud } from '@/features/solicitudes/solicitud.types';

export const useSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarSolicitudes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await SolicitudesService.obtenerMisSolicitudes();
      setSolicitudes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const crearSolicitud = useCallback(async (nuevaSolicitud: any) => {
    setLoading(true);
    setError(null);
    try {
      const solicitudCreada = await SolicitudesService.crearSolicitud(nuevaSolicitud);
      // Actualizar la lista local después de una creación exitosa
      setSolicitudes(prev => [solicitudCreada, ...prev]);
      return solicitudCreada;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    solicitudes,
    loading,
    error,
    cargarSolicitudes,
    crearSolicitud,
  };
};
```

Los componentes que necesitan solicitudes simplemente usan este hook, manteniéndose limpios y enfocados en la UI.

---

## Estado Compartido con Context API

El Context API se reserva para estados globales que son transversales a la aplicación.

### SessionSyncProvider (`src/context/SessionSyncProvider.tsx`)

Este proveedor sincroniza el estado de la sesión de NextAuth con un contexto local y proporciona un método `refreshSession`.  
Esto es útil para componentes que necesitan reaccionar a cambios en la sesión sin estar directamente acoplados al hook `useSession()`.

### SessionExpiredProvider (`src/providers/SessionExpiredProvider.tsx`)

Este proveedor escucha los eventos de sesión expirada emitidos por el interceptor de Axios y muestra un modal global para informar al usuario.

---

## Estado de Formularios con React Hook Form y Zod

Para formularios complejos, como el de registro (`RegisterForm`) o creación de solicitudes (`SolicitudCreditoForm`), se utiliza la librería React Hook Form en combinación con Zod para la validación.

- **useForm:**  
  Gestiona el estado del formulario, el registro de campos, el envío y la validación.

- **zodResolver:**  
  Integra los esquemas de Zod con React Hook Form, asegurando que los datos del formulario cumplan con las reglas de negocio definidas antes de ser enviados.

- **Estado del Formulario:**  
  El estado de los campos (valores, errores, dirty state) es gestionado internamente por React Hook Form, optimizando las re-renderizaciones.

### Ejemplo de integración

```typescript
// En un componente de formulario
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { solicitudCreditoSchema } from '@/schemas/solicitud.schema';

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(solicitudCreditoSchema),
  defaultValues: { moneda: 'ARS' }
});
```

---

## Resumen de la Estrategia

| Tipo de Estado            | Herramienta/Patrón Principal     | Ejemplo de Uso                                  |
|---------------------------|----------------------------------|-------------------------------------------------|
| Estado Local              | useState, useReducer             | `tabValue` en `DocumentosOperadorPage`          |
| Estado del Servidor       | Hooks Personalizados             | `useDocumentos().obtenerComprobantes()`         |
| Estado Global/Aplicación  | Context API                      | `SessionSyncProvider`, `SessionExpiredProvider` |
| Estado de Sesión          | NextAuth `useSession()`          | `session.user.rol` en `DynamicNavigation`       |
| Estado de Formularios     | React Hook Form + Zod            | `RegisterForm`, `SolicitudCreditoForm`          |
