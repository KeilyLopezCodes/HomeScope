const agenda = require('../services/agenda.service');
const { responderError } = require('../utils/errors');

const manejar = (res, error) => {
  if (error.status) return res.status(error.status).json({ success: false, message: error.message });
  return responderError(res, error);
};

const envolver = (fn) => async (req, res) => {
  try { await fn(req, res); } catch (error) { manejar(res, error); }
};

const getMiDisponibilidad = envolver(async (req, res) => {
  res.json({ success: true, data: await agenda.obtenerMiDisponibilidad(req.user.id) });
});

const putDisponibilidad = envolver(async (req, res) => {
  const data = await agenda.guardarDisponibilidad(req.user.id, req.body || {});
  res.json({ success: true, message: 'Disponibilidad guardada', data });
});

const getHorarios = envolver(async (req, res) => {
  res.json({ success: true, data: await agenda.listarHorarios(req.params.propiedadId, req.query.dias) });
});

const postVisita = envolver(async (req, res) => {
  const data = await agenda.solicitarVisita(req.user.id, req.body || {});
  res.status(201).json({ success: true, message: 'Visita solicitada. El vendedor fue notificado.', data });
});

const getVisitas = envolver(async (req, res) => {
  res.json({ success: true, data: await agenda.listarMisVisitas(req.user.id) });
});

const patchConfirmar = envolver(async (req, res) => {
  res.json({ success: true, message: 'Visita confirmada', data: await agenda.confirmarVisita(req.user.id, req.params.id) });
});

const patchReprogramar = envolver(async (req, res) => {
  const data = await agenda.reprogramarVisita(req.user.id, req.params.id, req.body || {});
  res.json({ success: true, message: 'Visita reprogramada. El comprador debe aceptar el nuevo horario.', data });
});

const patchAceptar = envolver(async (req, res) => {
  res.json({ success: true, message: 'Reprogramación aceptada', data: await agenda.aceptarReprogramacion(req.user.id, req.params.id) });
});

const patchCancelar = envolver(async (req, res) => {
  res.json({ success: true, message: 'Visita cancelada', data: await agenda.cancelarVisita(req.user.id, req.params.id) });
});

module.exports = {
  getMiDisponibilidad, putDisponibilidad, getHorarios, postVisita, getVisitas,
  patchConfirmar, patchReprogramar, patchAceptar, patchCancelar,
};