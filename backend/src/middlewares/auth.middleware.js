const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: 'Acceso denegado: Token no proporcionado' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_homescope');
    req.user = verified; // Contiene { id: ..., id_rol: ... }
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Token inválido o expirado' });
  }
};

module.exports = { authenticateToken };