const prisma = require('../config/db');

// Servicio de ejemplo
const findUsers = async () => {
  return await prisma.usuario.findMany();
};

module.exports = { findUsers };