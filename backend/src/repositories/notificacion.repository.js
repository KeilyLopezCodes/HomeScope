const prisma = require('../config/db');

class NotificacionRepositoryPrisma {
  async crear({ usuario_id, tipo, titulo, contenido, referencia_tipo = null, referencia_id = null }) {
    return prisma.notificacion.create({
      data: {
        usuario_id, tipo,
        titulo: titulo.slice(0, 150),
        contenido: contenido.slice(0, 500),
        referencia_tipo, referencia_id,
      },
    });
  }

  // Deja constancia de que esta notificación también salió por correo
  async marcarCorreoEnviado(id) {
    return prisma.notificacion.update({ where: { id }, data: { enviada_correo: true } });
  }

    async listar(usuarioId, { soloNoLeidas = false, limite = 30, pagina = 1 } = {}) {
    const where = { usuario_id: usuarioId, ...(soloNoLeidas ? { leida: false } : {}) };
    const [items, total] = await Promise.all([
      prisma.notificacion.findMany({
        where, orderBy: { fecha_creacion: 'desc' },
        take: limite, skip: (pagina - 1) * limite,
      }),
      prisma.notificacion.count({ where }),
    ]);
    return { items, total };
  }

  async contarNoLeidas(usuarioId) {
    return prisma.notificacion.count({ where: { usuario_id: usuarioId, leida: false } });
  }

  // Solo marca las del propio usuario; devuelve cuántas cambió
  async marcarLeida(id, usuarioId) {
    const r = await prisma.notificacion.updateMany({
      where: { id: BigInt(id), usuario_id: usuarioId, leida: false },
      data: { leida: true },
    });
    return r.count;
  }

  async marcarTodasLeidas(usuarioId) {
    const r = await prisma.notificacion.updateMany({
      where: { usuario_id: usuarioId, leida: false },
      data: { leida: true },
    });
    return r.count;
  }
}

module.exports = new NotificacionRepositoryPrisma();