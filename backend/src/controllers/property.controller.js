const propertyService = require('../services/property.service');

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
    res.status(404).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : 1; 

    const updatedProperty = await propertyService.updateProperty(id, req.body, userId);

    res.status(200).json({
      success: true,
      message: 'Propiedad actualizada exitosamente',
      data: updatedProperty
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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