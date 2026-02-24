# Equipo 5 - WebApp: Plataforma de Onboarding de Créditos para PYMES


## Integrantes del Equipo
---
###  Desarrollador
**Joshúa Castillo**  
.https://www.linkedin.com/in/joshúa-castillo/

### QA Tester
**Eudes Mieres**  
.https://www.linkedin.com/in/eudesmieres/

### UX/UI Designer
**Diego Marin**  
.https://www.linkedin.com/in/diegomarinmora/

---
## Vertical
Web App

## Sector de Negocio
Fintech

## Necesidad del Cliente
Las PYMES requieren financiación rápida y procesos de solicitud de crédito menos burocráticos.  
Los bancos y fintechs necesitan:
- Recopilar y validar información de manera digital.
- Reducir tiempos de aprobación.
- Mejorar la experiencia del usuario.

## Validación de Mercado
Las fintechs y bancos usan plataformas digitales para:
- Gestionar cuentas y transferencias.
- Solicitar créditos sin código complejo.
- Automatizar la evaluación de riesgo y reducir tiempos de aprobación.

## Expectativa del Proyecto
Desarrollar una aplicación web en la que las PYMES puedan:
- Solicitar créditos.
- Cargar documentos.
- Firmar digitalmente.
- Conocer el estado de su solicitud en tiempo real.

La plataforma incluirá paneles para operadores con filtros y tareas.

## Entregables Deseados
- Web app funcional con formulario de solicitud y carga de documentos.
- Integración con servicios de verificación de identidad (KYC/AML).
- Panel de administración para revisar solicitudes y actualizar estados.
- Manual de usuario y documentación de API.

## Funcionalidades

### Must-have
- Registro de usuario y autenticación segura.
- Formulario dinámico que guarde avances.
- Carga de documentos y firma digital.

### Nice-to-have
- Chat de soporte (bot o humano) para dudas.
### Enlaces del Proyecto

Frontend (Next.js desplegado en Vercel):
. https://nexia-sigma.vercel.app/ 

Backend (API REST desplegada en Render):
. https://equipo5-webapp-onboardingcreditos-backend.onrender.com/api-docs


## Prototipo en Figma (Web)

.https://www.figma.com/proto/QS9wwLxdJyBR8AbzUX9Mza/Fintech---No--Country?page-id=0%3A1&node-id=1858-15553&viewport=224%2C190%2C0.29&t=WN5ioZD8tjIiBtTW-1&scaling=scale-down&contentscaling=fixed&starting-point-node-id=1858%3A15553&show-proto-sidebar=1

---

##  Prototipo en Figma (Cellphone)

.https://www.figma.com/proto/QS9wwLxdJyBR8AbzUX9Mza/Fintech---No--Country?pageid=561%3A11823&node-id=1080-12041&viewport=-3098%2C190%2C0.5&t=9nU1S21uF0TnB04e-1&scaling=scale-down&contentscaling=fixed&starting-point-node-id=1080%3A12041&show-proto-sidebar=1

---

##  Video Demostrativo



---

## Documentación de KPI

.https://drive.google.com/file/d/1KmkYbijZG3_Heubo62XGkqNrWOWkZS1f/view

---

## Documentos del Proyecto
**[Documentos de la base de datos](./database/docs/schema_overview.md)**
**[Documentos del frontend](./frontend/docs/README.md)**
**[Documentos del QA tester](./Documentacion/DocsQATester/)**
**[Documentos adicionales](./Documentacion/plantilla_documentos)**
### Si deseas usar este programa en local
Si deseas ejecutar el proyecto en tu entorno local, puedes descargar o clonar este repositorio.
Luego, instala las dependencias:
npm install
Y crea un archivo .env (o .env.local para el frontend) en la raíz del proyecto con las siguientes variables de entorno.
### Variables de entorno requeridas
PORT=0000
SUPABASE_URL="tu_url_supabase_aqui"
SUPABASE_ANON_KEY="tu_anon_key_aqui"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key_aqui"
NODE_ENV=development
JWT_SECRET="tu_jwt_secret_aqui"
JWT_EXPIRE=30d

EMAIL_FROM_NAME="Nexia"
BREVO_API_KEY="tu_brevo_api_key_aqui"
EMAIL_SERVICE=brevo-api
EMAIL_FROM_EMAIL="tu_correo_aqui"

FRONTEND_URL=http://localhost:0000
BACKEND_URL=http://localhost:0001

ABSTRACT_API_KEY="tu_api_key_aqui"
DIDIT_API_KEY="tu_api_key_aqui"
DIDIT_WEBHOOK_SECRET="tu_webhook_secret_aqui"
DIDIT_WORKFLOW_ID="tu_workflow_id_aqui"
GEMINI_API_KEY="tu_gemini_api_key_aqui"

# Configuración de firmas digitales
FIRMA_DIGITAL_EXPIRACION_DIAS=7
FIRMA_DIGITAL_MAX_REINTENTOS=3
FIRMA_DIGITAL_TIMEZONE=America/Mexico_City

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu_nextauth_secret_aqui"
NEXT_PUBLIC_API_URL="http://localhost:3001/api-docs"
NEXT_PUBLIC_SUPABASE_URL="tu_url_supabase_aqui"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_anon_key_aqui"
