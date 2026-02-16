# Convenciones de Nomenclatura

Para mantener la consistencia y legibilidad del esquema de base de datos, todo el equipo debe seguir estas convenciones.

## Tablas
*   **Formato:** `snake_case` en **plural**.
*   **Ejemplos:**
    *   `usuarios`
    *   `solicitudes_credito`
    *   `transferencias_bancarias`
    *   `contactos_bancarios`

## Columnas
*   **Formato:** `snake_case`.
*   **Reglas Generales:**
    *   **Claves Primarias (PK):** Siempre `id`.
    *   **Claves Foráneas (FK):** `[nombre_tabla_referencia_en_singular]_id`.
        *   Ej: `solicitante_id`, `operador_id`, `contrato_id`.
    *   **Fechas de Auditoría:** `created_at`, `updated_at`, `deleted_at` (si aplica).
    *   **Timestamps con Zona Horaria:** Usar `TIMESTAMPTZ`.
    *   **Flags/Booleanos:** Nombre que indique un estado positivo, ej: `cuenta_activa` en lugar de `inactivo`.

## Restricciones (Constraints)
*   **Formato:** `[tabla]_[columna]_[tipo]`
*   **Tipos:**
    *   `pkey` para clave primaria.
    *   `fkey` para clave foránea.
    *   `key` para unicidad (`UNIQUE`).
    *   `check` para restricciones de verificación.
*   **Ejemplos:**
    *   `usuarios_email_key` (para la constraint `UNIQUE` en `usuarios.email`).
    *   `solicitudes_credito_solicitante_id_fkey` (para la FK de `solicitante_id`).
    *   `solicitudes_credito_estado_check` (para el `CHECK` de valores permitidos en `estado`).

## Índices
*   **Formato:** `idx_[tabla]_[columna1]_[columna2]`
*   **Objetivo:** Crear índices para columnas que se usan frecuentemente en cláusulas `WHERE`, `JOIN` u `ORDER BY`.
*   **Ejemplos:**
    *   `idx_usuarios_email` (para búsquedas por email).
    *   `idx_solicitudes_estado` (para filtrar solicitudes por estado).
    *   `idx_notificaciones_usuario_leida` (índice compuesto para consultas comunes).
    *   `idx_documentos_informacion_extraida` (para búsquedas en columnas `JSONB`).

## Funciones y Triggers
*   **Funciones:** `[verbo]_[tabla/asunto]`.
    *   `update_timestamp()`
    *   `validar_solicitud_completa()`
    *   `asignar_operador_automatico()`
*   **Triggers:** `trigger_[tabla]_[accion]`
    *   `trigger_usuarios_timestamp`
    *   `trigger_auditoria_solicitud`
    *   `trigger_actualizar_estado_firma`