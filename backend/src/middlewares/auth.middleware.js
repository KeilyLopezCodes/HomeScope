const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: 'Acceso denegado: Token no proporcionado' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    // Un token de verificación de correo no sirve como sesión
    if (verified.tipo && verified.tipo !== 'acceso') throw new Error('Tipo de token no válido');
    req.user = verified; // { id, id_rol, roles, tipo }
    next();
  } catch {
    res.status(403).json({ success: false, message: 'Token inválido o expirado' });
  }
};

module.exports = { authenticateToken };