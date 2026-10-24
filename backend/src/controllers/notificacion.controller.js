const service = require('../services/notificacion.service');
const { responderError } = require('../utils/errors');

const envolver = (fn) => async (req, res) => {
  try { res.json(await fn(req)); } catch (e) { responderError(res, e); }
};

exports.listar = envolver((req) => service.listar(req.user.id, req.query));
exports.contar = envolver((req) => service.contarNoLeidas(req.user.id));
exports.marcarLeida = envolver((req) => service.marcarLeida(req.params.id, req.user.id));
exports.marcarTodas = envolver((req) => service.marcarTodasLeidas(req.user.id));