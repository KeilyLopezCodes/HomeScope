const service = require('../services/mensajeria.service');
const { responderError } = require('../utils/errors');

const iniciar = async (req, res) => {
  try {
    const data = await service.iniciarConversacion(req.user.id, req.body || {});
    res.status(201).json({ success: true, message: 'Conversación lista', data });
  } catch (error) { responderError(res, error); }
};

const listar = async (req, res) => {
  try {
    res.json({ success: true, data: await service.listarConversaciones(req.user.id) });
  } catch (error) { responderError(res, error); }
};

const obtener = async (req, res) => {
  try {
    res.json({ success: true, data: await service.obtenerConversacion(req.user.id, req.params.id) });
  } catch (error) { responderError(res, error); }
};

const listarMensajes = async (req, res) => {
  try {
    const { antes, limite } = req.query;
    res.json({ success: true, data: await service.listarMensajes(req.user.id, req.params.id, { antes, limite }) });
  } catch (error) { responderError(res, error); }
};

const enviar = async (req, res) => {
  try {
    const data = await service.enviarMensaje(req.user.id, req.params.id, (req.body || {}).contenido);
    res.status(201).json({ success: true, message: 'Mensaje enviado', data });
  } catch (error) { responderError(res, error); }
};

module.exports = { iniciar, listar, obtener, listarMensajes, enviar };