-- HomeScope · Carga inicial de roles y permisos (PostgreSQL)
-- Versión PostgreSQL de HomeScope_seed_roles_permisos.sql (SQL Server). Idempotente: ON CONFLICT DO NOTHING.
-- Generado a partir de HomeScope_Matriz_Roles_Permisos.xlsx
-- 'Propio' y 'Condicional' se conceden aquí; la verificación de dueño o condición se hace en el backend.
-- El 'Visitante' no es un rol: sus permisos corresponden a rutas públicas sin JWT.

BEGIN;

INSERT INTO rol (id, nombre) VALUES (1, 'comprador'), (2, 'vendedor'), (3, 'administrador')
ON CONFLICT DO NOTHING;

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
ON CONFLICT DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id) VALUES
  (1, 4),  -- comprador: cuenta.verificar_correo (Sí)
  (2, 4),  -- vendedor: cuenta.verificar_correo (Sí)
  (1, 5),  -- comprador: cuenta.activar_rol_vendedor (Sí)
  (1, 6),  -- comprador: perfil.ver_propio (Sí)
  (2, 6),  -- vendedor: perfil.ver_propio (Sí)
  (3, 6),  -- administrador: perfil.ver_propio (Sí)
  (1, 7),  -- comprador: perfil.editar_propio (Sí)
  (2, 7),  -- vendedor: perfil.editar_propio (Sí)
  (3, 7),  -- administrador: perfil.editar_propio (Sí)
  (1, 8),  -- comprador: perfil.ver_publico (Sí)
  (2, 8),  -- vendedor: perfil.ver_publico (Sí)
  (3, 8),  -- administrador: perfil.ver_publico (Sí)
  (1, 9),  -- comprador: perfil.ver_contacto (Condicional)
  (2, 9),  -- vendedor: perfil.ver_contacto (Condicional)
  (3, 9),  -- administrador: perfil.ver_contacto (Sí)
  (1, 10),  -- comprador: historial.ver_propio (Propio)
  (2, 10),  -- vendedor: historial.ver_propio (Propio)
  (1, 11),  -- comprador: propiedad.ver_catalogo (Sí)
  (2, 11),  -- vendedor: propiedad.ver_catalogo (Sí)
  (3, 11),  -- administrador: propiedad.ver_catalogo (Sí)
  (1, 12),  -- comprador: propiedad.ver_ficha (Sí)
  (2, 12),  -- vendedor: propiedad.ver_ficha (Sí)
  (3, 12),  -- administrador: propiedad.ver_ficha (Sí)
  (2, 13),  -- vendedor: propiedad.crear (Sí)
  (2, 14),  -- vendedor: propiedad.publicar (Condicional)
  (2, 15),  -- vendedor: propiedad.editar (Propio)
  (2, 16),  -- vendedor: propiedad.cambiar_estado (Propio)
  (2, 17),  -- vendedor: propiedad.renovar (Propio)
  (2, 18),  -- vendedor: propiedad.eliminar (Propio)
  (2, 19),  -- vendedor: foto.gestionar (Propio)
  (1, 20),  -- comprador: precio.ver_historial (Sí)
  (2, 20),  -- vendedor: precio.ver_historial (Sí)
  (3, 20),  -- administrador: precio.ver_historial (Sí)
  (1, 21),  -- comprador: mapa.ver (Sí)
  (2, 21),  -- vendedor: mapa.ver (Sí)
  (3, 21),  -- administrador: mapa.ver (Sí)
  (1, 22),  -- comprador: poi.ver (Sí)
  (2, 22),  -- vendedor: poi.ver (Sí)
  (3, 22),  -- administrador: poi.ver (Sí)
  (1, 23),  -- comprador: indice.ver (Sí)
  (2, 23),  -- vendedor: indice.ver (Sí)
  (3, 23),  -- administrador: indice.ver (Sí)
  (3, 24),  -- administrador: indice.recalcular (Sí)
  (3, 25),  -- administrador: indice.configurar_pesos (Sí)
  (1, 26),  -- comprador: busqueda.usar (Sí)
  (2, 26),  -- vendedor: busqueda.usar (Sí)
  (3, 26),  -- administrador: busqueda.usar (Sí)
  (1, 27),  -- comprador: busqueda.mapa (Sí)
  (2, 27),  -- vendedor: busqueda.mapa (Sí)
  (3, 27),  -- administrador: busqueda.mapa (Sí)
  (1, 28),  -- comprador: favorito.gestionar (Propio)
  (1, 29),  -- comprador: comparador.usar (Propio)
  (1, 30),  -- comprador: busqueda.guardar_alerta (Propio)
  (1, 31),  -- comprador: conversacion.iniciar (Condicional)
  (1, 32),  -- comprador: mensaje.enviar (Condicional)
  (2, 32),  -- vendedor: mensaje.enviar (Condicional)
  (1, 33),  -- comprador: conversacion.ver_propias (Propio)
  (2, 33),  -- vendedor: conversacion.ver_propias (Propio)
  (1, 34),  -- comprador: notificacion.ver_propias (Propio)
  (2, 34),  -- vendedor: notificacion.ver_propias (Propio)
  (3, 34),  -- administrador: notificacion.ver_propias (Propio)
  (2, 35),  -- vendedor: disponibilidad.gestionar (Propio)
  (1, 36),  -- comprador: visita.solicitar (Condicional)
  (2, 37),  -- vendedor: visita.confirmar (Propio)
  (1, 38),  -- comprador: visita.cancelar (Propio)
  (2, 38),  -- vendedor: visita.cancelar (Propio)
  (1, 39),  -- comprador: visita.ver_propias (Propio)
  (2, 39),  -- vendedor: visita.ver_propias (Propio)
  (1, 40),  -- comprador: resena.crear (Condicional)
  (1, 41),  -- comprador: resena.ver (Sí)
  (2, 41),  -- vendedor: resena.ver (Sí)
  (3, 41),  -- administrador: resena.ver (Sí)
  (1, 42),  -- comprador: comentario_zona.crear (Condicional)
  (1, 43),  -- comprador: comentario_zona.ver (Sí)
  (2, 43),  -- vendedor: comentario_zona.ver (Sí)
  (3, 43),  -- administrador: comentario_zona.ver (Sí)
  (1, 44),  -- comprador: reporte.crear (Sí)
  (2, 44),  -- vendedor: reporte.crear (Sí)
  (2, 45),  -- vendedor: verificacion.solicitar (Sí)
  (2, 46),  -- vendedor: estadisticas.ver_propias (Propio)
  (3, 47),  -- administrador: verificacion.revisar (Sí)
  (3, 48),  -- administrador: moderacion.ver_reportes (Sí)
  (3, 49),  -- administrador: moderacion.publicacion (Sí)
  (3, 50),  -- administrador: moderacion.comentario (Sí)
  (3, 51),  -- administrador: usuario.listar (Sí)
  (3, 52),  -- administrador: usuario.suspender (Sí)
  (3, 53),  -- administrador: usuario.asignar_admin (Sí)
  (3, 54),  -- administrador: estadisticas.ver_generales (Sí)
  (3, 55)  -- administrador: auditoria.ver (Sí)
ON CONFLICT DO NOTHING;

COMMIT;
