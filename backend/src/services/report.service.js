const reportRepository = require('../repositories/report.repository');
const { ESTADOS_ABIERTOS } = require('../repositories/report.repository');
const propertyRepository = require('../repositories/property.repository');

const MOTIVOS_REPORTE = {
  fraude: 'Posible fraude o estafa',
  informacion_falsa: 'Información falsa o engañosa',
  precio_enganoso: 'Precio engañoso',
  fotos_falsas: 'Fotos que no corresponden a la propiedad',
  no_disponible: 'La propiedad ya no está disponible',
  duplicada: 'Publicación duplicada',
  contenido_inapropiado: 'Contenido inapropiado u ofensivo',
  otro: 'Otro motivo'
};

const MAX_DESCRIPCION = 1000;

const errorHttp = (mensaje, status) => Object.assign(new Error(mensaje), { status });

const getMotivos = () =>
  Object.entries(MOTIVOS_REPORTE).map(([codigo, descripcion]) => ({ codigo, descripcion }));

const reportProperty = async (idProperty, reportanteId, { motivo, descripcion } = {}) => {
  const propiedadId = Number(idProperty);
  if (!Number.isInteger(propiedadId) || propiedadId <= 0) {
    throw errorHttp('ID de propiedad inválido', 400);
  }

  if (!motivo || !MOTIVOS_REPORTE[motivo]) {
    throw errorHttp(`motivo debe ser uno de: ${Object.keys(MOTIVOS_REPORTE).join(', ')}`, 400);
  }

  const detalle = typeof descripcion === 'string' ? descripcion.trim() : '';
  if (descripcion !== undefined && descripcion !== null && typeof descripcion !== 'string') {
    throw errorHttp('descripcion debe ser texto', 400);
  }
  if (detalle.length > MAX_DESCRIPCION) {
    throw errorHttp(`descripcion no puede superar ${MAX_DESCRIPCION} caracteres`, 400);
  }
  if (motivo === 'otro' && !detalle) {
    throw errorHttp('Describe el problema cuando el motivo es "otro"', 400);
  }

  // Solo se pueden reportar publicaciones visibles al público
  const propiedad = await propertyRepository.findById(propiedadId);
  if (!propiedad || propiedad.estado !== 'publicado') {
    throw errorHttp('Propiedad no encontrada', 404);
  }
  if (propiedad.vendedor_id === reportanteId) {
    throw errorHttp('No puedes reportar tu propia publicación', 403);
  }

  // Regla de negocio: un reporte pendiente por usuario y objetivo
  const abierto = await reportRepository.findOpenByReporterAndProperty(reportanteId, propiedadId);
  if (abierto) {
    throw errorHttp('Ya reportaste esta publicación y tu reporte está pendiente de revisión', 409);
  }

  try {
    return await reportRepository.create({
      reportante_id: reportanteId,
      tipo_objetivo: 'propiedad',
      propiedad_id: propiedadId,
      motivo,
      descripcion: detalle || null
    });
  } catch (error) {
    // Dos solicitudes simultáneas: el índice único parcial de la BD rechaza la segunda
    if (error.code === 'P2002') {
      throw errorHttp('Ya reportaste esta publicación y tu reporte está pendiente de revisión', 409);
    }
    throw error;
  }
};

const ESTADOS_REPORTE = ['pendiente', 'en_revision', 'resuelto', 'descartado'];
const MAX_MOTIVO_RESOLUCION = 300;

// Aprobar = el reporte es válido (resuelto); rechazar = no procede (descartado).
// Ninguna de las dos modifica la publicación: pausarla o eliminarla es una acción de
// moderación aparte (permiso moderacion.publicacion).
const DECISIONES = {
  aprobar: { nuevoEstado: 'resuelto', accion: 'aprobar_reporte' },
  rechazar: { nuevoEstado: 'descartado', accion: 'rechazar_reporte' }
};

const parseId = (id, nombre) => {
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) throw errorHttp(`ID de ${nombre} inválido`, 400);
  return num;
};

const listReports = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 50);
  const estado = query.estado || 'pendiente';
  if (estado !== 'todos' && !ESTADOS_REPORTE.includes(estado)) {
    throw errorHttp(`estado debe ser uno de: ${[...ESTADOS_REPORTE, 'todos'].join(', ')}`, 400);
  }
  const propiedadId = query.propiedad_id ? parseId(query.propiedad_id, 'propiedad') : undefined;

  const { reportes, total } = await reportRepository.findManyWithPagination({
    estado: estado === 'todos' ? undefined : estado,
    propiedadId,
    skip: (page - 1) * limit,
    limit
  });

  return {
    reportes,
    pagination: { totalItems: total, totalPages: Math.ceil(total / limit), currentPage: page, limit }
  };
};

const resolveReport = async (idReport, administradorId, decision, { motivo } = {}) => {
  const reporteId = parseId(idReport, 'reporte');
  const config = DECISIONES[decision];

  const texto = typeof motivo === 'string' ? motivo.trim() : '';
  if (!texto) {
    throw errorHttp('Indica el motivo de la decisión (queda registrado en la auditoría de moderación)', 400);
  }
  if (texto.length > MAX_MOTIVO_RESOLUCION) {
    throw errorHttp(`motivo no puede superar ${MAX_MOTIVO_RESOLUCION} caracteres`, 400);
  }

  const reporte = await reportRepository.findById(reporteId);
  if (!reporte) throw errorHttp('Reporte no encontrado', 404);
  if (!ESTADOS_ABIERTOS.includes(reporte.estado)) {
    throw errorHttp(`El reporte ya fue atendido (estado: ${reporte.estado})`, 409);
  }

  const resuelto = await reportRepository.resolve(reporteId, {
    nuevoEstado: config.nuevoEstado,
    administradorId,
    accion: config.accion,
    motivo: texto
  });
  // Otro moderador lo resolvió entre la lectura y la actualización
  if (!resuelto) throw errorHttp('El reporte ya fue atendido por otro moderador', 409);
  return resuelto;
};

module.exports = {
  MOTIVOS_REPORTE,
  getMotivos,
  reportProperty,
  listReports,
  approveReport: (id, adminId, body) => resolveReport(id, adminId, 'aprobar', body),
  rejectReport: (id, adminId, body) => resolveReport(id, adminId, 'rechazar', body)
};
