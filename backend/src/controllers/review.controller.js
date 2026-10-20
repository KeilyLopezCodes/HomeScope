const reviewService = require('../services/review.service');

const handleError = (res, error) => {
  if (error.status) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(error);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
};

// Las reseñas son públicas: del comprador solo se expone el nombre y la inicial del apellido
const formatearResena = (r) => {
  const comprador = r.usuario_resena_comprador_idTousuario;
  return {
    id: r.id,
    vendedor_id: r.vendedor_id,
    calificacion: r.calificacion,
    comentario: r.comentario,
    fecha_creacion: r.fecha_creacion,
    propiedad: r.propiedad,
    comprador: {
      id: comprador.id,
      nombre: comprador.apellido ? `${comprador.nombre} ${comprador.apellido.charAt(0)}.` : comprador.nombre,
      foto_url: comprador.foto_url
    }
  };
};

const createReview = async (req, res) => {
  try {
    const resena = await reviewService.createReview(req.user.id, req.body || {});
    res.status(201).json({
      success: true,
      message: 'Gracias por calificar al vendedor.',
      data: formatearResena(resena)
    });
  } catch (error) {
    handleError(res, error);
  }
};

const getSellerProfile = async (req, res) => {
  try {
    const perfil = await reviewService.getSellerProfile(req.params.id);
    res.json({ success: true, data: perfil });
  } catch (error) {
    handleError(res, error);
  }
};

const listSellerReviews = async (req, res) => {
  try {
    const { vendedor, calificacion, resenas, pagination } = await reviewService.listSellerReviews(req.params.id, req.query);
    res.json({
      success: true,
      vendedor,
      calificacion,
      data: resenas.map(formatearResena),
      pagination
    });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createReview,
  getSellerProfile,
  listSellerReviews
};
