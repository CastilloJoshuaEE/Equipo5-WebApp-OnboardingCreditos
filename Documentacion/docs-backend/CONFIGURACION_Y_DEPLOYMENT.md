# Documentación de Configuración y Deployment - Backend Nexia

Este documento proporciona las instrucciones necesarias para configurar, desplegar y ejecutar el backend del sistema de créditos Nexia en diferentes entornos.

---

## Requisitos Previos

- **Node.js:** Versión 18 o superior.
- **npm:** Generalmente incluido con Node.js.
- **Cuenta en Supabase:** Un proyecto de Supabase (Plan gratuito es suficiente para desarrollo/pruebas).
- **Claves de API Externas:**
  - Brevo (para envío de emails)
  - Google Gemini (para el chatbot)
  - Didit (para verificación KYC)
  - (Opcional) AbstractAPI (para validación de emails)

---

## Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto `backend/` con las siguientes variables.  
**Nunca subas este archivo al repositorio.**

```dotenv
# ==================== PUERTO DEL SERVIDOR ====================
PORT=3001

# ==================== ENTORNO ====================
NODE_ENV=development   # Cambiar a 'production' en producción

# ==================== SUPABASE (CRÍTICO) ====================
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-supabase-service-role-key

# ==================== JWT ====================
JWT_SECRET=un-secreto-muy-largo-y-seguro-para-firmar-tokens

# ==================== EMAIL (Brevo) ====================
BREVO_API_KEY=tu-api-key-de-brevo
EMAIL_FROM_EMAIL=noreply@tudominio.com
EMAIL_FROM_NAME="Nexia Créditos"

# ==================== FRONTEND URL ====================
FRONTEND_URL=http://localhost:3000   # En producción: https://tudominio.com

# ==================== BACKEND URL ====================
BACKEND_URL=http://localhost:3001    # En producción: https://api.tudominio.com

# ==================== GEMINI AI ====================
GEMINI_API_KEY=tu-gemini-api-key

# ==================== DIDIT ====================
DIDIT_API_KEY=tu-didit-api-key
DIDIT_WEBHOOK_SECRET=tu-didit-webhook-secret

# ==================== ABSTRACT API (Opcional) ====================
ABSTRACT_API_KEY=tu-abstract-api-key
```

---

## Instrucciones para Obtener las Claves

### Supabase
1. Ve a **Project Settings** > **API**.
2. Copia:
   - Project URL
   - anon public key
   - service_role secret

### Brevo
1. Ve a **SMTP & API** > **API Keys**.
2. Crea una nueva clave.

### Gemini
1. Ve a Google AI Studio.
2. Genera una API key.

### Didit
1. Accede al panel de administración de tu cuenta.
2. Genera las claves necesarias.

### AbstractAPI
1. Regístrate en la plataforma.
2. Obtén tu API key desde el panel.

---

# Buckets de Storage (Supabase)

El sistema utiliza un bucket llamado:

```
kyc-documents
```

La configuración se intenta crear automáticamente al iniciar el servidor mediante:

```
config/configStorage.js
```

Sin embargo, se recomienda verificarlo manualmente.

### Configuración del Bucket

- **Nombre:** `kyc-documents`
- **Política de Acceso:** Público  
- Las subidas se gestionan desde el backend usando la `service_role key`.

---

## Estructura de Carpetas dentro del Bucket

```
documentos/{solicitud_id}/
contratos/
contratos-firmados/
comprobantes-transferencias/
plantilla/
```

### Descripción

- `documentos/{solicitud_id}/` → Documentos del solicitante (DNI, comprobantes, etc.)
- `contratos/` → Contratos generados (Word)
- `contratos-firmados/` → Contratos con firmas digitales
- `comprobantes-transferencias/` → Comprobantes PDF
- `plantilla/` → Plantillas subidas por operadores

---

# Puertos y URLs

### Desarrollo

- Backend:  
  `http://localhost:3001`

- Swagger UI:  
  `http://localhost:3001/api-docs`

- Health Check:  
  `http://localhost:3001/api/health`

### Producción

- Backend:  
  `https://api.tudominio.com`

---

## Conexión a Base de Datos

La conexión es gestionada completamente por Supabase mediante:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

No se expone directamente un puerto PostgreSQL.

---

# Servicios Externos

## Supabase

- Proyecto:  
  `https://tu-proyecto.supabase.co`

- Auth:  
  `https://tu-proyecto.supabase.co/auth/v1`

- REST API:  
  `https://tu-proyecto.supabase.co/rest/v1`

- Storage:  
  `https://tu-proyecto.supabase.co/storage/v1`

---

## Otras APIs

- Brevo:  
  `https://api.brevo.com/v3`

- Google Gemini:  
  `https://generativelanguage.googleapis.com`

- Didit:  
  `https://verification.didit.me/v2`

- BCRA:  
  `https://api.bcra.gob.ar`

---

# Comandos de Arranque y Gestión

Todos los comandos deben ejecutarse desde:

```
backend/
```

---

## Instalación de Dependencias

```bash
npm install
```

---

## Modo Desarrollo (con recarga automática)

```bash
npm run dev
```

Utiliza **nodemon** para reiniciar automáticamente el servidor cuando detecta cambios.

---

## Modo Producción

```bash
npm start
```

Asegúrate de tener:

```
NODE_ENV=production
```

---

## Scripts Útiles

```bash
# Reparar firmas si es necesario
npm run reparar-firmas
```

---

# Tips de Debugging

## Verificar Conexión a Supabase

- El servidor valida la conexión al iniciar.
- Si falla, revisa:
  - `SUPABASE_URL`
  - Claves en `.env`

---

## Logs del Servidor

Revisa la consola donde ejecutas:

```bash
npm run dev
```

El servidor imprime:

- Confirmación de controladores cargados
- Rutas montadas
- Errores de conexión
- Problemas con servicios externos

---

## Probar Endpoint Simple

```bash
curl http://localhost:3001/api/health
```

Debe devolver:

```json
{ "status": "OK" }
```

---

## Inspeccionar Rutas Montadas

Al iniciar, el servidor muestra todos los sub-routers y rutas registradas.  
Verifica que aparezcan rutas como:

```
/api/solicitudes
```

---

## Errores de CORS

Revisar:

```
config/cors.js
```

Verificar que:

- La URL del frontend esté en `allowedOrigins`
- Coincida con el dominio de Vercel/Render

---

## Errores de JWT

Verificar que el cliente envíe:

```
Authorization: Bearer <token>
```

Y que:

- El token no esté expirado
- El secreto coincida con la configuración

---

# Integración con Supabase (Detalles)

## Cliente Estándar (`supabaseClient`)

- Utilizado en la mayoría de operaciones.
- Respeta las políticas RLS (Row Level Security).
- Requiere JWT válido.

---

## Cliente Administrador (`supabaseAdmin`)

- Elude RLS.
- Utiliza `service_role key`.
- Se usa para:
  - Creación inicial de usuarios
  - Confirmación de emails
  - Subida de archivos a storage

---

## Esquema de Base de Datos

- Las tablas deben crearse en Supabase.
- Se recomienda usar migraciones SQL.
- Relaciones y claves foráneas se definen a nivel de base de datos.