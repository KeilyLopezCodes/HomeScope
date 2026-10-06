const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');

// Importar el middleware con su nombre real
const { authenticateToken } = require('../middlewares/auth.middleware');

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
 *         description: Texto libre (busca en título, descripción, dirección, municipio, departamento)
 *       - in: query
 *         name: modalidad
 *         schema: { type: string, enum: [VENTA, ALQUILER] }
 *         description: Filtrar por modalidad
 *       - in: query
 *         name: tipo_propiedad_id
 *         schema: { type: integer }
 *         description: ID del tipo de propiedad
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
 *         description: Puntaje mínimo del Índice de Conveniencia (0-100)
 *       - in: query
 *         name: orden
 *         schema: { type: string, enum: [precio, precio_desc, fecha, fecha_asc, indice] }
 *         description: Campo de ordenamiento
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
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Property' } }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems: { type: integer }
 *                     totalPages: { type: integer }
 *                     currentPage: { type: integer }
 *                     limit: { type: integer }
 *       400:
 *         description: Parámetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', propertyController.getAll);
router.get('/:id', propertyController.getById);

// T14: Actualización e Historial de precios
router.put('/:id', authenticateToken, propertyController.update);
router.get('/:id/history', propertyController.getHistory);

router.delete('/:id', authenticateToken, propertyController.remove);

module.exports = router;