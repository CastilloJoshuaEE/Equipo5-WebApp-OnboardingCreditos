-- ============================================
-- Proyecto: equipos-webapp-onboardingcreditos
-- Script: db_install.sql
-- Motor: PostgreSQL (psql)
-- Cómo ejecutarlo?:
-- Desde la carpeta database: psql -U postgres -f db_install.sql
-- O si usas Supabase local: psql postgresql://postgres:postgres@localhost:54322/postgres -f db_install.sql
-- ============================================

\set ON_ERROR_STOP on

-- ============================================
-- VARIABLES
-- ============================================
\set dbname 'fintech_test'

\echo 'Eliminando base de datos si existe...'
DROP DATABASE IF EXISTS :dbname;

\echo 'Creando base de datos...'
CREATE DATABASE :dbname;

\echo 'Conectando a la base de datos...'
\c :dbname

\echo 'Base de datos creada y seleccionada.'

-- ============================================
-- EXTENSIONS
-- ============================================
\echo 'Instalando extensiones...'
\i extensions/000_extensions.sql

-- ============================================
-- MIGRATIONS
-- ============================================
\echo 'Ejecutando migraciones...'

\i migrations/000_extensions.sql
\i migrations/001_usuarios.sql
\i migrations/002_solicitantes.sql
\i migrations/003_operadores.sql
\i migrations/004_solicitudes_credito.sql
\i migrations/005_documentos.sql
\i migrations/006_kyc.sql
\i migrations/007_condiciones_aprobacion.sql
\i migrations/008_solicitudes_informacion.sql
\i migrations/009_storage.sql
\i migrations/010_contratos.sql
\i migrations/011_notificaciones.sql
\i migrations/012_auditoria.sql
\i migrations/013_plantilla_documentos.sql
\i migrations/014_comentarios.sql
\i migrations/015_chatbot_interacciones.sql
\i migrations/016_intentos_login.sql
\i migrations/017_historial_contrasenas.sql
\i migrations/018_firmas_digitales.sql
\i migrations/019_auditoria_firmas.sql
\i migrations/020_configuraciones.sql
\i migrations/021_contactos_bancarios.sql
\i migrations/022_transferencias_bancarias.sql

\echo 'Instalación finalizada.'
