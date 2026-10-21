const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { verificarAdministrador } = require('../middlewares/admin.middleware');

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Panel de administrador (solo rol administrador). Toda acción de moderación queda registrada en la auditoría.
 * components:
 *   schemas:
 *     MotivoInput:
 *       type: object
 *       required: [motivo]
 *       properties:
 *         motivo: { type: string, maxLength: 300, example: Publicación con fotos que no corresponden a la propiedad }
 *         reporte_id: { type: integer, description: Reporte que se resuelve con esta acción (opcional), example: 12 }
 *     ReporteEstadoInput:
 *       type: object
 *       required: [estado, motivo]
 *       properties:
 *         estado: { type: string, enum: [en_revision, resuelto, descartado] }
 *         motivo: { type: string, maxLength: 300, example: El reporte no tiene fundamento }
 *     PropiedadAccionInput:
 *       type: object
 *       required: [accion, motivo]
 *       properties:
 *         accion: { type: string, enum: [pausar, aprobar] }
 *         motivo: { type: string, maxLength: 300 }
 *         reporte_id: { type: integer, description: Solo con "pausar" }
 *     UsuarioAccionInput:
 *       type: object
 *       required: [accion, motivo]
 *       properties:
 *         accion: { type: string, enum: [suspender, reactivar] }
 *         motivo: { type: string, maxLength: 300 }
 *         reporte_id: { type: integer, description: Solo con "suspender" }
 *     AccionModeracion:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         accion: { type: string, example: pausar }
 *         motivo: { type: string }
 *         fecha_accion: { type: string, format: date-time }
 *         administrador: { type: object, properties: { id: { type: integer }, nombre: { type: string }, apellido: { type: string } } }
 *         reporte_id: { type: integer, nullable: true }
 *         propiedad_id: { type: integer, nullable: true }
 *         usuario_id: { type: integer, nullable: true }
 *     ModeracionResultado:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 accion: { $ref: '#/components/schemas/AccionModeracion' }
 *                 nuevo_estado: { type: string, example: pausado }
 *   parameters:
 *     AdminId:
 *       in: path
 *       name: id
 *       required: true
 *       schema: { type: integer, minimum: 1 }
 *       description: Id del recurso
 *     Page:
 *       in: query
 *       name: page
 *       schema: { type: integer, default: 1, minimum: 1 }
 *     Limit:
 *       in: query
 *       name: limit
 *       schema: { type: integer, default: 20, maximum: 50 }
 */

// Criterios de aceptación 1 y 3: TODAS las rutas de este archivo pasan primero por el JWT y
// luego por la verificación explícita del rol administrador. Una ruta nueva no puede olvidarla.
router.use(authenticateToken, verificarAdministrador);

/**
 * @swagger
 * /admin/reportes:
 *   get:
 *     summary: Listar reportes (paginado)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema: { type: string, enum: [pendiente, en_revision, resuelto, descartado] }
 *       - in: query
 *         name: tipo
 *         schema: { type: string, enum: [propiedad, usuario, comentario] }
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200: { description: Lista paginada de reportes }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       500: { $ref: '#/components/responses/InternalError' }
 */
router.get('/reportes', adminController.getReports);

/**
 * @swagger
 * /admin/reportes/{id}:
 *   get:
 *     summary: Detalle de un reporte con las acciones de moderación aplicadas
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/AdminId'
 *     responses:
 *       200: { description: Reporte con su objetivo y su historial de acciones }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     summary: Cambiar el estado de un reporte (en_revision, resuelto o descartado)
 *     description: Un reporte cerrado (resuelto o descartado) ya no se puede modificar. Queda una fila de auditoría.
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/AdminId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReporteEstadoInput' }
 *     responses:
 *       200:
 *         description: Estado actualizado y acción registrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ModeracionResultado' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: El reporte ya está cerrado o ya tiene ese estado }
 */
router.get('/reportes/:id', adminController.getReportById);
router.patch('/reportes/:id', adminController.updateReport);

/**
 * @swagger
 * /admin/propiedades/{id}/estado:
 *   patch:
 *     summary: Pausar o volver a aprobar una publicación
 *     description: |
 *       `pausar` (solo si está `publicado`) la oculta del listado público; `aprobar` (solo si está `pausado`) la vuelve a publicar.
 *       Con `reporte_id` (solo al pausar) el reporte queda `resuelto` en la misma transacción.
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/AdminId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PropiedadAccionInput' }
 *     responses:
 *       200:
 *         description: Acción aplicada y registrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ModeracionResultado' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: La propiedad no está en el estado requerido, o el reporte ya está cerrado }
 */
router.patch('/propiedades/:id/estado', adminController.moderateProperty);

/**
 * @swagger
 * /admin/propiedades/{id}:
 *   delete:
 *     summary: Eliminar una publicación (borrado lógico)
 *     description: La propiedad pasa a `no_disponible` y se conservan sus datos. Requiere `motivo` en el cuerpo; queda registrada en la auditoría.
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/AdminId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MotivoInput' }
 *     responses:
 *       200:
 *         description: Propiedad eliminada y acción registrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ModeracionResultado' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: La propiedad ya fue eliminada }
 */
router.delete('/propiedades/:id', adminController.removeProperty);

/**
 * @swagger
 * /admin/usuarios:
 *   get:
 *     summary: Listar usuarios (paginado, sin datos sensibles)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema: { type: string, enum: [activo, suspendido, inhabilitado] }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Texto a buscar en nombre, apellido o correo
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200: { description: Lista paginada de usuarios con sus roles }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/usuarios', adminController.getUsers);

/**
 * @swagger
 * /admin/usuarios/{id}/estado:
 *   patch:
 *     summary: Suspender o reactivar un usuario
 *     description: |
 *       `suspender` (solo usuarios `activo`) o `reactivar` (solo `suspendido`). No se puede moderar la propia cuenta ni a otro administrador.
 *       Con `reporte_id` (solo al suspender) el reporte queda `resuelto`; puede ser un reporte del usuario o de una propiedad suya.
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/AdminId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UsuarioAccionInput' }
 *     responses:
 *       200:
 *         description: Acción aplicada y registrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ModeracionResultado' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: El usuario no está en el estado requerido, o el reporte ya está cerrado }
 */
router.patch('/usuarios/:id/estado', adminController.moderateUser);

/**
 * @swagger
 * /admin/acciones:
 *   get:
 *     summary: Auditoría de moderación (solo lectura)
 *     description: Registro de todas las acciones con administrador responsable, motivo y fecha. No se puede modificar ni borrar desde la API.
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: administrador_id
 *         schema: { type: integer }
 *       - in: query
 *         name: accion
 *         schema: { type: string, example: suspender }
 *       - in: query
 *         name: reporte_id
 *         schema: { type: integer }
 *       - in: query
 *         name: propiedad_id
 *         schema: { type: integer }
 *       - in: query
 *         name: usuario_id
 *         schema: { type: integer }
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200: { description: Lista paginada de acciones, de la más reciente a la más antigua }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/acciones', adminController.getActions);

module.exports = router;