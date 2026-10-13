const express = require('express')
const router = express.Router()
const placesController = require('../controllers/placesController')

/**
 * @swagger
 * tags:
 *   name: Places
 *   description: Puntos de interés cercanos (Google Places)
 */

/**
 * @swagger
 * /places/search:
 *   get:
 *     summary: Buscar puntos de interés cercanos por categoría
 *     description: |
 *       Busca en Google Places hasta 5 lugares por cada categoría activa cuyo nombre contenga `category`.
 *       Si se envía `propiedadId`, los resultados se guardan en la tabla `punto_interes` de esa propiedad.
 *     tags: [Places]
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema: { type: string }
 *         description: Nombre (o parte) de la categoría de interés
 *         example: supermercado
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *         example: 14.6049
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 *         example: -90.5069
 *       - in: query
 *         name: radio
 *         schema: { type: integer, default: 5000 }
 *         description: Radio de búsqueda en metros
 *       - in: query
 *         name: propiedadId
 *         schema: { type: integer }
 *         description: Si se indica, persiste los puntos de interés para esa propiedad
 *     responses:
 *       200:
 *         description: Lugares agrupados por nombre de categoría (en minúsculas)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 total:   { type: integer }
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items: { $ref: '#/components/schemas/Place' }
 *       400:
 *         description: Faltan parámetros obligatorios o coordenadas inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/search', placesController.obtenerLugaresPorCategoria)

module.exports = router
