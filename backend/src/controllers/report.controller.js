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

// Renombra las relaciones generadas por Prisma a nombres legibles para la API
const formatearReporte = (r) => ({
  id: r.id,
  motivo: r.motivo,
  descripcion: r.descripcion,
  estado: r.estado,
  fecha_creacion: r.fecha_creacion,
  propiedad: r.propiedad,
  reportante: r.usuario_reporte_reportante_idTousuario,
  acciones_moderacion: r.accion_moderacion
});

const listReports = async (req, res) => {
  try {
    const { reportes, pagination } = await reportService.listReports(req.query);
    res.json({ success: true, data: reportes.map(formatearReporte), pagination });
  } catch (error) {
    handleError(res, error);
  }
};

const resolver = (accion, mensaje) => async (req, res) => {
  try {
    const reporte = await reportService[accion](req.params.id, req.user.id, req.body || {});
    res.json({ success: true, message: mensaje, data: formatearReporte(reporte) });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getMotivos,
  reportProperty,
  listReports,
  approveReport: resolver('approveReport', 'Reporte aprobado. La publicación no se modificó; queda a criterio de moderación.'),
  rejectReport: resolver('rejectReport', 'Reporte rechazado')
};
