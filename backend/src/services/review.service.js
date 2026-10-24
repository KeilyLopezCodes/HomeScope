const reviewRepository = require('../repositories/review.repository');

const CALIFICACION_MIN = 1;
const CALIFICACION_MAX = 5;
const MAX_COMENTARIO = 1000;

const errorHttp = (mensaje, status) => Object.assign(new Error(mensaje), { status });

const parseId = (id, nombre) => {
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0 || num > 2147483647) throw errorHttp(`ID de ${nombre} inválido`, 400);
  return num;
};

const MENSAJE_DUPLICADA = 'Ya calificaste al vendedor por esta propiedad';

const createReview = async (compradorId, { propiedad_id, calificacion, comentario } = {}) => {
  if (propiedad_id === undefined || propiedad_id === null) throw errorHttp('propiedad_id es obligatorio', 400);
  const propiedadId = parseId(propiedad_id, 'propiedad');

  const estrellas = Number(calificacion);
  if (calificacion === null || calificacion === '' || !Number.isInteger(estrellas)
      || estrellas < CALIFICACION_MIN || estrellas > CALIFICACION_MAX) {
    throw errorHttp(`calificacion debe ser un número entero entre ${CALIFICACION_MIN} y ${CALIFICACION_MAX}`, 400);
  }

  if (comentario !== undefined && comentario !== null && typeof comentario !== 'string') {
    throw errorHttp('comentario debe ser texto', 400);
  }
  const texto = typeof comentario === 'string' ? comentario.trim() : '';
  if (texto.length > MAX_COMENTARIO) {
    throw errorHttp(`comentario no puede superar ${MAX_COMENTARIO} caracteres`, 400);
  }

  // Un borrador nunca estuvo publicado: nadie pudo contactar al vendedor por él
  const propiedad = await reviewRepository.findPropertyForReview(propiedadId);
  if (!propiedad || propiedad.estado === 'borrador') throw errorHttp('Propiedad no encontrada', 404);
  if (propiedad.vendedor_id === compradorId) {
    throw errorHttp('No puedes calificarte a ti mismo', 403);
  }

  // Regla de negocio: solo califica quien agendó una visita o escribió al vendedor por esta propiedad
  const contacto = await reviewRepository.findPriorContact(compradorId, propiedadId);
  if (!contacto.visita && !contacto.conversacion) {
    throw errorHttp('Solo puedes calificar al vendedor si agendaste una visita o lo contactaste por esta propiedad', 403);
  }

  const existente = await reviewRepository.findByBuyerAndProperty(compradorId, propiedadId);
  if (existente) throw errorHttp(MENSAJE_DUPLICADA, 409);

  try {
    return await reviewRepository.create({
      vendedor_id: propiedad.vendedor_id,
      comprador_id: compradorId,
      propiedad_id: propiedadId,
      calificacion: estrellas,
      comentario: texto || null
    });
  } catch (error) {
    // Dos solicitudes simultáneas: el índice único uq_resena_comprador_propiedad rechaza la segunda
    if (error.code === 'P2002') throw errorHttp(MENSAJE_DUPLICADA, 409);
    throw error;
  }
};

// Promedio con un decimal (null si aún no tiene reseñas) y conteo de las 5 estrellas, incluidas las vacías
const buildRatingSummary = ({ promedio, total, porEstrella }) => {
  const distribucion = {};
  for (let i = CALIFICACION_MAX; i >= CALIFICACION_MIN; i--) distribucion[i] = 0;
  porEstrella.forEach(({ calificacion, total: n }) => { distribucion[calificacion] = n; });
  return {
    promedio: total ? Math.round(promedio * 10) / 10 : null,
    total,
    distribucion
  };
};

const findSellerOrFail = async (idSeller) => {
  const vendedorId = parseId(idSeller, 'vendedor');
  const vendedor = await reviewRepository.findSellerById(vendedorId);
  if (!vendedor) throw errorHttp('Vendedor no encontrado', 404);
  return vendedor;
};

const getSellerProfile = async (idSeller) => {
  const vendedor = await findSellerOrFail(idSeller);
  const resumen = await reviewRepository.getSellerSummary(vendedor.id);
  return { ...vendedor, calificacion: buildRatingSummary(resumen) };
};

const listSellerReviews = async (idSeller, query = {}) => {
  const vendedor = await findSellerOrFail(idSeller);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);

  const [{ resenas, total }, resumen] = await Promise.all([
    reviewRepository.findBySellerWithPagination({ vendedorId: vendedor.id, skip: (page - 1) * limit, limit }),
    reviewRepository.getSellerSummary(vendedor.id)
  ]);

  return {
    vendedor,
    calificacion: buildRatingSummary(resumen),
    resenas,
    pagination: { totalItems: total, totalPages: Math.ceil(total / limit), currentPage: page, limit }
  };
};

module.exports = {
  createReview,
  getSellerProfile,
  listSellerReviews
};
