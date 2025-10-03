# Documentación API con Swagger

Este proyecto utiliza Swagger/OpenAPI 3.0 para documentar toda la API REST del sistema de créditos.

## 🌐 Acceso a la documentación

Una vez que el servidor esté ejecutándose, puedes acceder a la documentación interactiva en:

**URL de desarrollo:** http://localhost:3000/api-docs
**URL de producción:** https://tu-dominio.com/api-docs

## 📋 Características de la documentación

### ✅ Endpoints documentados

La documentación incluye todos los endpoints de la API organizados por categorías:

- **Autenticación** - Registro, login, logout, sesión
- **Confirmación** - Confirmación de email, reenvío, verificación
- **Usuario** - Perfil, actualización, desactivación
- **Administración** - Gestión de usuarios (solo operadores)

### 🔐 Autenticación en Swagger

1. **Obtener token JWT:**

   - Usa el endpoint `POST /api/usuarios/login`
   - Proporciona email y contraseña válidos
   - Copia el `token` de la respuesta

2. **Configurar autenticación:**

   - Haz clic en el botón `Authorize` 🔒 en la parte superior
   - Escribe: `Bearer tu_token_aqui`
   - Haz clic en `Authorize`

3. **Probar endpoints protegidos:**
   - Ahora puedes probar todos los endpoints que requieren autenticación

### 📊 Esquemas de datos

La documentación incluye esquemas detallados para:

- **Usuario** - Estructura completa del usuario
- **UsuarioRegistro** - Datos requeridos para registro
- **Login** - Credenciales de acceso
- **Response** - Formato estándar de respuestas exitosas
- **Error** - Formato estándar de respuestas de error

### 🧪 Probar la API

Cada endpoint incluye:

- ✅ Descripción detallada
- ✅ Parámetros requeridos y opcionales
- ✅ Ejemplos de peticiones
- ✅ Códigos de respuesta posibles
- ✅ Botón "Try it out" para probar directamente

## 🔧 Usuarios de prueba

Para probar la API, puedes usar estos usuarios creados automáticamente:

### Operador (Admin)

- **Email:** jomeregildo64@gmail.com
- **Contraseña:** operador1234
- **Permisos:** Acceso completo + rutas administrativas

### Solicitante (Usuario)

- **Email:** joshuamerejildo846@gmail.com
- **Contraseña:** cliente123
- **Permisos:** Rutas básicas de usuario

## 📝 Ejemplos de uso

### 1. Registrar nuevo usuario

```bash
POST /api/usuarios/registro
{
  "email": "nuevo@ejemplo.com",
  "password": "password123",
  "nombre_completo": "Nuevo Usuario",
  "documento_identidad": "12345678",
  "telefono": "+573001234567",
  "rol": "solicitante"
}
```

### 2. Iniciar sesión

```bash
POST /api/usuarios/login
{
  "email": "nuevo@ejemplo.com",
  "password": "password123"
}
```

### 3. Obtener perfil (requiere token)

```bash
GET /api/usuario/perfil
Headers: Authorization: Bearer tu_token_aqui
```

## 🛠️ Para desarrolladores

### Agregar nuevos endpoints

Para documentar nuevos endpoints, agrega comentarios JSDoc en el archivo de rutas:

```javascript
/**
 * @swagger
 * /api/nuevo-endpoint:
 *   post:
 *     summary: Descripción del endpoint
 *     tags: [Categoría]
 *     description: Descripción detallada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               campo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
```

### Agregar nuevos esquemas

Para agregar nuevos esquemas de datos, agrégalos en la sección `components/schemas`:

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     NuevoEsquema:
 *       type: object
 *       properties:
 *         campo1:
 *           type: string
 *           description: Descripción del campo
 */
```

## 🚀 Configuración

La configuración de Swagger se encuentra en `index.js`:

- **Título:** API Sistema de Créditos
- **Versión:** 1.0.0
- **Formato:** OpenAPI 3.0.0
- **Seguridad:** JWT Bearer Token
- **Archivos fuente:** `./routes/*.js`, `./controladores/*.js`

## 📚 Recursos adicionales

- [Documentación oficial de Swagger](https://swagger.io/docs/)
- [Especificación OpenAPI 3.0](https://spec.openapis.org/oas/v3.0.0)
- [JSDoc para Swagger](https://github.com/Surnet/swagger-jsdoc)
