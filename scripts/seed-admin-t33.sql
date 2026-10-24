-- Preparación para probar el panel de administrador (T33). Se puede ejecutar varias veces.

-- 1. Rol "administrador" (solo se crea si no existe)
INSERT INTO rol (id, nombre)
SELECT COALESCE(MAX(id), 0) + 1, 'administrador' FROM rol
ON CONFLICT (nombre) DO NOTHING;

-- 2. Asignar el rol a un usuario: CAMBIA EL CORREO por el de tu usuario de pruebas
INSERT INTO usuario_rol (usuario_id, rol_id)
SELECT u.id, r.id
FROM usuario u CROSS JOIN rol r
WHERE u.correo = 'CAMBIA_ESTE_CORREO@ejemplo.com' AND r.nombre = 'administrador'
ON CONFLICT DO NOTHING;

-- Debe aparecer tu usuario; si sale vacío, el correo no existe
SELECT u.id, u.correo, u.estado, r.nombre AS rol
FROM usuario u
JOIN usuario_rol ur ON ur.usuario_id = u.id
JOIN rol r ON r.id = ur.rol_id
WHERE r.nombre = 'administrador';

-- 3. Un reporte de prueba sobre una propiedad PUBLICADA (si no hay ninguna publicada, no inserta nada).
--    Lo reporta otro usuario distinto del dueño.
INSERT INTO reporte (reportante_id, tipo_objetivo, propiedad_id, motivo, descripcion)
SELECT (SELECT min(id) FROM usuario WHERE id <> p.vendedor_id), 'propiedad', p.id, 'fraude', 'Reporte de prueba T33'
FROM propiedad p
WHERE p.estado = 'publicado'
ORDER BY p.id
LIMIT 1
ON CONFLICT DO NOTHING;

SELECT id, tipo_objetivo, propiedad_id, motivo, estado FROM reporte ORDER BY id DESC LIMIT 5;