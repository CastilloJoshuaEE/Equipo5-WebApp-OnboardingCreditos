# Reglas de Negocio Implementadas en la Base de Datos

Este documento describe las reglas de negocio clave que están reflejadas y, en muchos casos, forzadas por la lógica de la base de datos (mediante constraints, triggers y funciones).
## Módulo de Usuarios y Roles
*   **RB-01: Unicidad de Credenciales:** El `email` y el `dni` de un usuario deben ser únicos en toda la plataforma. Esto se asegura con constraints `UNIQUE` en la tabla `usuarios`.
*   **RB-02: Integridad Referencial de Roles:** Cuando se crea un usuario con rol 'solicitante', automáticamente se crea un registro en la tabla `solicitantes` (vía `trigger_insertar_tabla_hija`). Lo mismo aplica para 'operador' en la tabla `operadores`.

## Módulo de Solicitudes de Crédito
*   **RB-03: Workflow de Estados:** Una solicitud de crédito solo puede transitar por los estados definidos: 'borrador' -> 'enviado' -> 'en_revision' -> ('aprobado' | 'rechazado' | 'pendiente_info'). Esto está forzado por la constraint `solicitudes_credito_estado_check`.
*   **RB-04: Asignación Automática de Operador:** Cuando una solicitud pasa a estado 'enviado', el sistema ejecuta la función `asignar_operador_automatico()`, que asigna la solicitud al analista con menor carga de trabajo, creando una notificación para el operador y otra informativa para el solicitante.
*   **RB-05: Requisitos Mínimos para Envío:** Una solicitud no puede ser enviada (pasar de 'borrador' a 'enviado') a menos que la función `validar_solicitud_completa()` retorne `TRUE`, lo que verifica la existencia de los 3 documentos KYC obligatorios ('dni', 'cuit', 'comprobante_domicilio') en estado 'validado'. *(Nota: Esta función debe ser llamada desde la lógica de aplicación/backend antes de actualizar el estado).*
*   **RB-06: Inicio de Revisión:** Al asignar un `operador_id` a una solicitud que está en estado 'enviado', un trigger (`trigger_iniciar_revision`) cambia automáticamente el estado a 'en_revision' y notifica al solicitante.

## Módulo de Contratos y Firmas
*   **RB-07: Creación de Contratos:** Un contrato solo puede ser creado para una solicitud de crédito que esté en estado 'aprobado'.
*   **RB-08: Unicidad de Contrato:** Una solicitud de crédito aprobada puede tener como máximo un contrato. Esto se asegura con la constraint `UNIQUE` en `contratos.solicitud_id`.
*   **RB-09: Integridad de la Firma:** La integridad del documento firmado se valida comparando el `hash_documento_original` con el `hash_documento_firmado` (`integridad_valida`). Cualquier cambio en el hash es registrado en `auditoria_firmas`.
*   **RB-10: Expiración de Firmas:** Las solicitudes de firma digital expiran después de un número configurable de días (valor de `configuraciones`). Un job programado (o función llamada periódicamente `verificar_expiracion_firmas`) se encarga de marcar las firmas como 'expirado'.

## Módulo de Transferencias
*   **RB-11: Desembolso Post-Firma:** Una transferencia bancaria puede ser creada o procesada solo después de que el contrato asociado esté en estado 'firmado_completo' o 'vigente'.

## Reglas de Auditoría y Cumplimiento
*   **RB-12: Trazabilidad de Cambios de Estado:** Cada cambio de estado en una `solicitud_credito` es automáticamente registrado en la tabla `auditoria` por el trigger `trigger_auditoria_solicitud`, incluyendo el usuario que lo realizó (si está disponible) y los estados anterior y nuevo.
*   **RB-13: Trazabilidad de Firmas:** Cada evento relevante en el proceso de firma digital (cambio de estado, actualización de hash, expiración) es registrado en la tabla `auditoria_firmas` por el trigger `trigger_auditoria_firma`.
*   **RB-14: Historial de Contraseñas:** Para prevenir la reutilización de contraseñas, el sistema almacena un historial de las últimas contraseñas en la tabla `historial_contrasenas`. 