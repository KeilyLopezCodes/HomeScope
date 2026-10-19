-- Categorías del Índice de Conveniencia v1.0
-- ids 1-6: el calculador usa estos ids para N_c.

INSERT INTO categoria_interes (id, nombre, google_place_types, icono, peso, activa) VALUES
 (1, 'educación',    'school,primary_school,secondary_school,university', 'school',        0.20, TRUE),
 (2, 'salud',        'hospital,doctor,dentist,pharmacy',                  'heart-pulse',   0.20, TRUE),
 (3, 'comercio',     'supermarket,convenience_store,shopping_mall,bank',  'shopping-cart', 0.20, TRUE),
 (4, 'transporte',   'bus_station,transit_station',                       'bus',           0.15, TRUE),
 (5, 'áreas verdes', 'park',                                              'trees',         0.15, TRUE),
 (6, 'seguridad',    'police,fire_station',                               'shield',        0.10, TRUE)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  google_place_types = EXCLUDED.google_place_types,
  icono = EXCLUDED.icono,
  peso = EXCLUDED.peso,
  activa = EXCLUDED.activa;
