const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Properties
 *   description: Gestión de propiedades inmobiliarias
 */

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: Obtener todas las propiedades
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Resultados por página
 *       - in: query
 *         name: tipo
 *         schema: { type: string, enum: [venta, alquiler] }
 *         description: Filtrar por tipo de propiedad
 *     responses:
 *       200:
 *         description: Lista de propiedades con paginación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Property' } }
 *                 pagination: { type: object }
 */
router.get('/', propertyController.getAll);

/**
 * @swagger
 * /properties/{id}:
 *   get:
 *     summary: Obtener una propiedad por ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID de la propiedad
 *     responses:
 *       200:
 *         description: Datos de la propiedad
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Propiedad no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', propertyController.getById);

/**
 * @swagger
 * /properties:
 *   post:
 *     summary: Crear una nueva propiedad
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Property'
 *     responses:
 *       201:
 *         description: Propiedad publicada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authenticateToken, propertyController.create);

/**
 * @swagger
 * /properties/{id}:
 *   put:
 *     summary: Actualizar una propiedad
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Property'
 *     responses:
 *       200:
 *         description: Propiedad actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Error al actualizar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', authenticateToken, propertyController.update);

/**
 * @swagger
 * /properties/{id}:
 *   delete:
 *     summary: Eliminar una propiedad
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Propiedad eliminada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Error al eliminar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', authenticateToken, propertyController.remove);

module.exports = router;