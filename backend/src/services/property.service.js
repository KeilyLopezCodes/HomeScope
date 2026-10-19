const propertyRepository = require('../repositories/property.repository');
const priceHistoryRepository = require('../repositories/priceHistory.repository');
const fotoService = require('./foto.service');
const geoIndiceService = require('./geo-indice.service');
const prisma = require('../config/db');

const ESTADOS_VALIDOS = ['borrador', 'publicado', 'pausado', 'vendido', 'alquilado', 'no_disponible'];

// Campos que el dueño puede modificar vía PUT (whitelist contra mass assignment)
const CAMPOS_EDITABLES = {
  titulo: String, descripcion: String, direccion: String, zona: String,
  municipio: String, departamento: String, google_place_id: String,
  moneda: (v) => String(v).toUpperCase(),
  modalidad: (v) => String(v).toUpperCase(),
  precio: parseFloat, banos: parseFloat, area_m2: parseFloat,
  latitud: parseFloat, longitud: parseFloat,
  habitaciones: (v) => parseInt(v, 10), parqueos: (v) => parseInt(v, 10),
  tipo_propiedad_id: (v) => parseInt(v, 10),
};

const MAX_INT = 2147483647; // límite de la columna INT en PostgreSQL

const parsePropertyId = (id) => {
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0 || num > MAX_INT) throw new Error('ID de propiedad inválido');
  return num;
};

// tipo_propiedad_id es SMALLINT con FK: se valida antes de llegar a la BD
const validarTipoPropiedad = async (tipoId) => {
  if (!Number.isInteger(tipoId) || tipoId <= 0 || tipoId > 32767) throw new Error('tipo_propiedad_id inválido');
  const tipo = await prisma.tipo_propiedad.findUnique({ where: { id: tipoId } });
  if (!tipo) throw new Error('tipo_propiedad_id inválido');
};

const createProperty = async (userId, propertyData) => {
  const {
    titulo, descripcion, precio, moneda, tipo_propiedad_id,
    modalidad, habitaciones, banos, estacionamientos, parqueos,
    area_m2, direccion, zona, municipio, departamento, latitud, longitud
  } = propertyData;

  if (!titulo || !descripcion || precio === undefined || precio === null || precio === '') {
    throw new Error('titulo, descripcion y precio son requeridos');
  }
  if (isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
    throw new Error('precio debe ser un número positivo');
  }
  if (modalidad && !['VENTA', 'ALQUILER'].includes(String(modalidad).toUpperCase())) {
    throw new Error('modalidad debe ser: VENTA, ALQUILER');
  }

  const numParqueos = parqueos !== undefined 
    ? parseInt(parqueos, 10) 
    : (estacionamientos ? parseInt(estacionamientos, 10) : 0);

  const tipoId = tipo_propiedad_id ? parseInt(tipo_propiedad_id, 10) : 1;
  await validarTipoPropiedad(tipoId);

  return await propertyRepository.create({
    titulo,
    descripcion,
    precio: parseFloat(precio),
    moneda: moneda || 'USD',
    modalidad: modalidad ? String(modalidad).toUpperCase() : 'VENTA',
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
    tipo_propiedad_id: tipoId
  });
};



// 2. Buscar y listar propiedades con filtros combinados
const getAllProperties = async (query = {}) => {
  const page    = Math.max(parseInt(query.page,  10) || 1, 1);
  const limit   = Math.min(parseInt(query.limit, 10) || 10, 50);
  const skip    = (page - 1) * limit;

  // --- Construcción del filtro where (Prisma parametriza automáticamente) ---
  // El listado público solo muestra propiedades publicadas
  const where = { estado: 'publicado' };

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
  const property = await propertyRepository.findById(parsePropertyId(id));
  if (!property) throw new Error('Propiedad no encontrada');
  return property;
};


// precio es NUMERIC(14,2): se compara redondeado para no registrar cambios inexistentes
const redondearPrecio = (valor) => Math.round(Number(valor) * 100) / 100;

const updateProperty = async (idProperty, data, userId) => {
  const propertyId = parsePropertyId(idProperty);
  const currentProperty = await propertyRepository.findById(propertyId);
  if (!currentProperty) throw new Error('Propiedad no encontrada');
  if (currentProperty.vendedor_id !== userId) throw new Error('No tienes permisos para editar esta propiedad');

  const updateData = {};
  for (const [campo, parse] of Object.entries(CAMPOS_EDITABLES)) {
    if (data[campo] === undefined) continue;
    const valor = parse(data[campo]);
    if (typeof valor === 'number' && isNaN(valor)) throw new Error(`${campo} debe ser numérico`);
    updateData[campo] = valor;
  }
  if (Object.keys(updateData).length === 0) throw new Error('No se enviaron campos válidos para actualizar');
  if (updateData.precio !== undefined && updateData.precio < 0) throw new Error('precio debe ser un número positivo');
  if (updateData.modalidad && !['VENTA', 'ALQUILER'].includes(updateData.modalidad)) {
    throw new Error('modalidad debe ser: VENTA, ALQUILER');
  }
  if (updateData.tipo_propiedad_id !== undefined) await validarTipoPropiedad(updateData.tipo_propiedad_id);
  updateData.fecha_actualizacion = new Date();

  const updated = await propertyRepository.update(idProperty, data);

  //recalcular el Índice de Conveniencia si se acaba de publicar o si cambió la ubicación (RF-17)
  const estaPublicada = String(updated.estado).toLowerCase() === 'publicado';
  const sePublicoAhora = estaPublicada && String(currentProperty.estado).toLowerCase() !== 'publicado';
  const cambioUbicacion =
    (data.latitud !== undefined && Number(data.latitud) !== Number(currentProperty.latitud)) ||
    (data.longitud !== undefined && Number(data.longitud) !== Number(currentProperty.longitud));
  if (estaPublicada && (sePublicoAhora || cambioUbicacion)) {
    geoIndiceService.encolarCalculo(Number(idProperty)); 
  }

  return updated;
  const cambioPrecio = updateData.precio !== undefined
    && redondearPrecio(updateData.precio) !== redondearPrecio(currentProperty.precio);

  // Update + historial en una transacción para no dejar registros huérfanos
  return await prisma.$transaction(async (tx) => {
    const updated = await tx.propiedad.update({ where: { id: propertyId }, data: updateData });
    if (cambioPrecio) {
      await tx.historial_precio.create({
        data: {
          propiedad_id: propertyId,
          precio_anterior: currentProperty.precio,
          precio_nuevo: updateData.precio,
          cambiado_por: userId
        }
      });
    }
    return updated;
  });
};

const getPropertyHistory = async (idProperty) => {
  const propertyId = parsePropertyId(idProperty);
  const property = await propertyRepository.findById(propertyId);
  if (!property) throw new Error('Propiedad no encontrada');
  return await priceHistoryRepository.findByPropertyId(propertyId);
};

const updatePropertyStatus = async (propertyId, userId, nuevoEstado) => {
  const estadoNormalizado = String(nuevoEstado ?? '').toLowerCase();
  if (!ESTADOS_VALIDOS.includes(estadoNormalizado)) {
    throw new Error(`Estado inválido. Válidos: ${ESTADOS_VALIDOS.join(', ')}`);
  }

  const property = await propertyRepository.findById(parsePropertyId(propertyId));
  if (!property) throw new Error('Propiedad no encontrada');
  if (property.vendedor_id !== userId) throw new Error('No tienes permisos');

  const data = { estado: estadoNormalizado };
  if (estadoNormalizado === 'publicado' && !property.fecha_publicacion) {
    data.fecha_publicacion = new Date();
  }

  const updated = await propertyRepository.update(propertyId, data);

  //al publicar se calcula el índice en segundo plano
  if (estadoNormalizado === 'publicado' && String(property.estado).toLowerCase() !== 'publicado') {
    geoIndiceService.encolarCalculo(Number(propertyId));
  }

  return updated;
};

const deleteProperty = async (propertyId, userId) => {
  const property = await propertyRepository.findById(parsePropertyId(propertyId));
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