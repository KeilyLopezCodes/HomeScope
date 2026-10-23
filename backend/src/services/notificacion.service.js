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

const serializar = (n) => ({
  id: String(n.id), tipo: n.tipo, titulo: n.titulo, contenido: n.contenido,
  referencia_tipo: n.referencia_tipo,
  referencia_id: n.referencia_id === null ? null : String(n.referencia_id),
  leida: n.leida, fecha_creacion: n.fecha_creacion,
});

const listar = async (usuarioId, query) => {
  const limite = Math.min(Number(query.limit) || 30, 100);
  const pagina = Math.max(Number(query.page) || 1, 1);
  const { items, total } = await repo.listar(usuarioId, {
    soloNoLeidas: query.solo_no_leidas === 'true', limite, pagina,
  });
  const noLeidas = await repo.contarNoLeidas(usuarioId);
  return { notificaciones: items.map(serializar), total, no_leidas: noLeidas, pagina, limite };
};

const contarNoLeidas = async (usuarioId) => ({ no_leidas: await repo.contarNoLeidas(usuarioId) });
const marcarLeida = async (id, usuarioId) => ({ actualizadas: await repo.marcarLeida(id, usuarioId) });
const marcarTodasLeidas = async (usuarioId) => ({ actualizadas: await repo.marcarTodasLeidas(usuarioId) });

module.exports = { notificar, listar, contarNoLeidas, marcarLeida, marcarTodasLeidas };