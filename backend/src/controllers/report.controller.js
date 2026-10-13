const reportService = require('../services/report.service');

const handleError = (res, error) => {
  if (error.status) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(error);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
};

const getMotivos = (req, res) => {
  res.json({ success: true, data: reportService.getMotivos() });
};

const reportProperty = async (req, res) => {
  try {
    const reporte = await reportService.reportProperty(req.params.id, req.user.id, req.body || {});
    res.status(201).json({
      success: true,
      message: 'Gracias por tu reporte. Nuestro equipo de moderación lo revisará.',
      data: {
        id: reporte.id,
        propiedad_id: reporte.propiedad_id,
        motivo: reporte.motivo,
        descripcion: reporte.descripcion,
        estado: reporte.estado,
        fecha_creacion: reporte.fecha_creacion
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getMotivos,
  reportProperty
};
