-- Migración: reseñas de vendedores (tabla resena)
-- Para bases de datos creadas antes de este cambio. Es idempotente: se puede ejecutar varias veces.
--   Get-Content scripts/migracion_resenas.sql | docker exec -i postgresDB psql -U admin -d HomeScope
-- Si ya hay filas con calificación fuera de 1..5 o reseñas propias, la restricción falla: corregirlas primero.

-- Regla de negocio: la calificación va de 1 a 5 estrellas
ALTER TABLE resena DROP CONSTRAINT IF EXISTS ck_resena_calificacion;
ALTER TABLE resena
  ADD CONSTRAINT ck_resena_calificacion CHECK (calificacion BETWEEN 1 AND 5);

-- Regla de negocio: nadie puede calificarse a sí mismo
ALTER TABLE resena DROP CONSTRAINT IF EXISTS ck_resena_no_autoresena;
ALTER TABLE resena
  ADD CONSTRAINT ck_resena_no_autoresena CHECK (comprador_id <> vendedor_id);

-- Listado y promedio de reseñas por vendedor (GET /api/sellers/:id y /api/sellers/:id/reviews)
CREATE INDEX IF NOT EXISTS idx_resena_vendedor
  ON resena (vendedor_id, fecha_creacion DESC);
