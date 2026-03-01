
---

### **Documentación de Arquitectura Backend**

**Nombre del archivo:** `architecture.md`

```markdown
# Documentación de Arquitectura Backend - Nexia

Este documento describe la arquitectura general del backend del sistema de créditos Nexia, proporcionando una visión global de su estructura, capas y flujo de datos.

---

## Diagrama de Capas (Arquitectura Limpia)

El backend está estructurado siguiendo los principios de la **Arquitectura Limpia** (Clean Architecture), separando las responsabilidades en capas concéntricas para mantener el código desacoplado, testeable y mantenible.
# Estructura del Backend

```bash
backend/
│
├── index.js
│
├── config/
│   ├── cors.js
│   └── configStorage.js
│
├── domain/
│   ├── entities/
│   │   ├── Usuario.js
│   │   ├── Solicitante.js
│   │   ├── Operador.js
│   │   ├── Solicitud.js
│   │   ├── SolicitudInformacion.js
│   │   ├── Documento.js
│   │   ├── IntentoLogin.js
│   │   │
│   │   ├── ContactoBancario.js
│   │   ├── Contrato.js
│   │   ├── FirmaDigital.js
│   │   │
│   │   ├── TransferenciaBancaria.js
│   │   ├── ComprobanteTransferencia.js
│   │   │
│   │   ├── PlantillaDocumento.js
│   │   ├── ReactivacionCuenta.js
│   │   ├── AuditoriaPlantilla.js
│   │   │
│   │   ├── ChatbotInteraccion.js
│   │   ├── Comentario.js
│   │   │
│   │   ├── Notificacion.js
│   │   ├── VerificacionKYC.js
│   │   └── WebhookPayload.js
│
│   └── repositories/
│       ├── UsuarioRepository.js
│       ├── SolicitanteRepository.js
│       ├── OperadorRepository.js
│       ├── SolicitudRepository.js
│       ├── SolicitudInformacionRepository.js
│       ├── DocumentoRepository.js
│       ├── IntentoLoginRepository.js
│       │
│       ├── ContactoBancarioRepository.js
│       ├── ContratoRepository.js
│       ├── FirmaDigitalRepository.js
│       │
│       ├── TransferenciaBancariaRepository.js
│       │
│       ├── PlantillaDocumentoRepository.js
│       ├── ReactivacionCuentaRepository.js
│       │
│       ├── ChatbotRepository.js
│       ├── ComentarioRepository.js
│       │
│       ├── NotificacionRepository.js
│       └── VerificacionKYCRepository.js
│
├── application/
│   ├── services/
│   │   ├── GestionSolicitudService.js
│   │   └── NotificacionEmailService.js
│
│   └── use-cases/
│
│       ├── auth/
│       │   ├── LoginUsuario.js
│       │   ├── RegistrarUsuario.js
│       │   ├── RefrescarToken.js
│       │   ├── CerrarSesion.js
│       │   └── ObtenerSesion.js
│
│       ├── usuario/
│       │   ├── ObtenerPerfil.js
│       │   ├── ObtenerPerfilPorId.js
│       │   ├── ObtenerPerfilUsuario.js
│       │   ├── ActualizarPerfil.js
│       │   ├── ActualizarPerfilPorId.js
│       │   ├── CambiarContrasena.js
│       │   ├── RecuperarContrasena.js
│       │   ├── SolicitarRecuperacionCuenta.js
│       │   ├── DesactivarCuenta.js
│       │   ├── ActualizarEmailRecuperacion.js
│       │   ├── VerificarEstadoCuenta.js
│       │   ├── ObtenerConfiguracionCuenta.js
│       │   ├── EliminarCuenta.js
│       │   └── GestionUsuarios.js
│
│       ├── operador/
│       │   ├── ObtenerDashboard.js
│       │   ├── IniciarRevisionSolicitud.js
│       │   └── ValidarDocumento.js
│
│       ├── solicitudes/
│       │   ├── CrearSolicitud.js
│       │   ├── ObtenerMisSolicitudes.js
│       │   ├── ObtenerTodasSolicitudes.js
│       │   ├── ObtenerSolicitudDetalle.js
│       │   ├── EnviarSolicitud.js
│       │   ├── AprobarSolicitud.js
│       │   ├── RechazarSolicitud.js
│       │   ├── ObtenerEstadisticasSolicitudes.js
│       │   ├── SolicitarInformacionAdicional.js
│       │   ├── IniciarVerificacionKYC.js
│       │   └── AsignarOperadorAutomatico.js
│
│       ├── documentos/
│       │   ├── SubirDocumento.js
│       │   ├── ObtenerDocumentosSolicitud.js
│       │   ├── ValidarDocumento.js
│       │   ├── DescargarDocumento.js
│       │   ├── ActualizarDocumento.js
│       │   ├── EliminarDocumento.js
│       │   ├── EvaluarDocumento.js
│       │   ├── ObtenerHistorialEvaluaciones.js
│       │   ├── ObtenerDocumentosContrato.js
│       │   ├── ListarDocumentosStorage.js
│       │   ├── ObtenerComprobantesTransferencia.js
│       │   ├── DescargarContrato.js
│       │   ├── DescargarComprobante.js
│       │   ├── VerDocumento.js
│       │   ├── ObtenerMisSolicitudesConDocumentos.js
│       │   └── ObtenerTodosLosDocumentos.js
│
│       ├── contratos/
│       │   ├── GenerarContratoParaSolicitud.js
│       │   ├── VerificarEstadoContrato.js
│       │   ├── ObtenerContenidoContrato.js
│       │   ├── ObtenerContratosUsuario.js
│       │   └── ObtenerEstadisticasContratos.js
│
│       ├── firmas/
│       │   ├── IniciarProcesoFirma.js
│       │   ├── ObtenerInfoFirma.js
│       │   ├── ProcesarFirma.js
│       │   ├── DescargarDocumentoFirmado.js
│       │   ├── ObtenerFirmasPendientes.js
│       │   ├── ObtenerAuditoriaFirma.js
│       │   ├── ObtenerEstadisticasFirmas.js
│       │   ├── RenovarFirmaExpirada.js
│       │   ├── RepararRelacionFirmaContrato.js
│       │   ├── VerificarFirmaExistente.js
│       │   └── ReiniciarProcesoFirma.js
│
│       ├── contactos/
│       │   ├── ObtenerContactosOperador.js
│       │   ├── BuscarContactosPorNumeroCuenta.js
│       │   ├── ObtenerTodosContactos.js
│       │   ├── CrearContactoBancario.js
│       │   ├── ObtenerMisContactos.js
│       │   ├── EditarContactoBancario.js
│       │   ├── EliminarContactoBancario.js
│       │   └── ObtenerEstadisticasContactos.js
│
│       ├── transferencias/
│       │   ├── VerificarHabilitacionTransferencia.js
│       │   ├── CrearTransferencia.js
│       │   ├── ObtenerComprobante.js
│       │   ├── ObtenerHistorialTransferencias.js
│       │   ├── ObtenerMisTransferencias.js
│       │   ├── ForzarActualizacionEstado.js
│       │   ├── ObtenerEstadisticasTransferencias.js
│       │   ├── SimularProcesamientoTransferencia.js
│       │   └── GenerarComprobantePDF.js
│
│       ├── plantillas/
│       │   ├── ListarPlantillas.js
│       │   ├── ObtenerPlantilla.js
│       │   ├── DescargarPlantilla.js
│       │   ├── SubirPlantilla.js
│       │   ├── ActualizarPlantilla.js
│       │   ├── EliminarPlantilla.js
│       │   ├── ActivarPlantilla.js
│       │   ├── ObtenerEstadisticasPlantillas.js
│       │   └── BuscarPlantillas.js
│
│       ├── reactivacion/
│       │   ├── SolicitarReactivacionCuenta.js
│       │   ├── ReactivarCuenta.js
│       │   └── ProcesarRecuperacionCuenta.js
│
│       ├── chatbot/
│       │   ├── ProcesarMensaje.js
│       │   ├── ObtenerHistorial.js
│       │   ├── BuscarEnHistorial.js
│       │   ├── ObtenerEstadisticasChatbot.js
│       │   ├── EliminarHistorialChatbot.js
│       │   └── HealthCheckChatbot.js
│
│       ├── comentarios/
│       │   ├── CrearComentario.js
│       │   ├── ObtenerComentariosSolicitud.js
│       │   ├── ObtenerContadorNoLeidos.js
│       │   ├── EliminarComentario.js
│       │   ├── ObtenerEstadisticasComentarios.js
│       │   └── BuscarComentarios.js
│
│       ├── notificaciones/
│       │   ├── ObtenerNotificaciones.js
│       │   ├── ObtenerContadorNoLeidas.js
│       │   ├── MarcarComoLeida.js
│       │   ├── MarcarTodasComoLeidas.js
│       │   ├── CrearNotificacionFirmaSolicitante.js
│       │   ├── CrearNotificacionComentario.js
│       │   ├── CrearNotificacionesFirma.js
│       │   ├── NotificarFirmaSolicitanteCompletada.js
│       │   ├── NotificarFirmaOperadorCompletada.js
│       │   ├── NotificarFirmaCompletada.js
│       │   ├── NotificarRechazoFirma.js
│       │   └── NotificarExpiracionFirma.js
│
│       ├── verificaciones/
│       │   ├── CrearVerificacionKYC.js
│       │   ├── ObtenerVerificacionPorId.js
│       │   ├── ObtenerVerificacionesPorSolicitud.js
│       │   ├── ObtenerVerificacionPorSessionId.js
│       │   ├── ActualizarVerificacion.js
│       │   ├── ActualizarVerificacionPorSessionId.js
│       │   └── ObtenerEstadisticasVerificaciones.js
│
│       └── webhooks/
│           └── ProcesarWebhookDidit.js
│
├── infrastructure/
│   ├── database/
│   │   ├── conexion.js
│   │   └── supabaseAdmin.js
│
│   ├── repositories/
│   │   ├── SupabaseUsuarioRepository.js
│   │   ├── SupabaseSolicitanteRepository.js
│   │   ├── SupabaseOperadorRepository.js
│   │   ├── SupabaseSolicitudRepository.js
│   │   ├── SupabaseSolicitudInformacionRepository.js
│   │   ├── SupabaseDocumentoRepository.js
│   │   ├── SupabaseIntentoLoginRepository.js
│   │   ├── SupabaseContratoRepository.js
│   │   ├── SupabaseFirmaDigitalRepository.js
│   │   ├── SupabaseContactoBancarioRepository.js
│   │   ├── SupabaseTransferenciaBancariaRepository.js
│   │   ├── SupabasePlantillaDocumentoRepository.js
│   │   ├── SupabaseReactivacionCuentaRepository.js
│   │   ├── SupabaseChatbotRepository.js
│   │   ├── SupabaseComentarioRepository.js
│   │   ├── SupabaseNotificacionRepository.js
│   │   └── SupabaseVerificacionKYCRepository.js
│
│   └── services/
│       ├── AuthService.js
│       ├── BCRAService.js
│       ├── GeminiService.js
│       ├── NotificacionService.js
│       │
│       ├── didit/
│       │   └── DiditService.js
│       │
│       └── email/
│           ├── BrevoService.js
│           ├── emailServicio.js
│           ├── emailConfirmacionServicio.js
│           ├── emailRecuperacionServicio.js
│           └── emailValidarServicio.js
│
└── interfaces/
    ├── controllers/
    │   ├── AuthController.js
    │   ├── UsuarioController.js
    │   ├── OperadorController.js
    │   ├── DocumentoController.js
    │   ├── ContratoController.js
    │   ├── FirmaDigitalController.js
    │   ├── ContactosBancariosController.js
    │   ├── TransferenciasBancariasController.js
    │   ├── PlantillasDocumentoController.js
    │   ├── ReactivacionController.js
    │   ├── SolicitudesController.js
    │   ├── ChatbotController.js
    │   ├── ComentariosController.js
    │   ├── NotificacionesController.js
    │   ├── WebhooksController.js
    │   └── VerificacionKYCController.js
│
    ├── routes/
    │   ├── auth.routes.js
    │   ├── usuarios.public.routes.js
    │   ├── usuarios.private.routes.js
    │   ├── operadores.routes.js
    │   ├── solicitudes.routes.js
    │   ├── documentos.routes.js
    │   ├── contratos.routes.js
    │   ├── firmas.routes.js
    │   ├── contactos-bancarios.routes.js
    │   ├── transferencias.routes.js
    │   ├── plantillas.routes.js
    │   ├── reactivacion.routes.js
    │   ├── chatbot.routes.js
    │   ├── comentarios.routes.js
    │   ├── notificaciones.routes.js
    │   ├── webhooks.routes.js
    │   ├── verificaciones-kyc.routes.js
    │   └── index.js
│
    ├── middlewares/
    │   ├── auth.middleware.js
    │   └── upload.middleware.js
│
    └── docs/
        ├── swagger.config.js
        └── swagger.schemas.js
```

### Descripción de las Capas:

1.  **`interfaces` (Capa de Presentación):**
    - **Responsabilidad:** Manejar la comunicación con el mundo exterior. Recibe las peticiones HTTP, las valida (a nivel de entrada) y las delega a la capa de aplicación.
    - **Componentes:**
        - **Controladores:** Gestionan las peticiones, extraen datos de `req` y llaman a los Casos de Uso.
        - **Rutas (Express):** Definen los endpoints y los asocian a los métodos de los controladores.
        - **Middlewares:** Interceptan las peticiones para tareas comunes como autenticación (`auth.middleware.js`) o subida de archivos (`upload.middleware.js`).

2.  **`application` (Capa de Aplicación):**
    - **Responsabilidad:** Orquestar los flujos de trabajo de la aplicación. Esta capa no contiene lógica de negocio compleja, sino que coordina las entidades y los servicios de infraestructura para llevar a cabo una acción específica del usuario.
    - **Componentes:**
        - **Casos de Uso (Use Cases):** Cada caso de uso representa una acción específica del sistema (ej. `RegistrarUsuario`, `AprobarSolicitud`, `IniciarProcesoFirma`). Son el corazón de la aplicación.
        - **Servicios de Aplicación:** Servicios que orquestan múltiples casos de uso o contienen lógica de aplicación reutilizable (ej. `GestionSolicitudService`).

3.  **`domain` (Capa de Dominio):**
    - **Responsabilidad:** Contiene la lógica de negocio fundamental y las reglas de la empresa. Es la capa más interna y no debe tener dependencias de otras capas.
    - **Componentes:**
        - **Entidades (Entities):** Objetos que representan los conceptos clave del negocio (Usuario, Solicitud, Documento). Contienen atributos y métodos que validan su estado y aplican reglas de negocio intrínsecas.
        - **Repositorios (Interfaces):** Contratos o interfaces que definen cómo se deben recuperar y almacenar las entidades. La implementación concreta se deja para la capa de infraestructura (principio de inversión de dependencias).

4.  **`infrastructure` (Capa de Infraestructura):**
    - **Responsabilidad:** Proporciona implementaciones concretas para las interfaces definidas en la capa de dominio y maneja la comunicación con agentes externos.
    - **Componentes:**
        - **Repositorios Concretos:** Implementaciones de las interfaces de repositorio (ej. `SupabaseUsuarioRepository`) que utilizan Supabase para acceder a la base de datos.
        - **Servicios Externos:** Clientes y wrappers para servicios de terceros como `AuthService` (Supabase Auth), `DiditService` (KYC), `BCRAService` (consulta de deudas), `GeminiService` (chatbot) y servicios de email (`BrevoService`).

---

## Flujo de Datos (Request → Response)

El siguiente diagrama ilustra el viaje típico de una solicitud a través del sistema:

1.  **Inicio:** El cliente (frontend) realiza una petición HTTP a un endpoint específico.
2.  **Rutas y Middleware:** La petición llega al router de Express. Los middlewares globales y específicos de la ruta se ejecutan (ej. `auth.middleware.js` para verificar el token JWT y adjuntar el usuario a `req.usuario`).
3.  **Controlador:** La ruta llama al método correspondiente en un controlador. El controlador extrae los datos necesarios de `req.body`, `req.params`, `req.query` y `req.usuario`.
4.  **Caso de Uso:** El controlador instancia y ejecuta un **Caso de Uso**, pasándole los datos necesarios.
5.  **Lógica de Negocio:** El Caso de Uso coordina la lógica. Puede:
    - Obtener entidades a través de un **Repositorio**.
    - Aplicar reglas de negocio utilizando métodos de las **Entidades**.
    - Utilizar **Servicios de Infraestructura** (ej. enviar un email, consultar una API externa).
    - Persistir cambios llamando nuevamente a un **Repositorio**.
6.  **Resultado:** El Caso de Uso devuelve un objeto de resultado (`success`, `data`, `message`, `status`) al controlador.
7.  **Response:** El controlador envía una respuesta HTTP con el código de estado y el cuerpo JSON apropiados de vuelta al cliente.

---

## Integraciones Externas

El sistema se integra con varios servicios externos para proporcionar su funcionalidad completa.

| Servicio | Propósito | Componente en `infrastructure/services/` |
| :--- | :--- | :--- |
| **Supabase** | Base de datos principal (PostgreSQL), autenticación y almacenamiento de archivos (Storage). | `database/` (conexión, cliente), `repositories/` (todos los repositorios concretos), `AuthService.js`. |
| **Brevo (Sendinblue)** | Envío de emails transaccionales (confirmación, bienvenida, recuperación, comprobantes). | `email/brevoAPIService.js`, `emailServicio.js` |
| **Google Gemini** | Motor de inteligencia artificial para el chatbot de asistencia. | `GeminiService.js` |
| **Didit** | Servicio de verificación de identidad y KYC/AML (Know Your Customer / Anti-Money Laundering). | `diditService.js` |
| **BCRA (Banco Central de la República Argentina)** | Consulta de deudas y situación crediticia de los solicitantes a través de su API pública. | `BCRAService.js` |

---

## Diagrama de Módulos Funcionales

El sistema está organizado en módulos funcionales, cada uno con sus propios controladores, casos de uso y repositorios.
