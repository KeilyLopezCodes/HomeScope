const adminService = require('../services/admin.service');

function responderError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error('[admin]', error);
  return res.status(status).json({
    success: false,
    message: status >= 500 ? 'Error interno del servidor' : error.message,
  });
}

const getReports = async (req, res) => {
  try {
    const r = await adminService.listarReportes(req.query);
    res.json({ success: true, data: r.items, pagination: r.pagination });
  } catch (error) { responderError(res, error); }
};

const getReportById = async (req, res) => {
  try {
    res.json({ success: true, data: await adminService.obtenerReporte(req.params.id) });
  } catch (error) { responderError(res, error); }
};

const updateReport = async (req, res) => {
  try {
    const data = await adminService.cambiarEstadoReporte(req.user.id, req.params.id, req.body || {});
    res.json({ success: true, message: 'Reporte actualizado y acción registrada', data });
  } catch (error) { responderError(res, error); }
};

const moderateProperty = async (req, res) => {
  try {
    const data = await adminService.cambiarEstadoPropiedad(req.user.id, req.params.id, req.body || {});
    res.json({ success: true, message: 'Acción de moderación aplicada y registrada', data });
  } catch (error) { responderError(res, error); }
};

const removeProperty = async (req, res) => {
  try {
    const data = await adminService.eliminarPropiedad(req.user.id, req.params.id, req.body || {});
    res.json({ success: true, message: 'Propiedad eliminada y acción registrada', data });
  } catch (error) { responderError(res, error); }
};

const moderateUser = async (req, res) => {
  try {
    const data = await adminService.cambiarEstadoUsuario(req.user.id, req.params.id, req.body || {});
    res.json({ success: true, message: 'Acción de moderación aplicada y registrada', data });
  } catch (error) { responderError(res, error); }
};

const getActions = async (req, res) => {
  try {
    const r = await adminService.listarAcciones(req.query);
    res.json({ success: true, data: r.items, pagination: r.pagination });
  } catch (error) { responderError(res, error); }
};

const getUsers = async (req, res) => {
  try {
    const r = await adminService.listarUsuarios(req.query);
    res.json({ success: true, data: r.items, pagination: r.pagination });
  } catch (error) { responderError(res, error); }
};

module.exports = {
  getReports, getReportById, updateReport, moderateProperty,
  removeProperty, moderateUser, getActions, getUsers,
};