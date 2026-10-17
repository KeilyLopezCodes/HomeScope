const geoIndiceService = require('../services/geo-indice.service');

// GET /propiedades/:id/indice
async function obtenerIndice(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: { code: 'ID_INVALIDO', message: 'Id de propiedad inválido' } });
    }
    const indice = await geoIndiceService.obtenerVigente(id);
    if (!indice) return res.status(200).json({ estado: 'en_calculo' });
    return res.json(indice);
  } catch (err) {
    return next(err);
  }
}

// POST /propiedades/:id/indice/recalcular  (TEMPORAL: para pruebas)
async function recalcular(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: { code: 'ID_INVALIDO', message: 'Id de propiedad inválido' } });
    }
    const resultado = await geoIndiceService.calcularYGuardar(id);
    return res.json(resultado);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: { code: 'PROPIEDAD_NO_ENCONTRADA', message: err.message } });
    }
    return next(err);
  }
}

module.exports = { obtenerIndice, recalcular };