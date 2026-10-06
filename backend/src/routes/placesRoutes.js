const express = require('express')
const router = express.Router()
const placesController = require('../controllers/placesController')

/**
 * @swagger
 * tags:
 *   name: Places
 *   description: Puntos de interés cercanos a propiedades
 */

/**
 * @swagger
 * /places/search:
 *   get:
 *     summary: Buscar lugares por categoría y coordenadas
 *     tags: [Places]
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema: { type: string, example: 'restaurant' }
 *         description: Categoría del lugar (restaurant, school, hospital, etc.)
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number, example: 9.9281 }
 *         description: Latitud de la ubicación
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number, example: -84.0907 }
 *         description: Longitud de la ubicación
 *       - in: query
 *         name: radio
 *         schema: { type: integer, default: 5000 }
 *         description: Radio de búsqueda en metros
 *       - in: query
 *         name: propiedadId
 *         schema: { type: string }
 *         description: ID de la propiedad asociada (opcional)
 *     responses:
 *       200:
 *         description: Lista de lugares encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 total: { type: integer }
 *                 data: { type: array, items: { type: object } }
 *       400:
 *         description: Parámetros faltantes o inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/search', placesController.obtenerLugaresPorCategoria)

module.exports = router