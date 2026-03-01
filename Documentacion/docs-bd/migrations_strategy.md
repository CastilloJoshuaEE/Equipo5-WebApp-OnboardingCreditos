# Estrategia de Migraciones

## Objetivo
Establecer las reglas y el flujo de trabajo para gestionar los cambios en el esquema de la base de datos de forma consistente, ordenada y colaborativa.

## Estructura de Archivos
Las migraciones se encuentran en el directorio `database/migrations/` y siguen una convención de nomenclatura estricta:

`[número]_[descripción_corta].sql`

*   **`[número]`:** Un número de tres dígitos que define el orden de ejecución (ej. `001`, `002`... `022`).
*   **`[descripción_corta]`:** Una frase en `snake_case` que describe el contenido (ej. `usuarios`, `solicitudes_credito`).

**Ejemplo:**
*   `001_usuarios.sql`
*   `004_solicitudes_credito.sql`
*   `018_firmas_digitales.sql`

## Reglas de Oro

1.  **Incremental e Inmutable:** Una vez que una migración ha sido aplicada a una base de datos (especialmente en producción), **NUNCA debe ser modificada**. Cualquier cambio futuro debe realizarse mediante un **nuevo archivo de migración** (ej. `023_agregar_columna_telefono_contacto.sql`).

2.  **Orden de Ejecución Estricto:** Las migraciones se ejecutan en orden numérico ascendente. Esto asegura que las tablas base (ej. `usuarios`) existan antes de que las tablas que dependen de ellas (ej. `solicitantes`) sean creadas.

3.  **Idempotencia:** Siempre que sea posible, las migraciones deben ser idempotentes. Esto significa que se puede ejecutar el mismo script múltiples veces sin causar errores. Esto se logra usando condiciones como `IF NOT EXISTS` en `CREATE TABLE` y `CREATE EXTENSION`, y `IF EXISTS` en `ALTER TABLE...ADD COLUMN`.

    ```sql
    -- Ejemplo de buena práctica
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    ALTER TABLE documentos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    ```

4.  **Rollback (Opcional, pero recomendado):** Para entornos de desarrollo, es útil tener scripts de rollback (ej. `revert/001_revert_usuarios.sql`). Sin embargo, en producción, la estrategia principal para deshacer un cambio es crear una nueva migración que lo revierta (ej. `024_eliminar_columna_telefono_contacto.sql`).

## Flujo de Trabajo para Nuevos Cambios

1.  **Identifica el Cambio:** Determina qué modificaciones necesitas en el esquema (nueva tabla, columna, índice, etc.).
2.  **Crea un Nuevo Archivo:** Crea un nuevo archivo en `database/migrations/` con el siguiente número en la secuencia.
    *   Si la última migración es `022_transferencias_bancarias.sql`, tu nuevo archivo será `023_descripcion_de_tu_cambio.sql`.
3.  **Escribe el Script:** Implementa tu cambio asegurándote de seguir las reglas de idempotencia.
4.  **Prueba Localmente:** Ejecuta tu nueva migración contra tu base de datos local para verificar que funciona sin errores y no rompe nada existente.
    ```bash
    psql -U postgres -d fintech_test -f database/migrations/023_descripcion_de_tu_cambio.sql
    ```
5.  **Actualiza `db_install.sql`:** Añade la nueva línea en el script de instalación `database/db_install.sql` para que las nuevas instalaciones incluyan tu cambio.
    ```sql
    -- ... al final del archivo
    \i migrations/023_descripcion_de_tu_cambio.sql
    ```
6.  **Commit y Pull Request:** Sube tus cambios y crea un Pull Request para que el equipo los revise.