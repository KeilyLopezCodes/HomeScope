const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Calificaciones y comentarios sobre vendedores
 */

// TODO: activar cuando se implemente la validación de roles (igual que en report.routes.js).
// Mientras esté en false basta con estar autenticado; la regla de contacto previo se valida
// siempre en el servicio. Al cambiarlo a true se exige el permiso resena.crear (rol comprador).
const VALIDAR_PERMISO_RESENA = false;

const crearResena = VALIDAR_PERMISO_RESENA
  ? [authenticateToken, requirePermission('resena.crear')]
  : [authenticateToken];

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Calificar y comentar al vendedor de una propiedad
 *     description: |
 *       Solo puede calificar quien tuvo **contacto previo** con el vendedor por esa propiedad:
 *       - una visita agendada que no esté `cancelada` ni `rechazada`, o
 *       - una conversación sobre la propiedad con al menos un mensaje.
 *
 *       El vendedor calificado es el dueño de la propiedad (`vendedor_id` no se envía).
 *       Se permite **una reseña por usuario y propiedad**, y nadie puede calificarse a sí mismo.
 *       Por ahora basta con estar autenticado (la validación del permiso `resena.crear` está pendiente).
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReviewInput' }
 *     responses:
 *       201:
 *         description: Reseña registrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Gracias por calificar al vendedor. }
 *                 data: { $ref: '#/components/schemas/Review' }
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, message: 'calificacion debe ser un número entero entre 1 y 5' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Token inválido o expirado, sin contacto previo con el vendedor, o el vendedor es el mismo usuario
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, message: 'Solo puedes calificar al vendedor si agendaste una visita o lo contactaste por esta propiedad' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: El usuario ya calificó al vendedor por esta propiedad
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, message: 'Ya calificaste al vendedor por esta propiedad' }
 */
router.post('/', crearResena, reviewController.createReview);

module.exports = router;
