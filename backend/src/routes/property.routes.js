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
 *     description: La propiedad se crea en estado `borrador` y el usuario autenticado queda como vendedor. Para que aparezca en el listado público hay que publicarla con `PATCH /properties/{id}/estado`.
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
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', authenticateToken, propertyController.create);

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: Buscar y listar propiedades con filtros combinados
 *     description: Público. Solo devuelve propiedades en estado `publicado`. Todos los filtros son opcionales y se combinan con AND.
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Texto libre (título, descripción, dirección, municipio, departamento), sin distinguir mayúsculas
 *       - in: query
 *         name: modalidad
 *         schema: { type: string, enum: [VENTA, ALQUILER] }
 *         description: Modalidad de la propiedad (no distingue mayúsculas)
 *       - in: query
 *         name: tipo_propiedad_id
 *         schema: { type: integer }
 *         description: "ID del tipo: 1=Casa, 2=Apartamento, 3=Terreno, 4=Local Comercial, 5=Oficina"
 *       - in: query
 *         name: precio_min
 *         schema: { type: number }
 *         description: Precio mínimo (no puede ser mayor que precio_max)
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
 *         description: Puntaje mínimo del Índice de Conveniencia vigente
 *       - in: query
 *         name: orden
 *         schema: { type: string, enum: [precio, precio_desc, fecha, fecha_asc, indice] }
 *         description: |
 *           Criterio de ordenamiento. Por defecto (y con `fecha`) se ordena por fecha de publicación descendente.
 *           `indice` ordena por puntaje del índice vigente **dentro de la página actual**.
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *         description: Resultados por página (máx. 50)
 *     responses:
 *       200:
 *         description: Lista paginada de propiedades publicadas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedProperties'
 *       400:
 *         description: Parámetros inválidos (modalidad, orden, precio no numérico o precio_min > precio_max)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { success: false, message: 'precio_min no puede ser mayor que precio_max' }
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', propertyController.getAll);

/**
 * @swagger
 * /properties/mine:
 *   get:
 *     summary: Listar las propiedades del usuario autenticado
 *     description: Incluye todas sus propiedades sin importar el estado (borrador, publicado, pausado, etc.), de la más reciente a la más antigua. Sin paginación.
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Propiedades del vendedor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/MyPropertyItem' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
// Debe ir antes de '/:id' para que "mine" no se tome como id
router.get('/mine', authenticateToken, propertyController.getMine);

/**
 * @swagger
 * /properties/{id}:
 *   get:
 *     summary: Obtener la ficha de una propiedad
 *     description: Público. Incluye vendedor, tipo, fotos (por orden), índice de conveniencia e historial de precios en orden cronológico.
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
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', propertyController.getById);

// T14: Actualización e Historial de precios

/**
 * @swagger
 * /properties/{id}:
 *   put:
 *     summary: Actualizar una propiedad (solo el dueño)
 *     description: |
 *       Actualización parcial: solo se modifican los campos enviados de `PropertyUpdate`.
 *       Si el `precio` cambia (comparado a 2 decimales) se crea automáticamente un registro en el historial,
 *       dentro de la misma transacción. Si el precio no cambia, no se registra nada.
 *       Para cambiar el estado se usa `PATCH /properties/{id}/estado`.
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
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
 *         description: Lista de cambios de precio (vacía si el precio nunca cambió)
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
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id/history', propertyController.getHistory);

/**
 * @swagger
 * /properties/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de una propiedad (solo el dueño)
 *     description: Al pasar a `publicado` por primera vez se registra la fecha de publicación. Solo las propiedades `publicado` aparecen en el listado público.
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
 *             $ref: '#/components/schemas/EstadoUpdate'
 *     responses:
 *       200:
 *         description: Estado actualizado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Property' }
 *       400:
 *         description: Estado o ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { success: false, message: 'Estado inválido. Válidos: borrador, publicado, pausado, vendido, alquilado, no_disponible' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/:id/estado', authenticateToken, propertyController.updateStatus);

/**
 * @swagger
 * /properties/{id}:
 *   delete:
 *     summary: Eliminar una propiedad (solo el dueño)
 *     description: |
 *       Borrado lógico: la propiedad pasa a estado `no_disponible` (el historial de precios se conserva).
 *       Sus fotos sí se eliminan de Cloudinary y de la base de datos.
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
 *               $ref: '#/components/schemas/MessageResponse'
 *             example: { success: true, message: 'Propiedad eliminada correctamente' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id', authenticateToken, propertyController.remove);

/**
 * @swagger
 * /properties/{id}/fotos:
 *   post:
 *     summary: Subir fotos a una propiedad (solo el dueño)
 *     description: |
 *       Formatos jpg, png o webp (se valida el contenido real del archivo), máximo 5 MB por foto y 10 fotos por propiedad en total.
 *       Si la propiedad no tiene portada, la primera foto subida queda como portada (o la indicada en `portada`).
 *       Si una sola foto falla al subir, no se guarda ninguna.
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
 *             example: { success: false, message: 'Máximo 10 fotos por propiedad (ya tiene 8)' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
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
 *         description: La lista no coincide con las fotos de la propiedad, portada inválida, propiedad no encontrada o sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { success: false, message: 'La lista de fotos no coincide con las de la propiedad' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/:id/fotos/orden', authenticateToken, fotoController.reordenar);

/**
 * @swagger
 * /properties/{id}/fotos/{fotoId}:
 *   delete:
 *     summary: Eliminar una foto (solo el dueño)
 *     description: Elimina la foto de Cloudinary y de la base de datos. Si era la portada, la siguiente foto pasa a ser portada.
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
 *               $ref: '#/components/schemas/MessageResponse'
 *             example: { success: true, message: 'Foto eliminada' }
 *       400:
 *         description: Foto o propiedad no encontrada, o sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example: { success: false, message: 'Foto no encontrada' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/:id/fotos/:fotoId', authenticateToken, fotoController.eliminar);

module.exports = router;
