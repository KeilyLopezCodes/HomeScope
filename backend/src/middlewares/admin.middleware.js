const ROL_ADMINISTRADOR = 'administrador';

function crearVerificarAdministrador(esAdministradorActivo) {
  return async function verificarAdministrador(req, res, next) {
    try {
      const userId = req.user && Number(req.user.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(401).json({ success: false, message: 'Acceso denegado: sesión no válida' });
      }
      if (!(await esAdministradorActivo(userId))) {
        return res.status(403).json({ success: false, message: 'Acceso restringido a administradores' });
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

// Implementación robusta: busca el usuario y valida sus roles mediante código JS
const verificarAdministrador = crearVerificarAdministrador(async (userId) => {
  const prisma = require('../config/db');

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: {
      usuario_rol: {
        include: {
          rol: true,
        },
      },
    },
  });

  if (!usuario || usuario.estado !== 'activo') {
    return false;
  }

  // Verificamos si alguno de sus roles asociados es 'administrador'
  const esAdmin = usuario.usuario_rol.some(
    (ur) => ur.rol && ur.rol.nombre === ROL_ADMINISTRADOR
  );

  return esAdmin;
});

module.exports = { crearVerificarAdministrador, verificarAdministrador, ROL_ADMINISTRADOR };