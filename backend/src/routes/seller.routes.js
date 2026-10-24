const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');

/**
 * @swagger
 * tags:
 *   name: Sellers
 *   description: Perfil público del vendedor y su reputación
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     SellerId:
 *       in: path
 *       name: id
 *       required: true
 *       schema: { type: integer, minimum: 1, maximum: 2147483647 }
 *       description: ID del usuario vendedor
 *       example: 2
 *   responses:
 *     VendedorNoEncontrado:
 *       description: Vendedor no encontrado
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorResponse' }
 *           example: { success: false, message: 'Vendedor no encontrado' }
 */

/**
 * @swagger
 * /sellers/{id}:
 *   get:
 *     summary: Perfil público del vendedor con su calificación promedio
 *     description: Público. El promedio se calcula al momento a partir de la tabla `resena` y es `null` si el vendedor aún no tiene reseñas.
 *     tags: [Sellers]
 *     parameters:
 *       - $ref: '#/components/parameters/SellerId'
 *     responses:
 *       200:
 *         description: Perfil del vendedor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/SellerProfile' }
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, message: 'ID de vendedor inválido' }
 *       404:
 *         $ref: '#/components/responses/VendedorNoEncontrado'
 */
router.get('/:id', reviewController.getSellerProfile);

/**
 * @swagger
 * /sellers/{id}/reviews:
 *   get:
 *     summary: Reseñas recibidas por un vendedor
 *     description: Público. Devuelve las reseñas de la más reciente a la más antigua, junto con el resumen de calificación del vendedor.
 *     tags: [Sellers, Reviews]
 *     parameters:
 *       - $ref: '#/components/parameters/SellerId'
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *     responses:
 *       200:
 *         description: Reseñas paginadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 vendedor: { $ref: '#/components/schemas/SellerPublic' }
 *                 calificacion: { $ref: '#/components/schemas/RatingSummary' }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Review' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, message: 'ID de vendedor inválido' }
 *       404:
 *         $ref: '#/components/responses/VendedorNoEncontrado'
 */
router.get('/:id/reviews', reviewController.listSellerReviews);

module.exports = router;
