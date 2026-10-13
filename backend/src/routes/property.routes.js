const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');

// Importar el middleware con su nombre real
const { authenticateToken } = require('../middlewares/auth.middleware');

const fotoController = require('../controllers/foto.controller');
const { subirFotosMiddleware } = require('../middlewares/upload.middleware');

// Rutas de propiedades
router.post('/', authenticateToken, propertyController.create);
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
 *     summary: Buscar y listar propiedades con filtros combinados
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Texto libre (título, descripción, dirección, municipio, departamento)
 *       - in: query
 *         name: modalidad
 *         schema: { type: string, enum: [VENTA, ALQUILER] }
 *         description: Modalidad de la propiedad
 *       - in: query
 *         name: tipo_propiedad_id
 *         schema: { type: integer }
 *         description: "ID del tipo: 1=Casa, 2=Apartamento, 3=Terreno, 4=Local Comercial, 5=Oficina"
 *       - in: query
 *         name: precio_min
 *         schema: { type: number }
 *         description: Precio mínimo
 *       - in: query
 *         name: precio_max
 *         schema: { type: number }
 *         description: Precio máximo
 *       - in: query
 *         name: habitaciones_min
 *         schema: { type: integer }
 *         description: Número mínimo de habitaciones
 *       - in: query
 *         name: indice_min
 *         schema: { type: number, minimum: 0, maximum: 100 }
 *         description: Puntaje mínimo del Índice de Conveniencia
 *       - in: query
 *         name: orden
 *         schema: { type: string, enum: [precio, precio_desc, fecha, fecha_asc, indice] }
 *         description: Criterio de ordenamiento
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *         description: Resultados por página (máx. 50)
 *     responses:
 *       200:
 *         description: Lista paginada de propiedades
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedProperties'
 *       400:
 *         description: Parámetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         schema: { type: integer }
 *         description: ID de la propiedad
 *     responses:
 *       200:
 *         description: Datos completos de la propiedad
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

// T14: Actualización e Historial de precios
router.put('/:id', authenticateToken, propertyController.update);
router.get('/:id/history', propertyController.getHistory);

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
 *             $ref: '#/components/schemas/PropertyInput'
 *     responses:
 *       201:
 *         description: Propiedad creada exitosamente
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
 *       401:
 *         description: Token inválido o ausente
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
 *     summary: Actualizar una propiedad (solo el dueño)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PropertyInput'
 *     responses:
 *       200:
 *         description: Propiedad actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Error al actualizar o sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token inválido o ausente
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
 *     summary: Eliminar una propiedad (solo el dueño)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Propiedad eliminada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Error al eliminar o sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token inválido o ausente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', authenticateToken, propertyController.remove);

router.post('/:id/fotos', authenticateToken, subirFotosMiddleware, fotoController.subirFotos);
router.put('/:id/fotos/orden', authenticateToken, fotoController.reordenar);
router.delete('/:id/fotos/:fotoId', authenticateToken, fotoController.eliminar);

module.exports = router;
