const repo = require('../repositories/mensajeria.repository');
const { ErrorApp } = require('../utils/errors');
const { emitirAUsuario } = require('../sockets/emisor');

const MAX_CARACTERES = 2000;
const LIMITE_POR_DEFECTO = 50;
const LIMITE_MAXIMO = 100;

// Criterio de aceptación: no se comparten datos de contacto dentro del chat.
const BLOQUEAR_DATOS_CONTACTO = false;
const REGEX_CORREO = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const REGEX_TELEFONO = /(?:\+?\d[\s().-]?){8,}/;

const formatearMensaje = (m) => ({
  id: String(m.id),
  conversacion_id: m.conversacion_id,
  remitente_id: m.remitente_id,
  contenido: m.contenido,
  fecha_envio: m.fecha_envio,
  leido_en: m.leido_en,
});

const esParticipante = (conv, usuarioId) =>
  conv.comprador_id === usuarioId || conv.vendedor_id === usuarioId;

const obtenerConversacionPropia = async (conversacionId, usuarioId) => {
  const id = Number(conversacionId);
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) throw new ErrorApp('Conversación inválida', 400);
  const conv = await repo.findConversacionById(id);
  if (!conv) throw new ErrorApp('Conversación no encontrada', 404);
  if (!esParticipante(conv, usuarioId)) throw new ErrorApp('No tienes acceso a esta conversación', 403);
  return conv;
};

const validarContenido = (contenido) => {
  if (typeof contenido !== 'string' || !contenido.trim()) throw new ErrorApp('El mensaje no puede estar vacío', 400);
  const limpio = contenido.trim();
  if (limpio.length > MAX_CARACTERES) throw new ErrorApp(`El mensaje no puede pasar de ${MAX_CARACTERES} caracteres`, 400);
  if (BLOQUEAR_DATOS_CONTACTO && (REGEX_CORREO.test(limpio) || REGEX_TELEFONO.test(limpio))) {
    throw new ErrorApp('Por seguridad no se pueden compartir correos ni teléfonos en el chat', 400);
  }
  return limpio;
};

const nombreCompleto = (u) => `${u.nombre} ${u.apellido}`.trim();

const formatearConversacion = (conv, usuarioId, noLeidos = 0) => {
  const soyComprador = conv.comprador_id === usuarioId;
  const otro = soyComprador
    ? conv.usuario_conversacion_vendedor_idTousuario
    : conv.usuario_conversacion_comprador_idTousuario;
  const ultimo = conv.mensaje?.[0];
  return {
    id: conv.id,
    propiedad: conv.propiedad,
    otro_usuario: { id: otro.id, nombre: nombreCompleto(otro), foto_url: otro.foto_url },
    mi_rol: soyComprador ? 'comprador' : 'vendedor',
    ultimo_mensaje: ultimo ? formatearMensaje(ultimo) : null,
    ultimo_mensaje_en: conv.ultimo_mensaje_en,
    no_leidos: noLeidos,
  };
};

// ---- Casos de uso ----

// Un comprador abre (o reutiliza) la conversación de una propiedad; opcionalmente envía el primer mensaje
const iniciarConversacion = async (usuarioId, { propiedad_id, contenido } = {}) => {
  const propiedadId = Number(propiedad_id);
  if (!Number.isInteger(propiedadId) || propiedadId <= 0 || propiedadId > 2147483647) {
    throw new ErrorApp('propiedad_id inválido', 400);
  }
  const propiedad = await repo.findPropiedad(propiedadId);
  if (!propiedad) throw new ErrorApp('Propiedad no encontrada', 404);
  if (propiedad.vendedor_id === usuarioId) throw new ErrorApp('No puedes enviarte mensajes a ti mismo', 400);
  if (propiedad.estado !== 'publicado') throw new ErrorApp('Esta propiedad no está disponible para recibir mensajes', 400);
  const textoInicial = contenido === undefined || contenido === null || contenido === '' ? null : validarContenido(contenido);

  const conv = await repo.upsertConversacion({
    propiedad_id: propiedad.id,
    comprador_id: usuarioId,
    vendedor_id: propiedad.vendedor_id,
  });
  let mensaje = null;
  if (textoInicial) mensaje = await enviarMensaje(usuarioId, conv.id, textoInicial);
  return { conversacion_id: conv.id, mensaje };
};

const listarConversaciones = async (usuarioId) => {
  const convs = await repo.listarConversaciones(usuarioId);
  const noLeidos = await repo.contarNoLeidos(convs.map((c) => c.id), usuarioId);
  return convs.map((c) => formatearConversacion(c, usuarioId, noLeidos[c.id] || 0));
};

const obtenerConversacion = async (usuarioId, conversacionId) => {
  const conv = await obtenerConversacionPropia(conversacionId, usuarioId);
  return formatearConversacion(conv, usuarioId);
};

const listarMensajes = async (usuarioId, conversacionId, { antes, limite } = {}) => {
  const conv = await obtenerConversacionPropia(conversacionId, usuarioId);
  let limit = Number(limite) || LIMITE_POR_DEFECTO;
  limit = Math.min(Math.max(limit, 1), LIMITE_MAXIMO);
  if (antes !== undefined && !/^\d+$/.test(String(antes))) throw new ErrorApp('Parámetro "antes" inválido', 400);

  const mensajes = await repo.listarMensajes(conv.id, { antes, limite: limit });
  // Al abrir el chat, lo que el otro escribió queda como leído
  if (!antes) {
    const marcados = await repo.marcarLeidos(conv.id, usuarioId);
    if (marcados > 0) {
      const otroId = conv.comprador_id === usuarioId ? conv.vendedor_id : conv.comprador_id;
      emitirAUsuario(otroId, 'mensajes:leidos', { conversacion_id: conv.id, lector_id: usuarioId });
    }
  }
  return { mensajes: mensajes.map(formatearMensaje), hay_mas: mensajes.length === limit };
};

const enviarMensaje = async (usuarioId, conversacionId, contenido) => {
  const texto = validarContenido(contenido);
  const conv = await obtenerConversacionPropia(conversacionId, usuarioId);
  const destinatarioId = conv.comprador_id === usuarioId ? conv.vendedor_id : conv.comprador_id;
  const remitente = conv.comprador_id === usuarioId
    ? conv.usuario_conversacion_comprador_idTousuario
    : conv.usuario_conversacion_vendedor_idTousuario;

  const { mensaje, notificacion } = await repo.crearMensajeConNotificacion({
    conversacionId: conv.id,
    remitenteId: usuarioId,
    contenido: texto,
    destinatarioId,
    tituloNotificacion: `Nuevo mensaje de ${nombreCompleto(remitente)} sobre "${conv.propiedad.titulo}"`,
  });

  const payload = formatearMensaje(mensaje);
  // Instantáneo: al destinatario (notificación + mensaje) y a las otras pestañas del remitente
  emitirAUsuario(destinatarioId, 'mensaje:nuevo', {
    mensaje: payload,
    conversacion: { id: conv.id, propiedad: conv.propiedad, de: nombreCompleto(remitente) },
  });
  emitirAUsuario(destinatarioId, 'notificacion:nueva', {
    id: String(notificacion.id),
    tipo: notificacion.tipo,
    titulo: notificacion.titulo,
    contenido: notificacion.contenido,
    referencia_tipo: notificacion.referencia_tipo,
    referencia_id: notificacion.referencia_id,
    fecha_creacion: notificacion.fecha_creacion,
  });
  emitirAUsuario(usuarioId, 'mensaje:enviado', { mensaje: payload });
  return payload;
};

module.exports = {
  iniciarConversacion, listarConversaciones, obtenerConversacion,
  listarMensajes, enviarMensaje, MAX_CARACTERES,
};