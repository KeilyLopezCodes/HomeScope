const express = require('express');
const router = express.Router();
const c = require('../controllers/estadisticas.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Si viene un token válido se identifica al usuario; si no viene (o es inválido) la petición sigue como anónima.
const authOpcional = (req, res, next) => {
  if (!req.headers.authorization) return next();
  const respuesta = { status: () => respuesta, json: () => next(), send: () => next(), sendStatus: () => next() };
  authenticateToken(req, respuesta, next);
};

/**
 * @swagger
 * tags:
 *   name: Panel del vendedor
 *   description: Estadísticas de interés de las publicaciones propias y registro de vistas
 */

/**
 * @swagger
 * /vistas/{propiedadId}:
 *   post:
 *     summary: Registrar una vista de la ficha de una propiedad
 *     description: |
 *       Funciona con o sin sesión. Solo cuenta propiedades publicadas, ignora las vistas del propio dueño
 *       y no repite la vista del mismo usuario en 30 minutos. Siempre responde 200 (`registrada` indica si se guardó).
 *     tags: [Panel del vendedor]
 *     parameters:
 *       - in: path
 *         name: propiedadId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Resultado del registro
 *       400:
 *         description: Id inválido
 */
router.post('/vistas/:propiedadId', authOpcional, c.vista);

/**
 * @swagger
 * /panel-vendedor/estadisticas:
 *   get:
 *     summary: Estadísticas de mis propiedades (vistas, favoritos, mensajes) y sugerencias de mejora
 *     description: |
 *       Por propiedad: vistas, favoritos y mensajes recibidos en el periodo y en total, visitas pendientes y sugerencias.
 *       `serie` trae la actividad diaria (solo días con actividad) para la gráfica de interés. Días en hora de Guatemala.
 *     tags: [Panel del vendedor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema: { type: integer, enum: [7, 30, 90], default: 30 }
 *     responses:
 *       200:
 *         description: Estadísticas del periodo
 *       400:
 *         description: Periodo inválido
 *       401:
 *         description: No autenticado
 */
router.get('/panel-vendedor/estadisticas', authenticateToken, c.panel);

module.exports = router;