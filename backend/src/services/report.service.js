const reportRepository = require('../repositories/report.repository');
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

module.exports = {
  MOTIVOS_REPORTE,
  getMotivos,
  reportProperty
};
