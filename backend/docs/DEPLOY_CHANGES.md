# 🚀 Cambios para Deploy en Render

## 📝 Resumen

Este documento detalla todos los cambios realizados para preparar la aplicación backend para su deployment en Render.

---

## 🔧 Cambios Realizados

### 1. **package.json - Script de Inicio**

**Problema**: Render no encontraba el comando `start` porque no estaba definido en los scripts del package.json.

**Solución**: Agregamos el script `start` que utiliza Node.js en lugar de nodemon para producción.

```json
{
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "nodemon index.js",
    "start": "node index.js" // ← NUEVO
  }
}
```

**Impacto**: Ahora Render puede ejecutar `yarn start` o `npm start` correctamente.

---

### 2. **index.js - Configuración CORS Dinámica**

**Problema**: CORS estaba hardcodeado solo para `localhost:3000`, causando errores en producción.

**Antes**:

```javascript
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);
```

**Después**:

```javascript
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "*"
        : ["http://localhost:3000"],
    credentials: true,
  })
);
```

**Impacto**: La aplicación ahora acepta requests del frontend desplegado en Vercel.

---

### 3. **.env.example - Variables de Entorno Documentadas**

Creamos un archivo `.env.example` completo con todas las variables necesarias:

```env
# Variables de entorno necesarias para la aplicación
# Copia este archivo como .env y completa con tus valores reales

# Node.js environment (development/production)
NODE_ENV=development

# Puerto del servidor
PORT=

# URL del frontend
FRONTEND_URL=https://web-app-creditos.vercel.app

# Configuración de Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Configuración JWT
JWT_SECRET=
JWT_EXPIRE=3

# Configuración de Gmail para emails
GMAIL_USER=castle2004josh2@gmail.com
GMAIL_APP_PASSWORD=ckpszusmeltliyix
EMAIL_FROM_NAME=Sistema de Créditos
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# APIs opcionales para validación de email
HUBSPOT_ACCESS_TOKEN=
EMAIL_HUNTER_API_KEY=
ABSTRACT_API_KEY=
```

---

## 📊 Variables de Entorno Críticas para Render

### Variables Obligatorias:

- ✅ `NODE_ENV=production`
- ✅ `PORT` (Render lo configura automáticamente)
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

### Variables Recomendadas:

- ✅ `FRONTEND_URL=https://web-app-creditos.vercel.app`
- ✅ `JWT_SECRET`
- ✅ `JWT_EXPIRE=30d`

### Variables Opcionales (para funcionalidad de emails):

- ✅ `GMAIL_USER`
- ✅ `GMAIL_APP_PASSWORD`
- ✅ `EMAIL_FROM_NAME`
- ✅ `SMTP_HOST=smtp.gmail.com`
- ✅ `SMTP_PORT=587`
- ✅ `SMTP_SECURE=false`

---

## 🛠️ Pasos para Deploy en Render

### 1. Configuración en Render Dashboard:

1. Crear nuevo Web Service
2. Conectar repositorio GitHub
3. Configurar:
   - **Build Command**: `yarn` o `npm install`
   - **Start Command**: `yarn start` o `npm start`
   - **Environment**: Node.js

### 2. Variables de Entorno:

Configurar todas las variables listadas arriba en la sección "Environment Variables" de Render.

### 3. Deploy:

1. Push cambios al repositorio
2. Render detectará automáticamente los cambios
3. Iniciará build y deploy automático

---

## ✅ Verificaciones Post-Deploy

### Endpoints a Probar:

- `GET /api/health` - Health check
- `POST /api/usuarios/registro` - Registro de usuarios
- `POST /api/usuarios/login` - Login
- `GET /api/usuarios/session` - Verificar sesión
- `GET /api/usuario/perfil` - Perfil de usuario

### Logs a Monitorear:

- ✅ Conexión exitosa a Supabase
- ✅ Servidor escuchando en puerto correcto
- ✅ CORS configurado correctamente
- ✅ Variables de entorno cargadas

---

## 🔍 Troubleshooting

### Error Común: CORS Policy

**Causa**: Frontend no permitido en CORS
**Solución**: ✅ Ya implementada con configuración dinámica

### Error Común: Environment Variables

**Causa**: Variables no configuradas en Render
**Solución**: Verificar que todas las variables están configuradas en Render Dashboard

---

## 📅 Historial de Cambios

| Fecha      | Cambio                  | Archivo        | Estado |
| ---------- | ----------------------- | -------------- | ------ |
| 2025-10-03 | Agregado script `start` | `package.json` | ✅     |
| 2025-10-03 | CORS dinámico           | `index.js`     | ✅     |
| 2025-10-03 | Variables documentadas  | `.env.example` | ✅     |
| 2025-10-03 | Actualizado gitignore   | `.gitignore`   | ✅     |

---

## 🔗 Enlaces Útiles

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node-version)
- [Environment Variables on Render](https://render.com/docs/environment-variables)
- [Frontend Deploy on Vercel](https://web-app-creditos.vercel.app)

---
