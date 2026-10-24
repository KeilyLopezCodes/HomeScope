const propertyService = require('../services/property.service');

// Traduce errores de negocio a códigos HTTP; los errores inesperados (Prisma, etc.) no se exponen
const ERRORES_NEGOCIO = [
  { match: 'no encontrada', status: 404 },
  { match: 'permisos', status: 403 },
  { match: 'inválido', status: 400 },
  { match: 'requeridos', status: 400 },
  { match: 'debe ser', status: 400 },
  { match: 'campos válidos', status: 400 },
];

const handleError = (res, error) => {
  const conocido = ERRORES_NEGOCIO.find((e) => error.message.includes(e.match));
  if (conocido) return res.status(conocido.status).json({ success: false, message: error.message });
  console.error(error);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
};

const create = async (req, res) => {
  try {
    const property = await propertyService.createProperty(req.user.id, req.body || {});
    res.status(201).json({ success: true, message: 'Propiedad creada con éxito', data: property });
  } catch (error) {
    handleError(res, error);
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
    handleError(res, error);
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

const getMine = async (req, res) => {
  try {
    const properties = await propertyService.getMyProperties(req.user.id);
    res.json({ success: true, data: properties });
  } catch (error) {
    handleError(res, error);
  }
};

const updateStatus = async (req, res) => {
  try {
    const property = await propertyService.updatePropertyStatus(req.params.id, req.user.id, req.body?.estado);
    res.json({ success: true, message: 'Estado actualizado', data: property });
  } catch (error) {
    handleError(res, error);
  }
};

const remove = async (req, res) => {
  try {
    await propertyService.deleteProperty(req.params.id, req.user.id);
    res.json({ success: true, message: 'Propiedad eliminada correctamente' });
  } catch (error) {
    handleError(res, error);
  }
};

// Exportamos TODOS los métodos que se usan en property.routes.js
module.exports = {
  create,
  getAll,
  getById,
  update,
  getHistory,
  getMine,
  updateStatus,
  remove
};