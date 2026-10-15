-- HomeScope · Seed: tipo_propiedad
-- Fuente: init.sql (comentario: casa|apartamento|terreno|local|oficina)
-- Tabla: tipo_propiedad (id SMALLINT PK, nombre VARCHAR(40) UNIQUE)

BEGIN;

INSERT INTO tipo_propiedad (id, nombre) VALUES
  (1, 'Casa'),
  (2, 'Apartamento'),
  (3, 'Terreno'),
  (4, 'Local Comercial'),
  (5, 'Oficina')
ON CONFLICT (id) DO NOTHING;

-- Sincroniza la secuencia para evitar conflictos en futuros inserts automáticos
SELECT setval(
  pg_get_serial_sequence('tipo_propiedad', 'id'),
  (SELECT MAX(id) FROM tipo_propiedad)
);

COMMIT;
