const propertyRepository = require('../repositories/property.repository');
const priceHistoryRepository = require('../repositories/priceHistory.repository');
const prisma = require('../config/db');

// Estados válidos según el flujo del formulario por pasos
const ESTADOS_VALIDOS = ['borrador', 'publicado', 'pausado', 'vendido', 'alquilado', 'no_disponible'];

// 1. Crear una nueva propiedad
const createProperty = async (userId, propertyData) => {
  const {
    titulo,
    descripcion,
    precio,
    moneda,
    tipo_propiedad_id,
    modalidad,
    habitaciones,
    banos,
    estacionamientos,
    parqueos,
    area_m2,
    direccion,
    zona,
    municipio,
    departamento,
    latitud,
    longitud
  } = propertyData;

  const numParqueos = parqueos !== undefined 
    ? parseInt(parqueos, 10) 
    : (estacionamientos ? parseInt(estacionamientos, 10) : 0);

  return await prisma.propiedad.create({
    data: {
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
    }
  });
};

// 2. Listar propiedades publicadas (público)
const getAllProperties = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const estado = query.estado || 'publicado';

  const skip = (page - 1) * limit;

  const properties = await prisma.propiedad.findMany({
    where: { estado },
    skip: skip,
    take: limit,
    include: {
      usuario: { select: { id: true, nombre: true, apellido: true, correo: true, telefono: true } },
      tipo_propiedad: true,
      foto_propiedad: true
    },
    orderBy: { fecha_creacion: 'desc' }
  });

  const totalItems = await prisma.propiedad.count({ where: { estado } });

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

// Listar mis propiedades (Panel del Vendedor)
const getMyProperties = async (userId) => {
  return await prisma.propiedad.findMany({
    where: { vendedor_id: parseInt(userId, 10) },
    include: {
      tipo_propiedad: true,
      foto_propiedad: true
    },
    orderBy: { fecha_creacion: 'desc' }
  });
};

// 3. Obtener por ID
const getPropertyById = async (id) => {
  const property = await prisma.propiedad.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      usuario: { select: { id: true, nombre: true, apellido: true, correo: true, telefono: true } },
      tipo_propiedad: true,
      foto_propiedad: true,
      historial_precio: true,
      indice_conveniencia: true
    }
  });
  if (!property) throw new Error('Propiedad no encontrada');
  return property;
};

// 4. Actualizar (con Repositorios e Historial de Precio para T14)
const updateProperty = async (idProperty, data, userId) => {
  const currentProperty = await propertyRepository.findById(idProperty);
  if (!currentProperty) {
    throw new Error('Propiedad no encontrada');
  }

  // Registrar cambio de precio en el historial si el monto varió
  if (data.precio && Number(data.precio) !== Number(currentProperty.precio)) {
    await priceHistoryRepository.createHistoryRecord({
      propiedadId: idProperty,
      precioAnterior: currentProperty.precio,
      precioNuevo: data.precio,
      cambiadoPor: userId
    });
  }

  // Actualizar datos de la propiedad
  const updatedProperty = await propertyRepository.update(idProperty, data);
  return updatedProperty;
};

// Consultar Historial de Precios de una Propiedad
const getPropertyHistory = async (idProperty) => {
  return await priceHistoryRepository.findByPropertyId(idProperty);
};

// 5. Cambiar estado (solo dueño)
const updatePropertyStatus = async (propertyId, userId, nuevoEstado) => {
  const estadoNormalizado = nuevoEstado.toLowerCase();
  if (!ESTADOS_VALIDOS.includes(estadoNormalizado)) {
    throw new Error(`Estado inválido. Válidos: ${ESTADOS_VALIDOS.join(', ')}`);
  }

  const property = await prisma.propiedad.findUnique({
    where: { id: parseInt(propertyId, 10) }
  });
  if (!property) throw new Error('Propiedad no encontrada');
  if (property.vendedor_id !== userId) throw new Error('No tienes permisos');

  const data = { estado: estadoNormalizado };

  if (estadoNormalizado === 'publicado' && !property.fecha_publicacion) {
    data.fecha_publicacion = new Date();
  }

  return await prisma.propiedad.update({
    where: { id: parseInt(propertyId, 10) },
    data
  });
};

// 6. Eliminar (soft delete)
const deleteProperty = async (propertyId, userId) => {
  const property = await prisma.propiedad.findUnique({
    where: { id: parseInt(propertyId, 10) }
  });
  if (!property) throw new Error('Propiedad no encontrada');
  if (property.vendedor_id !== userId) throw new Error('No tienes permisos para eliminar esta propiedad');

  return await prisma.propiedad.update({
    where: { id: parseInt(propertyId, 10) },
    data: { estado: 'no_disponible' }
  });
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