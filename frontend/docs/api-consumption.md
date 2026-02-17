# Consumo de API

## Descripción General

La comunicación entre el frontend y el backend se realiza a través de una API REST. El frontend actúa como un cliente que consume los endpoints expuestos por el servidor backend (que corre en `http://localhost:3001/api` en desarrollo, configurable vía `NEXT_PUBLIC_API_URL`).

---

## Cliente HTTP: Axios

Todas las peticiones HTTP se gestionan a través de una instancia centralizada de **Axios**, configurada en `src/lib/axios.ts`. Esta instancia proporciona una capa de abstracción y funcionalidades críticas:

- **URL Base:** Configura automáticamente la URL base para todas las peticiones.
- **Interceptores de Petición (Request Interceptors):**
  - Antes de enviar una solicitud, el interceptor obtiene la sesión actual de NextAuth (`getSession()`).
  - Si existe un `accessToken` en la sesión, lo añade automáticamente al encabezado `Authorization` como `Bearer ${accessToken}`. Esto asegura que todas las peticiones autenticadas incluyan el token.
  - Incluye una lógica para verificar la proximidad de la expiración del token y, si es posible, intenta refrescarlo automáticamente usando el `refreshToken`.
- **Interceptores de Respuesta (Response Interceptors):**
  - **Manejo de Error 401 (No Autorizado):** Si la API responde con un `401`, el interceptor intenta refrescar el token automáticamente una vez. Si falla, emite un evento `expired` a través de `sessionEmitter`, lo que provoca que el `SessionExpiredProvider` muestre un modal al usuario y lo redirija al login.
  - **Manejo de Error 403 (Prohibido):** Emite un evento `unauthorized`.
  - **Manejo de Errores Específicos:** Detecta errores como "Too Many Requests" y muestra una alerta amigable al usuario.

---

## Servicios de API (`src/services/`)

Para mantener el código limpio y desacoplado, las llamadas a la API no se realizan directamente desde los componentes. En su lugar, se encapsulan en módulos de servicio dentro de la carpeta `src/services/`. Estos servicios utilizan la instancia de `axios` configurada.

### Ejemplo: `src/services/documentos/documentos.service.ts`

```typescript
import api from '@/lib/axios';
// ... imports de tipos

export const DocumentosService = {
  async obtenerDocumentosContrato(solicitudId: string): Promise<{ contrato: DocumentoContrato; firma: any }> {
    // 'api' ya tiene la baseURL y los interceptores
    const response = await api.get(`/solicitudes/${solicitudId}/contrato/documentos`);
    return response.data.data; // Se asume una estructura de respuesta { success: boolean, data: T }
  },

  async descargarComprobante(transferenciaId: string): Promise<Blob> {
    const response = await api.get(`/transferencias/${transferenciaId}/comprobante/descargar`, {
      responseType: 'blob', // Importante para archivos
    });
    return response.data;
  },
  // ... otros métodos
};
```

---

## Estructura de Respuesta de la API

Se espera que el backend responda con una estructura JSON consistente, facilitando el manejo de errores y datos en el frontend.

```typescript
// src/shared/types/api.types.ts
export interface ApiResponse<T = any> {
  success: boolean;   // Indica si la operación fue exitosa
  message: string;    // Mensaje para el usuario (éxito o error)
  data?: T;           // Payload de la respuesta (opcional)
}
```

Los servicios del frontend están diseñados para extraer y devolver la propiedad `data` cuando la operación es exitosa, o lanzar un error con el `message` recibido.

---

## Uso de Hooks Personalizados para Consumir APIs

Los componentes de React no consumen los servicios directamente. En su lugar, utilizan hooks personalizados (ubicados en `src/features/[feature]/hooks/`) que encapsulan la lógica de estado (carga, error, datos) y las llamadas a los servicios.

### Ejemplo: `src/features/documentos/hooks/useDocumentos.ts`

```typescript
import { useState, useCallback } from 'react';
import { DocumentosService } from '@/services/documentos/documentos.service';

export const useDocumentos = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerDocumentosContrato = useCallback(async (solicitudId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await DocumentosService.obtenerDocumentosContrato(solicitudId);
      return data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al obtener documentos';
      setError(errorMsg);
      throw err; // Re-lanzar para que el componente pueda manejarlo si es necesario
    } finally {
      setLoading(false);
    }
  }, []);

  // ... otros métodos

  return {
    loading,
    error,
    obtenerDocumentosContrato,
    // ...
  };
};
```

---

## Ventajas de Este Patrón

Este patrón ofrece varias ventajas:

- Centraliza el estado de la petición (`loading`, `error`).
- Desacopla los componentes de la lógica de llamada a la API.
- Mejora la reutilización de la lógica de datos.
- Facilita las pruebas al poder simular el hook.
