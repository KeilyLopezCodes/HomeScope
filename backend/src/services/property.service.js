const prisma = require('../config/db');

// Estados válidos según el flujo del formulario por pasos
const ESTADOS_VALIDOS = ['borrador', 'publicado', 'pausado', 'vendido', 'alquilado', 'no_disponible'];

// Campos que el usuario puede modificar (whitelist)
const CAMPOS_EDITABLES = [
  'titulo', 'descripcion', 'modalidad', 'precio', 'moneda',
  'habitaciones', 'banos', 'area_m2', 'parqueos',
  'direccion', 'zona', 'municipio', 'departamento',
  'latitud', 'longitud', 'google_place_id',
  'tipo_propiedad_id', 'paso_formulario'
];

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
    ? parseInt(parqueos) 
    : (estacionamientos ? parseInt(estacionamientos) : 0);

  return await prisma.propiedad.create({
    data: {
      titulo,
      descripcion,
      precio: parseFloat(precio),
      moneda: moneda || 'USD',
      modalidad: modalidad || 'VENTA',
      habitaciones: habitaciones ? parseInt(habitaciones) : 0,
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
      // Mapeo a las llaves foráneas según tu esquema real:
      vendedor_id: userId,
      tipo_propiedad_id: tipo_propiedad_id ? parseInt(tipo_propiedad_id) : 1
    }
  });
};

// 2. Listar propiedades publicadas (público)
// Obtener propiedades con paginación y filtro por estado
const getAllProperties = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const estado = query.estado || 'publicado'; // Por defecto solo públicas

  const skip = (page - 1) * limit;

  // 1. Obtener los registros paginados
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

  // 2. Contar el total de elementos que coinciden con el filtro
  const totalItems = await prisma.propiedad.count({
    where: { estado }
  });

  // 3. Devolver datos junto con los metadatos de paginación
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
    where: { vendedor_id: parseInt(userId) },
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
    where: { id: parseInt(id) },
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

// 4. Actualizar (solo dueño)
const updateProperty = async (propertyId, userId, updateData) => {
  const property = await prisma.propiedad.findUnique({
    where: { id: parseInt(propertyId) }
  });
  if (!property) throw new Error('Propiedad no encontrada');
  if (property.vendedor_id !== userId) throw new Error('No tienes permisos para modificar esta propiedad');
  
  const dataFiltrada = {};
  for (const campo of CAMPOS_EDITABLES) {
    if (updateData[campo] !== undefined) {
      dataFiltrada[campo] = updateData[campo];
    }
  }

  // Conversión de tipos
  if (dataFiltrada.precio !== undefined) dataFiltrada.precio = parseFloat(dataFiltrada.precio);
  if (dataFiltrada.habitaciones !== undefined) dataFiltrada.habitaciones = parseInt(dataFiltrada.habitaciones);
  if (dataFiltrada.banos !== undefined) dataFiltrada.banos = parseFloat(dataFiltrada.banos);
  if (dataFiltrada.area_m2 !== undefined) dataFiltrada.area_m2 = parseFloat(dataFiltrada.area_m2);
  if (dataFiltrada.parqueos !== undefined) dataFiltrada.parqueos = parseInt(dataFiltrada.parqueos);
  if (dataFiltrada.latitud !== undefined) dataFiltrada.latitud = parseFloat(dataFiltrada.latitud);
  if (dataFiltrada.longitud !== undefined) dataFiltrada.longitud = parseFloat(dataFiltrada.longitud);
  if (dataFiltrada.tipo_propiedad_id !== undefined) dataFiltrada.tipo_propiedad_id = parseInt(dataFiltrada.tipo_propiedad_id);
  if (dataFiltrada.paso_formulario !== undefined) dataFiltrada.paso_formulario = parseInt(dataFiltrada.paso_formulario);

  // Registrar cambio de precio si aplica (para T14)
if (dataFiltrada.precio !== undefined && parseFloat(dataFiltrada.precio) !== parseFloat(property.precio)) {
  await prisma.historial_precio.create({
    data: {
      precio_anterior: property.precio,
      precio_nuevo: parseFloat(dataFiltrada.precio),
      propiedad: {
        connect: { id: parseInt(propertyId) }
      },
      usuario: {
        connect: { id: parseInt(userId) }
      }
    }
  });
}

  return await prisma.propiedad.update({
    where: { id: parseInt(propertyId) },
    data: dataFiltrada
  });
};

// 5. Cambiar estado (solo dueño)
const updatePropertyStatus = async (propertyId, userId, nuevoEstado) => {
  const estadoNormalizado = nuevoEstado.toLowerCase();
  if (!ESTADOS_VALIDOS.includes(estadoNormalizado)) {
    throw new Error(`Estado inválido. Válidos: ${ESTADOS_VALIDOS.join(', ')}`);
  }

  const property = await prisma.propiedad.findUnique({
    where: { id: parseInt(propertyId) }
  });
  if (!property) throw new Error('Propiedad no encontrada');
  if (property.vendedor_id !== userId) throw new Error('No tienes permisos');

  const data = { estado: estadoNormalizado };

  // Si pasa a publicado y no tenía fecha, la asignamos
  if (estadoNormalizado === 'publicado' && !property.fecha_publicacion) {
    data.fecha_publicacion = new Date();
  }

  return await prisma.propiedad.update({
    where: { id: parseInt(propertyId) },
    data
  });
};

// 6. Eliminar (soft delete)
const deleteProperty = async (propertyId, userId) => {
  const property = await prisma.propiedad.findUnique({
    where: { id: parseInt(propertyId) }
  });
  if (!property) throw new Error('Propiedad no encontrada');
  if (property.vendedor_id !== userId) throw new Error('No tienes permisos para eliminar esta propiedad');

  return await prisma.propiedad.update({
    where: { id: parseInt(propertyId) },
    data: { estado: 'no_disponible' }
  });
};

module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  updatePropertyStatus,
  deleteProperty
};