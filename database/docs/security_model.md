# Modelo de Seguridad - Nexia

## Visión General
La seguridad en Nexia se basa en las capacidades de Supabase, combinando **Autenticación**, **Row Level Security (RLS)** y **Políticas de Almacenamiento (Storage)**. El objetivo es garantizar que los usuarios solo puedan acceder a los datos para los que están autorizados, tanto a nivel de filas de base de datos como de archivos.

## Roles de Usuario (Conceptuales)
El sistema reconoce los siguientes roles, que se implementan a través de la columna `rol` en la tabla `usuarios` y se mapean a los roles de Supabase Auth (`authenticated`):

*   **`solicitante` (PYME):** Usuario final que solicita créditos. Solo puede ver y gestionar sus propios datos.
*   **`operador` (Analista/Supervisor):** Personal de la entidad financiera. Tiene acceso a múltiples solicitudes para su revisión y gestión.
*   **`service_role` (Backend/Admin):** Rol privilegiado utilizado por el backend y funciones de administración para operaciones que requieren eludir RLS (ej. crear usuarios, notificaciones del sistema).

## Row Level Security (RLS)
RLS está habilitado en todas las tablas principales. Las políticas aseguran el acceso a nivel de fila.

### Resumen de Políticas por Tabla

| Tabla | Política(s) Clave | Descripción |
| :--- | :--- | :--- |
| `usuarios` | `usuarios_propio_perfil` | Los usuarios autenticados (`authenticated`) solo pueden ver/modificar su propio perfil (donde `auth.uid() = id`). |
| `solicitantes` | `solicitantes_propios_datos` | Similar a `usuarios`. Un solicitante solo puede ver su registro de `solicitantes`. |
| `solicitudes_credito` | `solicitudes_acceso` | **Regla compuesta:** Un `solicitante` puede ver sus solicitudes (`solicitante_id = auth.uid()`). Un `operador` puede ver **todas** las solicitudes (por la existencia de su rol en la tabla `operadores`). |
| `documentos` | *(Implícita a través de la solicitud)* | El acceso se controla mediante las políticas de `solicitudes_credito`. Un usuario puede ver documentos si puede ver la solicitud a la que pertenecen. |
| `contratos` | `contratos_acceso_solicitante`<br>`contratos_acceso_operador` | **Acceso Dual:** Similar a solicitudes. Solicitante ve contratos de sus solicitudes. Operador ve contratos de solicitudes asignadas. |
| `notificaciones` | `notificaciones_select`<br>`notificaciones_insert` | Los usuarios solo pueden **ver** sus propias notificaciones. La **inserción** está restringida al `service_role` o a funciones del sistema (`current_user = 'postgres'`). |
| `transferencias_bancarias` | `transferencias_acceso` | **Acceso Dual:** Solicitante y operador asignado pueden ver las transferencias asociadas a una solicitud. |

## Seguridad en Storage (Supabase Storage)
Los documentos subidos por los usuarios (KYC, contratos) se almacenan en buckets de Storage con políticas específicas.

*   **Bucket:** `kyc-documents`
*   **Políticas:**
    *   `Usuarios autenticados pueden subir documentos`: Cualquier usuario logueado puede subir archivos.
    *   `Cualquiera puede ver documentos kyc`: **¡CUIDADO!** Esta política es muy permisiva. **Se recomienda encarecidamente cambiarla** para que los solicitantes solo vean sus propios documentos y los operadores puedan ver todos, similar a la lógica de RLS en tablas.
        ```sql
        -- Política recomendada para reemplazar la actual:
        CREATE POLICY "acceso_documentos_contratos_solicitante" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'kyc-documents' 
          AND (
            -- Solicitantes pueden ver sus propios documentos
            (auth.uid()::text IN (
              SELECT sc.solicitante_id::text 
              FROM solicitudes_credito sc
              WHERE storage.objects.name LIKE '%' || sc.id::text || '%'
            ))
            OR
            -- Operadores pueden ver todos los documentos
            auth.uid() IN (SELECT id FROM usuarios WHERE rol = 'operador')
          )
        );
        ```

## Funciones de Seguridad
*   **Hash de Contraseñas:** Se utiliza `pgcrypto` y el backend se encarga de hashear las contraseñas antes de almacenarlas.
*   **Tokens de Confirmación:** La tabla `usuarios` incluye `token_confirmacion` y `token_expiracion` para procesos seguros de verificación de email y recuperación de contraseña.
*   **Auditoría:** Las tablas `auditoria` y `auditoria_firmas` registran acciones críticas, cambios de estado y accesos para trazabilidad forense y cumplimiento.