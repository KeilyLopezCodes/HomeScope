const propertyRepository = require('../repositories/property.repository');
const priceHistoryRepository = require('../repositories/priceHistory.repository');
const fotoService = require('./foto.service');

const ESTADOS_VALIDOS = ['borrador', 'publicado', 'pausado', 'vendido', 'alquilado', 'no_disponible'];

const createProperty = async (userId, propertyData) => {
  const {
    titulo, descripcion, precio, moneda, tipo_propiedad_id,
    modalidad, habitaciones, banos, estacionamientos, parqueos,
    area_m2, direccion, zona, municipio, departamento, latitud, longitud
  } = propertyData;

  const numParqueos = parqueos !== undefined 
    ? parseInt(parqueos, 10) 
    : (estacionamientos ? parseInt(estacionamientos, 10) : 0);

  return await propertyRepository.create({
    titulo,
    descripcion,
    precio: parseFloat(precio),
    moneda: moneda || 'USD',
    modalidad: modalidad || 'VENTA',
    habitaciones: habitaciones ? parseInt(habitaciones, 10) : 0,
    banos: banos ? parseFloat(banos) : 0,
    parqueos: numParqueos,
    area_m2: area_m2 ? parseFloat(area_m2) : 0,
    direccion: direccion || '',
    zona: zona || '1',
    municipio: municipio || 'Guatemala',
    departamento: departamento || 'Guatemala',
    latitud: latitud ? parseFloat(latitud) : 0,
    longitud: longitud ? parseFloat(longitud) : 0,
    estado: 'borrador',
    vendedor_id: userId,
    tipo_propiedad_id: tipo_propiedad_id ? parseInt(tipo_propiedad_id, 10) : 1
  });
};

const getAllProperties = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const estado = query.estado || 'publicado';
  const skip = (page - 1) * limit;

  const properties = await propertyRepository.findManyWithPagination({ estado, skip, limit });
  const totalItems = await propertyRepository.countByEstado(estado);

  return {
    properties,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      limit
    }
  };
};

const getMyProperties = async (userId) => {
  return await propertyRepository.findByVendorId(userId);
};

const getPropertyById = async (id) => {
  const property = await propertyRepository.findById(id);
  if (!property) throw new Error('Propiedad no encontrada');
  return property;
};

const updateProperty = async (idProperty, data, userId) => {
  const currentProperty = await propertyRepository.findById(idProperty);
  if (!currentProperty) {
    throw new Error('Propiedad no encontrada');
  }

  if (data.precio && Number(data.precio) !== Number(currentProperty.precio)) {
    await priceHistoryRepository.createHistoryRecord({
      propiedadId: idProperty,
      precioAnterior: currentProperty.precio,
      precioNuevo: data.precio,
      cambiadoPor: userId
    });
  }

  return await propertyRepository.update(idProperty, data);
};

const getPropertyHistory = async (idProperty) => {
  return await priceHistoryRepository.findByPropertyId(idProperty);
};

const updatePropertyStatus = async (propertyId, userId, nuevoEstado) => {
  const estadoNormalizado = nuevoEstado.toLowerCase();
  if (!ESTADOS_VALIDOS.includes(estadoNormalizado)) {
    throw new Error(`Estado inválido. Válidos: ${ESTADOS_VALIDOS.join(', ')}`);
  }

  const property = await propertyRepository.findById(propertyId);
  if (!property) throw new Error('Propiedad no encontrada');
  if (property.vendedor_id !== userId) throw new Error('No tienes permisos');

  const data = { estado: estadoNormalizado };
  if (estadoNormalizado === 'publicado' && !property.fecha_publicacion) {
    data.fecha_publicacion = new Date();
  }

  return await propertyRepository.update(propertyId, data);
};

const deleteProperty = async (propertyId, userId) => {
  const property = await propertyRepository.findById(propertyId);
  if (!property) throw new Error('Propiedad no encontrada');
  if (property.vendedor_id !== userId) throw new Error('No tienes permisos para eliminar esta propiedad');

  await fotoService.eliminarFotosDePropiedad(propertyId);

  return await propertyRepository.update(propertyId, { estado: 'no_disponible' });
};

module.exports = {
  createProperty,
  getAllProperties,
  getMyProperties,
  getPropertyById,
  updateProperty,
  getPropertyHistory,
  updatePropertyStatus,
  deleteProperty
};