-- Propiedades de prueba para T17 (Indice de Conveniencia).
-- Se puede ejecutar varias veces: no duplica filas.
-- Todas nacen en estado 'borrador' (asi se prueba que PUBLICAR dispara el calculo).
-- Las coordenadas son aproximadas: ajustalas si quieres otra zona.

-- 1. Tipos de propiedad (solo si la tabla esta vacia)
INSERT INTO tipo_propiedad (id, nombre)
SELECT * FROM (VALUES (1, 'Casa'), (2, 'Apartamento')) AS t(id, nombre)
WHERE NOT EXISTS (SELECT 1 FROM tipo_propiedad);

-- 2. Usuario vendedor de prueba (solo si no hay ningun usuario).
--    El hash NO es valido: este usuario no sirve para iniciar sesion.
INSERT INTO usuario (nombre, apellido, correo, password_hash, correo_verificado)
SELECT 'Vendedor', 'Prueba', 'vendedor.prueba@homescope.test', 'no-usar-para-login', true
WHERE NOT EXISTS (SELECT 1 FROM usuario);

-- 3. Propiedades de prueba
INSERT INTO propiedad (
  vendedor_id, tipo_propiedad_id, titulo, descripcion, modalidad, precio, moneda,
  habitaciones, banos, area_m2, parqueos, direccion, zona, municipio, departamento,
  latitud, longitud, estado
)
SELECT
  (SELECT min(id) FROM usuario),
  (SELECT min(id) FROM tipo_propiedad),
  v.titulo, v.descripcion, 'VENTA', v.precio, 'GTQ',
  v.habitaciones, v.banos, v.area_m2, v.parqueos, v.direccion, v.zona, v.municipio, v.departamento,
  v.latitud, v.longitud, 'borrador'
FROM (VALUES
  ('[PRUEBA T17] Casa en el centro de Jalapa',
   'Zona urbana de Jalapa, esperable un indice medio o alto.',
   850000.00, 3, 2.0, 140.00, 1, 'Centro de Jalapa', '1', 'Jalapa', 'Jalapa',
   14.634900, -89.988800),

  ('[PRUEBA T17] Apartamento en zona 10, Ciudad de Guatemala',
   'Zona muy urbanizada, esperable un indice alto.',
   1450000.00, 2, 2.0, 95.00, 2, 'Zona 10, Ciudad de Guatemala', '10', 'Guatemala', 'Guatemala',
   14.599300, -90.507500),

  ('[PRUEBA T17] Terreno con casa en zona rural',
   'Zona alejada, esperable un indice bajo.',
   320000.00, 2, 1.0, 400.00, 0, 'Aldea rural, Jalapa', '1', 'Jalapa', 'Jalapa',
   14.600000, -89.850000),

  ('[PRUEBA T17] Casa SIN coordenadas',
   'Latitud y longitud en 0: el calculo debe responder SIN_COORDENADAS.',
   500000.00, 3, 2.0, 120.00, 1, 'Sin direccion', '1', 'Jalapa', 'Jalapa',
   0.000000, 0.000000)
) AS v(titulo, descripcion, precio, habitaciones, banos, area_m2, parqueos, direccion, zona, municipio, departamento, latitud, longitud)
WHERE NOT EXISTS (SELECT 1 FROM propiedad p WHERE p.titulo = v.titulo);

-- 4. Resultado: ids a usar en Postman
SELECT id, titulo, estado, latitud, longitud
FROM propiedad
WHERE titulo LIKE '[PRUEBA T17]%'
ORDER BY id;

-- ---------------------------------------------------------------------
-- LIMPIEZA (descomenta y ejecuta cuando termines de probar).
-- El orden importa: primero las tablas que dependen de propiedad.
-- ---------------------------------------------------------------------
-- DELETE FROM sub_puntaje_categoria WHERE indice_id IN (
--   SELECT id FROM indice_conveniencia WHERE propiedad_id IN (SELECT id FROM propiedad WHERE titulo LIKE '[PRUEBA T17]%'));
-- DELETE FROM punto_interes WHERE propiedad_id IN (SELECT id FROM propiedad WHERE titulo LIKE '[PRUEBA T17]%');
-- DELETE FROM indice_conveniencia WHERE propiedad_id IN (SELECT id FROM propiedad WHERE titulo LIKE '[PRUEBA T17]%');
-- DELETE FROM propiedad WHERE titulo LIKE '[PRUEBA T17]%';