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
}

module.exports = new NotificacionRepositoryPrisma();