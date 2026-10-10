const fotoService = require('../services/foto.service');

const subirFotos = async (req, res) => {
  try {
    const portada = req.body.portada !== undefined ? parseInt(req.body.portada, 10) : undefined;
    const fotos = await fotoService.subirFotos(req.params.id, req.user.id, req.files, portada);
    res.status(201).json({ success: true, message: 'Fotos subidas correctamente', data: fotos });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const reordenar = async (req, res) => {
  try {
    const { ids, portadaId } = req.body;
    const fotos = await fotoService.reordenarFotos(req.params.id, req.user.id, ids, portadaId);
    res.json({ success: true, message: 'Orden actualizado', data: fotos });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const eliminar = async (req, res) => {
  try {
    await fotoService.eliminarFoto(req.params.id, req.params.fotoId, req.user.id);
    res.json({ success: true, message: 'Foto eliminada' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { subirFotos, reordenar, eliminar };