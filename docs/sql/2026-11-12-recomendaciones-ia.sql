-- Ejecutar una vez antes de desplegar en producción (NODE_ENV=production).
-- Cambios aditivos: las búsquedas anteriores quedan identificadas como SISTEMA.
BEGIN;
ALTER TABLE busqueda ADD COLUMN IF NOT EXISTS tipo varchar(7) NOT NULL DEFAULT 'SISTEMA';
ALTER TABLE recomendacion ADD COLUMN IF NOT EXISTS motivo varchar(500) NULL;
COMMIT;
