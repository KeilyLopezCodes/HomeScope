const propertyService = require('../services/property.service');

const create = async (req, res) => {
  try {
    const property = await propertyService.createProperty(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Propiedad publicada con éxito', data: property });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const ORDENES_VALIDOS = ['precio', 'precio_desc', 'fecha', 'fecha_asc', 'indice'];
const MODALIDADES_VALIDAS = ['VENTA', 'ALQUILER'];

const getAll = async (req, res) => {
  try {
    const { q, modalidad, tipo_propiedad_id, precio_min, precio_max,
            habitaciones_min, indice_min, orden, page, limit } = req.query;

    // Validaciones de entrada
    if (modalidad && !MODALIDADES_VALIDAS.includes(modalidad.toUpperCase())) {
      return res.status(400).json({ success: false, message: `modalidad debe ser: ${MODALIDADES_VALIDAS.join(', ')}` });
    }
    if (orden && !ORDENES_VALIDOS.includes(orden)) {
      return res.status(400).json({ success: false, message: `orden debe ser: ${ORDENES_VALIDOS.join(', ')}` });
    }
    if (precio_min && isNaN(parseFloat(precio_min))) {
      return res.status(400).json({ success: false, message: 'precio_min debe ser numérico' });
    }
    if (precio_max && isNaN(parseFloat(precio_max))) {
      return res.status(400).json({ success: false, message: 'precio_max debe ser numérico' });
    }
    if (precio_min && precio_max && parseFloat(precio_min) > parseFloat(precio_max)) {
      return res.status(400).json({ success: false, message: 'precio_min no puede ser mayor que precio_max' });
    }

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