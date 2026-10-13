const propertyRepository = require('../repositories/property.repository');
const priceHistoryRepository = require('../repositories/priceHistory.repository');

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


// Campos de ordenamiento permitidos (whitelist contra injection)
const ORDEN_CAMPOS = {
  precio: { precio: 'asc' },
  precio_desc: { precio: 'desc' },
  fecha: { fecha_publicacion: 'desc' },
  fecha_asc: { fecha_publicacion: 'asc' },
  indice: { indice_conveniencia: { _count: 'desc' } },
};

// 2. Buscar y listar propiedades con filtros combinados
const getAllProperties = async (query = {}) => {
  const page    = Math.max(parseInt(query.page,  10) || 1, 1);
  const limit   = Math.min(parseInt(query.limit, 10) || 10, 50);
  const skip    = (page - 1) * limit;

  // --- Construcción del filtro where (Prisma parametriza automáticamente) ---
  const where = {};
  if (!query.incluir_borradores) where.estado = 'publicado';

  // Texto libre: busca en título, descripción, dirección, municipio, departamento
  if (query.q && query.q.trim()) {
    const term = query.q.trim();
    where.OR = [
      { titulo:      { contains: term, mode: 'insensitive' } },
      { descripcion: { contains: term, mode: 'insensitive' } },
      { direccion:   { contains: term, mode: 'insensitive' } },
      { municipio:   { contains: term, mode: 'insensitive' } },
      { departamento:{ contains: term, mode: 'insensitive' } },
    ];
  }

  // Modalidad: VENTA | ALQUILER
  if (query.modalidad) {
    where.modalidad = query.modalidad.toUpperCase();
  }

  // Tipo de propiedad (ID numérico)
  if (query.tipo_propiedad_id) {
    const tid = parseInt(query.tipo_propiedad_id, 10);
    if (!isNaN(tid)) where.tipo_propiedad_id = tid;
  }

  // Rango de precio
  if (query.precio_min || query.precio_max) {
    where.precio = {};
    if (query.precio_min) {
      const min = parseFloat(query.precio_min);
      if (!isNaN(min)) where.precio.gte = min;
    }
    if (query.precio_max) {
      const max = parseFloat(query.precio_max);
      if (!isNaN(max)) where.precio.lte = max;
    }
  }

  // Habitaciones mínimas
  if (query.habitaciones_min) {
    const hab = parseInt(query.habitaciones_min, 10);
    if (!isNaN(hab)) where.habitaciones = { gte: hab };
  }

  // Índice de Conveniencia mínimo (filtra por puntaje_total del índice vigente)
  const indiceMin = query.indice_min ? parseFloat(query.indice_min) : null;
  if (indiceMin !== null && !isNaN(indiceMin)) {
    where.indice_conveniencia = {
      some: { es_vigente: true, puntaje_total: { gte: indiceMin } }
    };
  }

  // --- Ordenamiento ---
  let orderBy = { fecha_publicacion: 'desc' }; // default

  if (query.orden === 'precio')       orderBy = { precio: 'asc' };
  else if (query.orden === 'precio_desc') orderBy = { precio: 'desc' };
  else if (query.orden === 'fecha_asc')   orderBy = { fecha_publicacion: 'asc' };
  else if (query.orden === 'indice') {
    // Ordenar por puntaje del índice vigente requiere sorteo en memoria
    // Se resuelve post-query (ver abajo)
    orderBy = { fecha_publicacion: 'desc' };
  }
  console.log(query);
  // --- Ejecución paralela de query + count ---
  const [properties, totalItems] = await Promise.all([
    prisma.propiedad.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        usuario:    { select: { id: true, nombre: true, apellido: true, correo: true, telefono: true } },
        tipo_propiedad: true,
        foto_propiedad: { where: { es_portada: true }, take: 1 },
        indice_conveniencia: {
          where: { es_vigente: true },
          select: { puntaje_total: true, nivel_semaforo: true },
          take: 1
        }
      }
    }),
    prisma.propiedad.count({ where })
  ]);
  console.log('properties', properties);

  // Ordenamiento por índice de conveniencia (post-query sobre la página)
  const resultado = query.orden === 'indice'
    ? properties.sort((a, b) => {
        const pa = parseFloat(a.indice_conveniencia[0]?.puntaje_total ?? 0);
        const pb = parseFloat(b.indice_conveniencia[0]?.puntaje_total ?? 0);
        return pb - pa;
      })
    : properties;

  return {
    properties: resultado,
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