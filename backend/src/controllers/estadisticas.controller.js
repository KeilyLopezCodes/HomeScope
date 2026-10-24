const service = require('../services/estadisticas.service');

const responder = (res, error) => {
  if (error.status) return res.status(error.status).json({ success: false, message: error.message });
  console.error('[estadísticas]', error);
  return res.status(500).json({ success: false, message: 'Error interno del servidor' });
};

exports.panel = async (req, res) => {
  try {
    res.json({ success: true, data: await service.obtenerPanel(req.user.id, req.query.dias) });
  } catch (error) {
    responder(res, error);
  }
};

// Nunca falla de cara al visitante: registrar una vista es secundario
exports.vista = async (req, res) => {
  try {
    res.json({ success: true, data: await service.registrarVista(req.params.propiedadId, req.user?.id) });
  } catch (error) {
    if (error.status) return responder(res, error);
    console.error('[vista]', error);
    res.json({ success: true, data: { registrada: false } });
  }
};