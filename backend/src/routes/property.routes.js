const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');

// Importar el middleware con su nombre real
const { authenticateToken } = require('../middlewares/auth.middleware');

const fotoController = require('../controllers/foto.controller');
const { subirFotosMiddleware } = require('../middlewares/upload.middleware');

/**
 * @swagger
 * tags:
 *   - name: Properties
 *     description: Gestión de propiedades inmobiliarias
 *   - name: Price History
 *     description: Historial inmutable de cambios de precio
 *   - name: Photos
 *     description: Fotos de propiedades (Cloudinary)
 */

// Rutas de propiedades

/**
 * @swagger
 * /properties:
 *   post:
 *     summary: Crear una nueva propiedad
 *     description: La propiedad se crea en estado `borrador` y el usuario autenticado queda como vendedor.
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
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Property' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', authenticateToken, propertyController.create);

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: Listar propiedades paginadas
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema: { type: string, default: publicado, enum: [borrador, publicado, pausado, vendido, alquilado, no_disponible] }
 *         description: Estado de las propiedades a listar
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Resultados por página
 *     responses:
 *       200:
 *         description: Lista paginada de propiedades
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedProperties'
 *       500:
 *         description: Error interno
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
 *     summary: Obtener la ficha de una propiedad
 *     description: Incluye vendedor, tipo, fotos (por orden), índice de conveniencia e historial de precios en orden cronológico.
 *     tags: [Properties]
 *     parameters:
 *       - $ref: '#/components/parameters/PropertyId'
 *     responses:
 *       200:
 *         description: Datos completos de la propiedad
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/PropertyDetail' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', propertyController.getById);

// T14: Actualización e Historial de precios

/**
 * @swagger
 * /properties/{id}:
 *   put:
 *     summary: Actualizar una propiedad (solo el dueño)
 *     description: |
 *       Si el `precio` cambia (comparado a 2 decimales) se crea automáticamente un registro en el historial,
 *       dentro de la misma transacción. Si el precio no cambia, no se registra nada.
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PropertyId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PropertyUpdate'
 *     responses:
 *       200:
 *         description: Propiedad actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Property' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authenticateToken, propertyController.update);

/**
 * @swagger
 * /properties/{id}/history:
 *   get:
 *     summary: Historial de precios de una propiedad
 *     description: Público. Devuelve los cambios de precio en orden cronológico (más antiguo primero). Los registros no se pueden editar ni eliminar.
 *     tags: [Price History]
 *     parameters:
 *       - $ref: '#/components/parameters/PropertyId'
 *     responses:
 *       200:
 *         description: Lista de cambios de precio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/PriceHistoryEntry' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/history', propertyController.getHistory);

/**
 * @swagger
 * /properties/{id}:
 *   delete:
 *     summary: Eliminar una propiedad (solo el dueño)
 *     description: Borrado lógico — la propiedad pasa a estado `no_disponible` y se eliminan sus fotos de Cloudinary.
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PropertyId'
 *     responses:
 *       200:
 *         description: Propiedad eliminada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Propiedad no encontrada o el usuario no es el dueño
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', authenticateToken, propertyController.remove);

/**
 * @swagger
 * /properties/{id}/fotos:
 *   post:
 *     summary: Subir fotos a una propiedad (solo el dueño)
 *     description: |
 *       Formatos jpg, png o webp, máximo 5 MB por foto y 10 fotos por propiedad en total.
 *       Si la propiedad no tiene portada, la primera foto subida queda como portada (o la indicada en `portada`).
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PropertyId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [fotos]
 *             properties:
 *               fotos:
 *                 type: array
 *                 maxItems: 10
 *                 items: { type: string, format: binary }
 *               portada:
 *                 type: integer
 *                 minimum: 0
 *                 description: Índice (base 0) dentro de `fotos` de la foto que será portada
 *     responses:
 *       201:
 *         description: Fotos subidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Foto' }
 *       400:
 *         description: Archivo inválido, demasiado grande, límite de fotos excedido, propiedad no encontrada o sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/:id/fotos', authenticateToken, subirFotosMiddleware, fotoController.subirFotos);

/**
 * @swagger
 * /properties/{id}/fotos/orden:
 *   put:
 *     summary: Reordenar fotos y elegir portada (solo el dueño)
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PropertyId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids, portadaId]
 *             properties:
 *               ids:
 *                 type: array
 *                 description: IDs de TODAS las fotos de la propiedad, en el nuevo orden
 *                 items: { type: integer }
 *                 example: [14, 12, 13]
 *               portadaId:
 *                 type: integer
 *                 description: ID de la foto que será portada (debe estar en `ids`)
 *                 example: 14
 *     responses:
 *       200:
 *         description: Orden actualizado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Foto' }
 *       400:
 *         description: La lista no coincide con las fotos de la propiedad, portada inválida o sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/fotos/orden', authenticateToken, fotoController.reordenar);

/**
 * @swagger
 * /properties/{id}/fotos/{fotoId}:
 *   delete:
 *     summary: Eliminar una foto (solo el dueño)
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PropertyId'
 *       - in: path
 *         name: fotoId
 *         required: true
 *         schema: { type: integer }
 *         description: ID de la foto
 *     responses:
 *       200:
 *         description: Foto eliminada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Foto o propiedad no encontrada, o sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id/fotos/:fotoId', authenticateToken, fotoController.eliminar);

module.exports = router;
