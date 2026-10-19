-- Propiedades reales para pruebas de T34 (Índice de Conveniencia) en Jalapa, Guatemala.
-- Se puede ejecutar varias veces: no duplica filas.
-- Todas nacen en estado 'borrador' (así se prueba que PUBLICAR dispara el cálculo).

INSERT INTO tipo_propiedad (id, nombre)
SELECT * FROM (VALUES (1, 'Casa'), (2, 'Apartamento')) AS t(id, nombre)
WHERE NOT EXISTS (SELECT 1 FROM tipo_propiedad);

-- 2. Usuario vendedor de prueba (solo si no hay ningún usuario).
INSERT INTO usuario (nombre, apellido, correo, password_hash, correo_verificado)
SELECT 'Vendedor', 'Prueba', 'vendedor.prueba@homescope.test', 'no-usar-para-login', true
WHERE NOT EXISTS (SELECT 1 FROM usuario);

-- 3. Propiedades de prueba con ubicaciones reales en Jalapa
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
  -- Ubicación 1: Cerca del Estadio Las Flores / Col. La Cañada (Zona 1)
  ('[PRUEBA T34] Casa cerca de Estadio Las Flores',
   'Zona urbana este de Jalapa, alta densidad comercial.',
   850000.00, 3, 2.0, 140.00, 1, 'Cerca de Estadio Las Flores, Jalapa', '1', 'Jalapa', 'Jalapa',
   14.640831, -89.992601),

  -- Ubicación 2: Cerca del Cementerio General / Campo Verde (Zona 1)
  ('[PRUEBA T34] Casa sector Cementerio General',
   'Zona oeste de Jalapa, área residencial semiurbana.',
   620000.00, 2, 1.0, 110.00, 1, 'Sector Cementerio General, Jalapa', '1', 'Jalapa', 'Jalapa',
   14.637522, -89.995118),

  -- Ubicación 3: Zona Sanatorio Santa Marta / Río Jalapa (Zona 1)
  ('[PRUEBA T34] Propiedad cerca de Sanatorio Santa Marta',
   'Zona céntrica comercial y de servicios de salud en Jalapa.',
   980000.00, 4, 3.0, 180.00, 2, 'Cerca de Sanatorio Santa Marta, Jalapa', '1', 'Jalapa', 'Jalapa',
   14.630172, -89.984293),

  -- Ubicación 4: 5ta Avenida / Parque Los Columpios (Zona 1)
  ('[PRUEBA T34] Apartamento en 5ta Avenida',
   'Eje principal de acceso urbano, esperable índice alto.',
   1150000.00, 2, 2.0, 95.00, 2, '5ta Avenida, Jalapa', '1', 'Jalapa', 'Jalapa',
   14.634293, -89.981664),

  -- Ubicación 5: Cerca de Mercado / Consultorio IGSS (Zona 1)
  ('[PRUEBA T34] Local comercial / casa cerca del Mercado Central',
   'Corazón comercial del municipio de Jalapa.',
   1350000.00, 3, 2.0, 130.00, 1, 'Zona del Mercado Central, Jalapa', '1', 'Jalapa', 'Jalapa',
   14.633743, -89.992500),

  -- Ubicación de control sin coordenadas (para validar la respuesta SIN_COORDENADAS)
  ('[PRUEBA T34] Casa SIN coordenadas (Jalapa)',
   'Latitud y longitud en 0: el cálculo debe responder SIN_COORDENADAS.',
   500000.00, 3, 2.0, 120.00, 1, 'Sin dirección exacta', '1', 'Jalapa', 'Jalapa',
   0.000000, 0.000000)
) AS v(titulo, descripcion, precio, habitaciones, banos, area_m2, parqueos, direccion, zona, municipio, departamento, latitud, longitud)
WHERE NOT EXISTS (SELECT 1 FROM propiedad p WHERE p.titulo = v.titulo);

-- 4. Resultado: IDs a usar en Postman o tus pruebas automatizadas
SELECT id, titulo, estado, latitud, longitud
FROM propiedad
WHERE titulo LIKE '[PRUEBA T17]%'
ORDER BY id;