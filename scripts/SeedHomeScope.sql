-- HomeScope · Carga inicial de roles y permisos (PostgreSQL)

BEGIN;

-- Insertar Roles
INSERT INTO rol (id, nombre) VALUES 
  (1, 'comprador'), 
  (2, 'vendedor'), 
  (3, 'administrador')
ON CONFLICT (id) DO NOTHING;

-- Insertar Permisos
INSERT INTO permiso (id, codigo, modulo, descripcion) VALUES
  (1, 'cuenta.registrar', 'Cuenta y perfil', 'Crear una cuenta como comprador, vendedor o ambos'),
  (2, 'cuenta.iniciar_sesion', 'Cuenta y perfil', 'Iniciar sesión y usar "recordar sesión"'),
  (3, 'cuenta.recuperar_password', 'Cuenta y perfil', 'Solicitar recuperación de contraseña por correo'),
  (4, 'cuenta.verificar_correo', 'Cuenta y perfil', 'Confirmar el correo con el enlace recibido'),
  (5, 'cuenta.activar_rol_vendedor', 'Cuenta y perfil', 'Agregar el rol de vendedor a una cuenta de comprador'),
  (6, 'perfil.ver_propio', 'Cuenta y perfil', 'Ver el propio perfil'),
  (7, 'perfil.editar_propio', 'Cuenta y perfil', 'Editar los datos del propio perfil'),
  (8, 'perfil.ver_publico', 'Cuenta y perfil', 'Ver el perfil público de un vendedor (reseñas, insignia)'),
  (9, 'perfil.ver_contacto', 'Cuenta y perfil', 'Ver teléfono y correo de otro usuario'),
  (10, 'historial.ver_propio', 'Cuenta y perfil', 'Ver el historial propio (vistas, guardadas o publicadas)'),
  (11, 'propiedad.ver_catalogo', 'Propiedades', 'Ver el catálogo de propiedades publicadas'),
  (12, 'propiedad.ver_ficha', 'Propiedades', 'Ver la ficha completa de una propiedad'),
  (13, 'propiedad.crear', 'Propiedades', 'Crear y guardar un borrador de propiedad'),
  (14, 'propiedad.publicar', 'Propiedades', 'Publicar una propiedad'),
  (15, 'propiedad.editar', 'Propiedades', 'Editar datos, precio y ubicación'),
  (16, 'propiedad.cambiar_estado', 'Propiedades', 'Pausar, reactivar o marcar como vendida/alquilada'),
  (17, 'propiedad.renovar', 'Propiedades', 'Renovar un anuncio próximo a expirar'),
  (18, 'propiedad.eliminar', 'Propiedades', 'Eliminar una propiedad propia'),
  (19, 'foto.gestionar', 'Propiedades', 'Subir, ordenar, eliminar fotos y elegir portada'),
  (20, 'precio.ver_historial', 'Propiedades', 'Ver la línea de tiempo de precios'),
  (21, 'mapa.ver', 'Mapa e índice', 'Ver mapa, vista satelital y Street View'),
  (22, 'poi.ver', 'Mapa e índice', 'Ver puntos de interés, radio y filtro de categorías'),
  (23, 'indice.ver', 'Mapa e índice', 'Ver el Índice de Conveniencia y su desglose'),
  (24, 'indice.recalcular', 'Mapa e índice', 'Forzar el recálculo del índice'),
  (25, 'indice.configurar_pesos', 'Mapa e índice', 'Modificar categorías y pesos del algoritmo'),
  (26, 'busqueda.usar', 'Búsqueda y favoritos', 'Buscar por texto y filtros combinables'),
  (27, 'busqueda.mapa', 'Búsqueda y favoritos', 'Buscar directamente sobre el mapa'),
  (28, 'favorito.gestionar', 'Búsqueda y favoritos', 'Guardar y quitar favoritos'),
  (29, 'comparador.usar', 'Búsqueda y favoritos', 'Comparar hasta 3 favoritos'),
  (30, 'busqueda.guardar_alerta', 'Búsqueda y favoritos', 'Guardar una búsqueda y recibir alertas por correo'),
  (31, 'conversacion.iniciar', 'Mensajería', 'Iniciar una conversación con el vendedor de una propiedad'),
  (32, 'mensaje.enviar', 'Mensajería', 'Enviar mensajes en una conversación'),
  (33, 'conversacion.ver_propias', 'Mensajería', 'Ver sus conversaciones e historial'),
  (34, 'notificacion.ver_propias', 'Mensajería', 'Ver y marcar como leídas sus notificaciones'),
  (35, 'disponibilidad.gestionar', 'Agenda de visitas', 'Definir horarios disponibles para visitas'),
  (36, 'visita.solicitar', 'Agenda de visitas', 'Solicitar una visita en un horario disponible'),
  (37, 'visita.confirmar', 'Agenda de visitas', 'Confirmar o reprogramar una visita'),
  (38, 'visita.cancelar', 'Agenda de visitas', 'Cancelar una visita'),
  (39, 'visita.ver_propias', 'Agenda de visitas', 'Ver sus visitas agendadas'),
  (40, 'resena.crear', 'Reputación', 'Calificar y reseñar a un vendedor'),
  (41, 'resena.ver', 'Reputación', 'Ver reseñas y calificación promedio'),
  (42, 'comentario_zona.crear', 'Reputación', 'Comentar sobre la zona de una propiedad'),
  (43, 'comentario_zona.ver', 'Reputación', 'Ver comentarios sobre la zona'),
  (44, 'reporte.crear', 'Reputación', 'Reportar una publicación, usuario o comentario'),
  (45, 'verificacion.solicitar', 'Vendedor', 'Enviar documentos para verificación de identidad'),
  (46, 'estadisticas.ver_propias', 'Vendedor', 'Ver estadísticas de sus propiedades'),
  (47, 'verificacion.revisar', 'Administración', 'Aprobar o rechazar verificaciones de vendedores'),
  (48, 'moderacion.ver_reportes', 'Administración', 'Ver y atender la cola de reportes'),
  (49, 'moderacion.publicacion', 'Administración', 'Aprobar, pausar o eliminar publicaciones'),
  (50, 'moderacion.comentario', 'Administración', 'Ocultar reseñas o comentarios de zona'),
  (51, 'usuario.listar', 'Administración', 'Ver y buscar usuarios de la plataforma'),
  (52, 'usuario.suspender', 'Administración', 'Suspender, inhabilitar o reactivar cuentas'),
  (53, 'usuario.asignar_admin', 'Administración', 'Asignar o quitar el rol de administrador'),
  (54, 'estadisticas.ver_generales', 'Administración', 'Ver estadísticas generales de la plataforma'),
  (55, 'auditoria.ver', 'Administración', 'Ver el historial de acciones de moderación')
ON CONFLICT (id) DO NOTHING;

-- Insertar Relación RolPermiso
INSERT INTO rol_permiso (rol_id, permiso_id) VALUES
  (1, 4), (2, 4), (1, 5), (1, 6), (2, 6), (3, 6), (1, 7), (2, 7), (3, 7), 
  (1, 8), (2, 8), (3, 8), (1, 9), (2, 9), (3, 9), (1, 10), (2, 10), (1, 11), 
  (2, 11), (3, 11), (1, 12), (2, 12), (3, 12), (2, 13), (2, 14), (2, 15), 
  (2, 16), (2, 17), (2, 18), (2, 19), (1, 20), (2, 20), (3, 20), (1, 21), 
  (2, 21), (3, 21), (1, 22), (2, 22), (3, 22), (1, 23), (2, 23), (3, 23), 
  (3, 24), (3, 25), (1, 26), (2, 26), (3, 26), (1, 27), (2, 27), (3, 27), 
  (1, 28), (1, 29), (1, 30), (1, 31), (1, 32), (2, 32), (1, 33), (2, 33), 
  (1, 34), (2, 34), (3, 34), (2, 35), (1, 36), (2, 37), (1, 38), (2, 38), 
  (1, 39), (2, 39), (1, 40), (1, 41), (2, 41), (3, 41), (1, 42), (1, 43), 
  (2, 43), (3, 43), (1, 44), (2, 44), (2, 45), (2, 46), (3, 47), (3, 48), 
  (3, 49), (3, 50), (3, 51), (3, 52), (3, 53), (3, 54), (3, 55)
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

COMMIT;