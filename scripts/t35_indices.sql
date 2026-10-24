-- T35: acelera las consultas del panel del vendedor (las tablas ya existen; solo se agregan índices)
CREATE INDEX IF NOT EXISTS idx_vista_propiedad_fecha ON vista_propiedad (propiedad_id, fecha_vista);
CREATE INDEX IF NOT EXISTS idx_favorito_propiedad ON favorito (propiedad_id, fecha_agregado);
CREATE INDEX IF NOT EXISTS idx_conversacion_propiedad ON conversacion (propiedad_id);
CREATE INDEX IF NOT EXISTS idx_mensaje_conversacion_fecha ON mensaje (conversacion_id, fecha_envio);