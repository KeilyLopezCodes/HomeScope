const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reportes de publicaciones sospechosas
 */

/**
 * @swagger
 * /reportes/motivos:
 *   get:
 *     summary: Listar los motivos válidos para reportar una publicación
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Motivos disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       codigo: { type: string, example: fraude }
 *                       descripcion: { type: string, example: Posible fraude o estafa }
 */
router.get('/motivos', reportController.getMotivos);

// TODO: activar cuando se implemente la validación de roles. Mientras esté en false, cualquier
// usuario autenticado puede ver la cola y aprobar o rechazar reportes. Al cambiarlo a true se
// exige el permiso moderacion.ver_reportes (rol administrador).
const VALIDAR_ROL_MODERACION = false;

const moderacion = VALIDAR_ROL_MODERACION
  ? [authenticateToken, requirePermission('moderacion.ver_reportes')]
  : [authenticateToken];

/**
 * @swagger
 * /reportes:
 *   get:
 *     summary: Cola de reportes de publicaciones (moderación)
 *     description: |
 *       Por ahora cualquier usuario autenticado (la validación del rol administrador está pendiente). Por defecto devuelve los
 *       reportes `pendiente`, del más antiguo al más reciente. Las publicaciones con reportes
 *       abiertos siguen visibles: el reporte solo las marca para revisión.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema: { type: string, default: pendiente, enum: [pendiente, en_revision, resuelto, descartado, todos] }
 *       - in: query
 *         name: propiedad_id
 *         schema: { type: integer }
 *         description: Filtrar los reportes de una publicación
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *     responses:
 *       200:
 *         description: Reportes paginados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ReportDetail' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', moderacion, reportController.listReports);

/**
 * @swagger
 * components:
 *   requestBodies:
 *     ResolucionReporte:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [motivo]
 *             properties:
 *               motivo:
 *                 type: string
 *                 maxLength: 300
 *                 description: Justificación de la decisión; se guarda en accion_moderacion
 *                 example: Se verificó que las fotos pertenecen a otra propiedad.
 *   responses:
 *     ReporteResuelto:
 *       description: Reporte atendido
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success: { type: boolean, example: true }
 *               message: { type: string }
 *               data: { $ref: '#/components/schemas/ReportDetail' }
 *     ReporteYaAtendido:
 *       description: El reporte ya fue aprobado o rechazado
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     ReporteNoEncontrado:
 *       description: Reporte no encontrado
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /reportes/{id}/aprobar:
 *   patch:
 *     summary: Aprobar un reporte
 *     description: |
 *       Marca el reporte como `resuelto` y registra la acción en `accion_moderacion`.
 *       **No modifica ni elimina la publicación**; pausarla o eliminarla es una acción de moderación aparte.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       $ref: '#/components/requestBodies/ResolucionReporte'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ReporteResuelto'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/ReporteNoEncontrado'
 *       409:
 *         $ref: '#/components/responses/ReporteYaAtendido'
 */
router.patch('/:id/aprobar', moderacion, reportController.approveReport);

/**
 * @swagger
 * /reportes/{id}/rechazar:
 *   patch:
 *     summary: Rechazar un reporte
 *     description: Marca el reporte como `descartado` y registra la acción en `accion_moderacion`. La publicación no se modifica.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       $ref: '#/components/requestBodies/ResolucionReporte'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ReporteResuelto'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/ReporteNoEncontrado'
 *       409:
 *         $ref: '#/components/responses/ReporteYaAtendido'
 */
router.patch('/:id/rechazar', moderacion, reportController.rejectReport);

module.exports = router;
