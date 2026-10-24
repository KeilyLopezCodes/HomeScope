const service = require('../services/favorito.service');

const envolver = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    console.error('[favoritos]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.listar = envolver((req) => service.listar(req.user.id));
exports.agregar = envolver((req) => service.agregar(req.user.id, req.params.propiedadId));
exports.quitar = envolver((req) => service.quitar(req.user.id, req.params.propiedadId));
exports.lote = envolver((req) => service.agregarLote(req.user.id, req.body?.ids));