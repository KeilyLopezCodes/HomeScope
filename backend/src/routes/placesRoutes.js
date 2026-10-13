const express = require('express');
const router = express.Router();
const placesController = require('../controllers/placesController');

/**
 * @swagger
 * tags:
 *   name: Places
 *   description: Puntos de interés cercanos a una propiedad
 */

/**
 * @swagger
 * /places/search:
 *   get:
 *     summary: Buscar lugares por categoría y coordenadas
 *     description: |
 *       Busca en Google Places los 5 primeros lugares de cada categoría activa de `categoria_interes`
 *       cuyo nombre contenga `category`. Requiere `GOOGLE_MAPS_API_KEY` y la tabla de categorías cargada;
 *       si no hay categorías que coincidan, `data` llega vacío.
 *     tags: [Places]
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema: { type: string, example: 'salud' }
 *         description: Texto a buscar en el nombre de la categoría, sin distinguir mayúsculas (educación, salud, comercio, transporte, áreas verdes, seguridad)
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number, example: 14.6049 }
 *         description: Latitud de la ubicación
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number, example: -90.5069 }
 *         description: Longitud de la ubicación
 *       - in: query
 *         name: radio
 *         schema: { type: integer, default: 5000 }
 *         description: Radio de búsqueda en metros
 *       - in: query
 *         name: propiedadId
 *         schema: { type: integer }
 *         description: ID de la propiedad asociada (opcional, para persistir los puntos en `punto_interes`)
 *     responses:
 *       200:
 *         description: Lugares encontrados, agrupados por nombre de categoría
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Lugares consultados y puntos de interés persistidos exitosamente.' }
 *                 total:   { type: integer, example: 1 }
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items: { $ref: '#/components/schemas/Lugar' }
 *                   example:
 *                     salud:
 *                       - google_place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4'
 *                         nombre: 'Hospital General'
 *                         latitud: 14.6101
 *                         longitud: -90.5122
 *                         distancia_m: 812.4
 *                         tiempo_estimado_min: 10
 *                         radio_consulta_m: 5000
 *       400:
 *         description: Parámetros faltantes o inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { success: false, message: 'Faltan parámetros obligatorios: category, lat y lng son requeridos.' }
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/search', placesController.obtenerLugaresPorCategoria);

module.exports = router;
