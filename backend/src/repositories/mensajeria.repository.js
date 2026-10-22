const IMensajeriaRepository = require('../interfaces/IMensajeria.repository');
const prisma = require('../config/db');

// Solo se exponen datos públicos del usuario: NUNCA correo ni teléfono
const USUARIO_PUBLICO = { select: { id: true, nombre: true, apellido: true, foto_url: true } };

class MensajeriaRepositoryPrisma extends IMensajeriaRepository {
  async findPropiedad(propiedadId) {
    return prisma.propiedad.findUnique({
      where: { id: Number(propiedadId) },
      select: { id: true, titulo: true, vendedor_id: true, estado: true },
    });
  }

  // Una conversación por (propiedad, comprador): si ya existe se reutiliza
  async upsertConversacion({ propiedad_id, comprador_id, vendedor_id }) {
    return prisma.conversacion.upsert({
      where: { propiedad_id_comprador_id: { propiedad_id, comprador_id } },
      update: {},
      create: { propiedad_id, comprador_id, vendedor_id },
    });
  }

  async findConversacionById(id) {
    return prisma.conversacion.findUnique({
      where: { id: Number(id) },
      include: {
        propiedad: { select: { id: true, titulo: true } },
        usuario_conversacion_comprador_idTousuario: USUARIO_PUBLICO,
        usuario_conversacion_vendedor_idTousuario: USUARIO_PUBLICO,
      },
    });
  }

  async listarConversaciones(usuarioId) {
    return prisma.conversacion.findMany({
      where: { OR: [{ comprador_id: usuarioId }, { vendedor_id: usuarioId }] },
      include: {
        propiedad: { select: { id: true, titulo: true } },
        usuario_conversacion_comprador_idTousuario: USUARIO_PUBLICO,
        usuario_conversacion_vendedor_idTousuario: USUARIO_PUBLICO,
        mensaje: { orderBy: { fecha_envio: 'desc' }, take: 1 },
      },
      orderBy: [{ ultimo_mensaje_en: { sort: 'desc', nulls: 'last' } }, { fecha_inicio: 'desc' }],
    });
  }

  // Devuelve { [conversacion_id]: cantidad } de mensajes del otro sin leer
  async contarNoLeidos(conversacionIds, usuarioId) {
    if (!conversacionIds.length) return {};
    const filas = await prisma.mensaje.groupBy({
      by: ['conversacion_id'],
      where: { conversacion_id: { in: conversacionIds }, remitente_id: { not: usuarioId }, leido_en: null },
      _count: { _all: true },
    });
    return Object.fromEntries(filas.map((f) => [f.conversacion_id, f._count._all]));
  }

  // Paginación hacia atrás: trae los `limite` mensajes anteriores a `antes` (id) y los devuelve cronológicos
  async listarMensajes(conversacionId, { antes, limite }) {
    const filas = await prisma.mensaje.findMany({
      where: { conversacion_id: Number(conversacionId), ...(antes ? { id: { lt: BigInt(antes) } } : {}) },
      orderBy: { id: 'desc' },
      take: limite,
    });
    return filas.reverse();
  }

  async marcarLeidos(conversacionId, usuarioId) {
    const r = await prisma.mensaje.updateMany({
      where: { conversacion_id: Number(conversacionId), remitente_id: { not: usuarioId }, leido_en: null },
      data: { leido_en: new Date() },
    });
    return r.count;
  }

  // Mensaje + actualización de la conversación + notificación: todo en una transacción
  async crearMensajeConNotificacion({ conversacionId, remitenteId, contenido, destinatarioId, tituloNotificacion }) {
    return prisma.$transaction(async (tx) => {
      const mensaje = await tx.mensaje.create({
        data: { conversacion_id: conversacionId, remitente_id: remitenteId, contenido },
      });
      await tx.conversacion.update({
        where: { id: conversacionId },
        data: { ultimo_mensaje_en: mensaje.fecha_envio },
      });
      const notificacion = await tx.notificacion.create({
        data: {
          usuario_id: destinatarioId,
          tipo: 'mensaje_nuevo',
          titulo: tituloNotificacion.slice(0, 150),
          contenido: contenido.slice(0, 500),
          referencia_tipo: 'conversacion',
          referencia_id: conversacionId,
        },
      });
      return { mensaje, notificacion };
    });
  }
}

module.exports = new MensajeriaRepositoryPrisma();