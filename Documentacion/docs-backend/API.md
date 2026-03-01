# Documentación de la API REST - Backend Nexia

Esta documentación describe los endpoints disponibles para consumir la API del sistema de créditos Nexia. La API sigue los principios REST y utiliza JSON para el intercambio de datos.

**URL Base:** `http://localhost:3001/api` (Desarrollo) / `https://tu-dominio.com/api` (Producción)
**Documentación Interactiva:** [http://localhost:3001/api-docs](http://localhost:3001/api-docs) (Swagger UI)

---

## Autenticación

La mayoría de los endpoints requieren autenticación mediante un token JWT (JSON Web Token).

- **Tipo:** `Bearer Token`
- **Obtención:** El token se obtiene al iniciar sesión correctamente en el endpoint `/auth/login`.
- **Uso:** Incluir el token en el encabezado `Authorization` de la siguiente manera:
**Authorization: Bearer <tu_token_jwt>**
- **Roles de Acceso:**
  - `solicitante`: Usuario que solicita un crédito.
  - `operador`: Usuario interno que gestiona y revisa las solicitudes.
  - `admin`: Usuario con permisos de administración total (implícito en `operador`).

---

## Módulos y Endpoints

### Módulo de Autenticación (`/auth`)

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `POST` | `/registro` | Registra un nuevo usuario (solicitante u operador). | Público |
| `POST` | `/login` | Inicia sesión y devuelve un token JWT. | Público |
| `POST` | `/logout` | Cierra la sesión del usuario actual. | Usuario Autenticado |
| `GET`  | `/session` | Obtiene la información de la sesión actual. | Usuario Autenticado |
| `POST` | `/refresh` | Refresca un token de acceso expirado. | Público (con refresh token) |
| `GET`  | `/confirmar` | Confirma la dirección de correo electrónico de un usuario. | Público |
| `POST` | `/reenviar-confirmacion` | Reenvía el email de confirmación de cuenta. | Público |

### Módulo de Usuarios (`/usuarios` - Público y Autenticado)

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `POST` | `/verificar-email` | Verifica la validez de un email antes del registro. | Público |
| `POST` | `/recuperar-contrasena` | Inicia el proceso de recuperación de contraseña. | Público |
| `POST` | `/solicitar-reactivacion` | Solicita la reactivación de una cuenta inactiva. | Público |
| `GET`  | `/{id}/perfil` | Obtiene el perfil completo de un usuario por su ID. | `operador` |
| `PUT`  | `/{id}/perfil` | Actualiza el perfil de un usuario por su ID. | `operador` |
| `GET`  | `/{id}/perfil-publico` | Obtiene la información pública de un usuario. | `operador` |

### Módulo de Usuario Autenticado (`/usuarioautenticado`)

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `GET`  | `/perfil` | Obtiene el perfil del usuario autenticado. | Usuario Autenticado |
| `PUT`  | `/editar-perfil` | Edita el perfil del usuario autenticado. | Usuario Autenticado |
| `PUT`  | `/cambiar-contrasena` | Cambia la contraseña del usuario autenticado. | Usuario Autenticado |
| `GET`  | `/estado-confirmacion` | Verifica si el email del usuario está confirmado. | Usuario Autenticado |
| `PUT`  | `/desactivar-cuenta` | Desactiva la cuenta del usuario autenticado. | Usuario Autenticado |
| `GET`  | `/configuracion-cuenta` | Obtiene la configuración de la cuenta. | Usuario Autenticado |
| `PUT`  | `/email-recuperacion` | Actualiza el email de recuperación. | Usuario Autenticado |
| `GET`  | `/estado-cuenta` | Obtiene el estado de la cuenta (activa/inactiva). | Usuario Autenticado |

### Módulo de Solicitudes de Crédito (`/solicitudes`)

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Crea una nueva solicitud de crédito en estado "borrador". | `solicitante` |
| `GET`  | `/` | Obtiene las solicitudes del usuario autenticado. | Usuario Autenticado |
| `GET`  | `/mis-solicitudes` | Alias para obtener las solicitudes del usuario. | Usuario Autenticado |
| `GET`  | `/lista` | Obtiene todas las solicitudes del sistema (con filtros). | `operador` |
| `GET`  | `/{solicitud_id}` | Obtiene el detalle de una solicitud específica. | Propietario/Operador |
| `PUT`  | `/{solicitud_id}/enviar` | Envía una solicitud para revisión por parte de un operador. | `solicitante` |
| `PUT`  | `/{solicitud_id}/asignar` | Asigna un operador a una solicitud. | `operador` |
| `PUT`  | `/{solicitud_id}/aprobar` | Aprueba una solicitud de crédito. | `operador` |
| `PUT`  | `/{solicitud_id}/rechazar` | Rechaza una solicitud de crédito. | `operador` |
| `PUT`  | `/{solicitud_id}/solicitar-info` | Solicita información adicional al solicitante. | `operador` |
| `DELETE` | `/{solicitud_id}` | Elimina una solicitud en estado "borrador". | Propietario/Operador |

### Módulo de Documentos (`/documentos`)

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `GET`  | `/solicitud/{solicitud_id}` | Obtiene todos los documentos de una solicitud. | Propietario/Operador |
| `POST` | `/solicitud/{solicitud_id}` | Sube un nuevo documento a una solicitud. | `solicitante` |
| `PUT`  | `/{documento_id}/validar` | Valida o rechaza un documento. | `operador` |
| `GET`  | `/{documento_id}/descargar` | Descarga un documento específico. | Propietario/Operador |
| `PUT`  | `/{documento_id}` | Actualiza (reemplaza) un documento existente. | `solicitante` |
| `DELETE` | `/{documento_id}` | Elimina un documento. | `solicitante` |
| `POST` | `/{documento_id}/evaluar` | Evalúa un documento según criterios específicos. | `operador` |
| `GET`  | `/mis-solicitudes` | Obtiene solicitudes aprobadas con documentos disponibles. | Usuario Autenticado |
| `GET`  | `/todos` | Obtiene todos los documentos del sistema (contratos y comprobantes). | `operador` |

### Módulo de Firmas Digitales (`/firmas`)

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `POST` | `/iniciar-proceso/{solicitud_id}` | Inicia el proceso de firma digital para una solicitud aprobada. | `operador` |
| `GET`  | `/info-firma-word/{firma_id}` | Obtiene la información y el documento base64 para la firma. | Propietario/Operador |
| `POST` | `/procesar-firma-word/{firma_id}` | Procesa y guarda la firma de un firmante (solicitante/operador). | Propietario/Operador |
| `GET`  | `/descargar/{firma_id}` | Descarga el documento completamente firmado. | Propietario/Operador |
| `GET`  | `/estado/{firma_id}` | Verifica el estado actual del proceso de firma. | Propietario/Operador |
| `GET`  | `/pendientes` | Obtiene las firmas pendientes para el usuario autenticado. | Usuario Autenticado |
| `GET`  | `/ver-contrato-firmado/{firma_id}` | Visualiza el contrato firmado en el navegador. | Propietario/Operador |

### Módulo de Transferencias Bancarias (`/transferencias`)

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `GET`  | `/habilitacion/{solicitud_id}` | Verifica si una solicitud está habilitada para recibir una transferencia. | `operador` |
| `POST` | `/` | Crea y procesa una nueva transferencia bancaria. | `operador` |
| `GET`  | `/{transferencia_id}/comprobante/descargar` | Descarga el comprobante de una transferencia. | Propietario/Operador |
| `GET`  | `/{transferencia_id}/comprobante/ver` | Obtiene la URL pública para ver el comprobante. | Propietario/Operador |
| `GET`  | `/historial` | Obtiene el historial de transferencias del usuario. | Usuario Autenticado |
| `GET`  | `/mis-transferencias` | Obtiene las transferencias de un solicitante. | `solicitante` |

### Módulo de Comentarios (`/comentarios`)

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Crea un nuevo comentario en una solicitud. | Propietario/Operador |
| `GET`  | `/contador-no-leidos` | Obtiene el número de comentarios no leídos para el usuario. | Usuario Autenticado |
| `DELETE` | `/{id}` | Elimina un comentario (solo autor o `operador`). | Autor/Operador |

### Módulo de Contactos Bancarios (`/contactos-bancarios`)

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `GET`  | `/` | Obtiene todos los contactos bancarios. | `operador` |
| `POST` | `/` | Crea un nuevo contacto bancario. | `operador` |
| `GET`  | `/buscar` | Busca contactos por número de cuenta. | `operador` |
| `GET`  | `/mis-contactos` | Obtiene los contactos bancarios con información de los solicitantes. | `operador` |
| `PUT`  | `/{id}` | Actualiza un contacto bancario existente. | `operador` |
| `DELETE` | `/{id}` | Elimina (desactiva) un contacto bancario. | `operador` |

### Módulo de Notificaciones (`/notificaciones`)

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `GET`  | `/` | Obtiene las notificaciones del usuario autenticado. | Usuario Autenticado |
| `GET`  | `/contador-no-leidas` | Obtiene el contador de notificaciones no leídas. | Usuario Autenticado |
| `PUT`  | `/{id}/leer` | Marca una notificación como leída. | Usuario Autenticado |
| `PUT`  | `/leer-todas` | Marca todas las notificaciones del usuario como leídas. | Usuario Autenticado |

### Webhooks (`/webhooks`)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/didit` | Endpoint público para recibir actualizaciones de verificación KYC desde Didit. |

---

## Formato de Request y Response

### Ejemplo de Request (Registro de Usuario)

**Endpoint:** `POST /api/usuarios/registro`
**Headers:**
```json
{
"Content-Type": "application/json"
}
```
**Body:**
```json
{
  "email": "juan.perez@empresa.com",
  "password": "MiClaveSegura123",
  "nombre_completo": "Juan Pérez",
  "telefono": "+541112345678",
  "dni": "12345678",
  "rol": "solicitante",
  "nombre_empresa": "Pérez S.A.",
  "cuit": "30-12345678-9",
  "representante_legal": "Juan Pérez",
  "domicilio": "Av. Siempre Viva 123, CABA"
}
```
**Ejemplo de Response (Éxito)**
- Código de Estado: 201 Created 
```json
{
  "success": true,
  "status": 201,
  "message": "Usuario registrado correctamente. Por favor revisa tu email para confirmar tu cuenta",
  "data": {
    "user": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "email": "juan.perez@empresa.com",
      "app_metadata": {},
      "user_metadata": {
        "nombre_completo": "Juan Pérez",
        "telefono": "+541112345678",
        "dni": "12345678",
        "rol": "solicitante"
      }
    },
    "profile": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "nombre_completo": "Juan Pérez",
      "email": "juan.perez@empresa.com",
      "telefono": "+541112345678",
      "dni": "12345678",
      "rol": "solicitante",
      "cuenta_activa": false
    }
  }
}
```
**Ejemplo de Response (Error)**
- Código de Estado: 400 Bad Request
```json
{
  "success": false,
  "status": 400,
  "message": "Errores de validación en el registro",
  "errors": [
    "La contraseña debe tener al menos 8 caracteres",
    "La contraseña debe contener al menos un número"
  ]
}
```
# Parámetros de Entrada Comunes

## Query Params
Se utilizan para **filtrar, paginar y ordenar listados**.

**Ejemplo:**

GET /api/solicitudes/lista?estado=aprobado&page=1&limit=10

---

## Path Params
Se utilizan para **identificar un recurso específico**.

**Ejemplo:**

GET /api/solicitudes/{solicitud_id}

---

## Body (JSON)
Se utiliza en requests **POST, PUT y PATCH** para enviar datos.

**Ejemplo:**  
Ver request de registro arriba.

---

# Códigos de Estado HTTP

| Código | Descripción | Uso Común |
|--------|------------|-----------|
| 200 OK | La solicitud ha tenido éxito. | GET, PUT, DELETE exitosos. |
| 201 Created | La solicitud ha tenido éxito y se ha creado un nuevo recurso. | POST para crear un recurso. |
| 400 Bad Request | La solicitud no pudo ser procesada debido a un error del cliente (ej. validación fallida). | Campos faltantes, formato inválido. |
| 401 Unauthorized | La solicitud requiere autenticación del usuario. | Token no proporcionado o inválido. |
| 403 Forbidden | El servidor ha entendido la solicitud, pero se niega a autorizarla. | El usuario no tiene el rol adecuado. |
| 404 Not Found | El recurso solicitado no pudo ser encontrado. | ID de solicitud o documento inexistente. |
| 429 Too Many Requests | El usuario ha enviado demasiadas solicitudes en un período de tiempo. | Bloqueo por múltiples intentos de login fallidos. |
| 500 Internal Server Error | Error genérico del servidor. | Error inesperado en el backend. |

---

# Errores Comunes y Manejo

La API devuelve errores en un **formato JSON consistente**.  
Es importante manejar estos errores en el cliente para proporcionar una buena experiencia de usuario.

---

## Ejemplo de error por falta de permisos

```json
{
  "success": false,
  "status": 403,
  "message": "Solo los operadores pueden aprobar solicitudes"
}
```
## Ejemplo de error por recurso no encontrado
```json
{
  "success": false,
  "status": 404,
  "message": "Solicitud no encontrada"
}
```
## Ejemplo de error por validación
```json
{
  "success": false,
  "status": 400,
  "message": "Errores de validación",
  "errors": [
    "El monto debe ser mayor a 0",
    "El propósito debe tener al menos 10 caracteres"
  ]
}
```
## Ejemplo de bloqueo por intentos fallidos de login
```json
{
  "success": false,
  "status": 429,
  "message": "Cuenta temporalmente bloqueada por seguridad después de múltiples intentos fallidos. Espere 15 minutos o use la opción de 'Olvidaste tu contraseña?'"
}
```