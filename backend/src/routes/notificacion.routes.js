const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const c = require('../controllers/notificacion.controller');

/**
 * @swagger
 * tags:
 *   name: Notificaciones
 *   description: Bandeja de notificaciones del usuario
 */

/**
 * @swagger
 * /notificaciones:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Lista mis notificaciones (más recientes primero)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: solo_no_leidas, schema: { type: boolean } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 */
router.get('/', authenticateToken, c.listar);

/** @swagger
 * /notificaciones/no-leidas/contar:
 *   get: { tags: [Notificaciones], summary: Cantidad sin leer, security: [{ bearerAuth: [] }] }
 */
router.get('/no-leidas/contar', authenticateToken, c.contar);

/** @swagger
 * /notificaciones/leer-todas:
 *   patch: { tags: [Notificaciones], summary: Marca todas como leídas, security: [{ bearerAuth: [] }] }
 */
router.patch('/leer-todas', authenticateToken, c.marcarTodas);

/** @swagger
 * /notificaciones/{id}/leer:
 *   patch: { tags: [Notificaciones], summary: Marca una como leída, security: [{ bearerAuth: [] }] }
 */
router.patch('/:id/leer', authenticateToken, c.marcarLeida);

module.exports = router;