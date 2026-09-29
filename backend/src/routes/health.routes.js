const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

router.get('/health', async (req, res) => {
  try {
    const totalRoles = await prisma.rol.count();
    const totalPermisos = await prisma.permiso.count();

    res.json({
      status: "OK",
      service: "HomeScope Backend API",
      database: "PostgreSQL (Docker + Prisma)",
      datos: {
        roles: totalRoles,
        permisos: totalPermisos
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Error al conectar con PostgreSQL",
      error: error.message
    });
  }
});

module.exports = router;