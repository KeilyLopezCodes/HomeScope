-- Migración T18: agenda de visitas. Idempotente: se puede ejecutar varias veces.
--   docker cp scripts\migracion_agenda.sql postgresDB:/tmp/migracion_agenda.sql
--   docker exec postgresDB psql -U admin -d HomeScope -1 -v ON_ERROR_STOP=1 -f /tmp/migracion_agenda.sql
-- Si ya hay filas fuera de estas reglas, la restricción falla: corregirlas primero.

-- dia_semana: 1 = lunes ... 7 = domingo; la franja debe tener hora_inicio < hora_fin
ALTER TABLE disponibilidad_vendedor DROP CONSTRAINT IF EXISTS ck_disponibilidad_dia;
ALTER TABLE disponibilidad_vendedor
  ADD CONSTRAINT ck_disponibilidad_dia CHECK (dia_semana BETWEEN 1 AND 7);

ALTER TABLE disponibilidad_vendedor DROP CONSTRAINT IF EXISTS ck_disponibilidad_horas;
ALTER TABLE disponibilidad_vendedor
  ADD CONSTRAINT ck_disponibilidad_horas CHECK (hora_inicio < hora_fin);

-- Estados válidos de una visita
ALTER TABLE visita DROP CONSTRAINT IF EXISTS ck_visita_estado;
ALTER TABLE visita
  ADD CONSTRAINT ck_visita_estado
  CHECK (estado IN ('solicitada','confirmada','reprogramada','cancelada','rechazada','realizada'));

-- Consultas de agenda y del recordatorio
CREATE INDEX IF NOT EXISTS idx_visita_propiedad_estado ON visita (propiedad_id, estado);
CREATE INDEX IF NOT EXISTS idx_visita_comprador ON visita (comprador_id, estado);
CREATE INDEX IF NOT EXISTS idx_visita_recordatorio
  ON visita (fecha_hora_confirmada) WHERE estado = 'confirmada' AND recordatorio_enviado = FALSE;
CREATE INDEX IF NOT EXISTS idx_disponibilidad_vendedor ON disponibilidad_vendedor (vendedor_id, activa);