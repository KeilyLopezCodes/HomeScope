// Middleware de autenticación de ejemplo
const verifyToken = (req, res, next) => {
  // Lógica de verificación JWT
  next();
};

module.exports = { verifyToken };