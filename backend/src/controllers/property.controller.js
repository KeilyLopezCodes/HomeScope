const propertyService = require('../services/property.service');

const statusDeError = (error) => {
  if (error.message.includes('no encontrada')) return 404;
  if (error.message.includes('permisos')) return 403;
  if (error.message.includes('inválido') || error.message.includes('debe ser')) return 400;
  return 500;
};

const handleError = (res, error) => {
  const status = statusDeError(error);
  if (status === 500) console.error(error);
  res.status(status).json({ success: false, message: status === 500 ? 'Error interno del servidor' : error.message });
};

const create = async (req, res) => {
  try {
    const property = await propertyService.createProperty(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Propiedad publicada con éxito', data: property });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const result = await propertyService.getAllProperties(req.query);
    res.json({
      success: true,
      data: result.properties,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);
    res.json({ success: true, data: property });
  } catch (error) {
    handleError(res, error);
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProperty = await propertyService.updateProperty(id, req.body || {}, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Propiedad actualizada exitosamente',
      data: updatedProperty
    });
  } catch (error) {
    handleError(res, error);
  }
};

const getHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await propertyService.getPropertyHistory(id);

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    handleError(res, error);
  }
};

const remove = async (req, res) => {
  try {
    await propertyService.deleteProperty(req.params.id, req.user.id);
    res.json({ success: true, message: 'Propiedad eliminada correctamente' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Exportamos TODOS los métodos que se usan en property.routes.js
module.exports = {
  create,
  getAll,
  getById,
  update,
  getHistory,
  remove
};