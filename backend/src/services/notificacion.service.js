const repo = require('../repositories/notificacion.repository');
const { emitirAUsuario } = require('../sockets/emisor');
const { enviarCorreo } = require('./email.service');

const notificar = async (usuarioId, datos, opciones = {}) => {
  try {
    const n = await repo.crear({ usuario_id: usuarioId, ...datos });
    emitirAUsuario(usuarioId, 'notificacion:nueva', {
      id: String(n.id), tipo: n.tipo, titulo: n.titulo, contenido: n.contenido,
      referencia_tipo: n.referencia_tipo, referencia_id: n.referencia_id, fecha_creacion: n.fecha_creacion,
    });
    if (opciones.correo) {
      const salio = await enviarCorreo({ ...opciones.correo, texto: datos.contenido });
      if (salio) await repo.marcarCorreoEnviado(n.id);
    }
    return n;
  } catch (error) {
    console.error('[notificación]', error.message);
    return null;
  }
};

module.exports = { notificar };