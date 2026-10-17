const userRepository = require('../repositories/user.repository');

// Usar después de authenticateToken. Los permisos se leen de la BD (rol_permiso + usuario_rol)
// en cada solicitud: el token solo guarda un rol y no refleja cambios de rol hasta que expira.
const requirePermission = (codigoPermiso) => async (req, res, next) => {
  try {
    const permitido = await userRepository.hasPermission(req.user.id, codigoPermiso);
    if (!permitido) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para realizar esta acción' });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = { requirePermission };
