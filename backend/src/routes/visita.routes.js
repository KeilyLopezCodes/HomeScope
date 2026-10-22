const express = require('express');
const router = express.Router();
const c = require('../controllers/agenda.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

// TODO: activar cuando se implemente la validación de roles (igual que en report.routes.js y review.routes.js).
// Mientras esté en false basta con estar autenticado; quién puede hacer qué sobre cada visita se valida siempre en el servicio.
const VALIDAR_PERMISOS = false;
const con = (permiso) => (VALIDAR_PERMISOS ? [authenticateToken, requirePermission(permiso)] : [authenticateToken]);

/**
 * @swagger
 * /visitas/horarios/{propiedadId}:
 *   get:
 *     summary: Horarios libres para visitar una propiedad
 *     description: Genera los espacios de 1 hora dentro de la disponibilidad del vendedor, sin los ya reservados. Se pueden pedir con mínimo 2 horas de anticipación y hasta 30 días.
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propiedadId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: dias
 *         schema: { type: integer, default: 14, maximum: 30 }
 *     responses:
 *       200:
 *         description: Horarios agrupados por día (hora de Guatemala)
 *       404:
 *         description: Propiedad no encontrada
 */
router.get('/horarios/:propiedadId', con('visita.solicitar'), c.getHorarios);

/**
 * @swagger
 * /visitas:
 *   post:
 *     summary: Solicitar una visita en un horario disponible
 *     description: |
 *       `fecha_hora` debe ser uno de los horarios devueltos por `/visitas/horarios/{propiedadId}`.
 *       La visita queda en estado `solicitada` y se notifica al vendedor.
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propiedad_id, fecha_hora]
 *             properties:
 *               propiedad_id: { type: integer, example: 1 }
 *               fecha_hora: { type: string, format: date-time, example: "2026-11-05T15:00:00.000Z" }
 *               nota: { type: string, maxLength: 300 }
 *     responses:
 *       201:
 *         description: Visita solicitada
 *       400:
 *         description: Horario no disponible o datos inválidos
 *       403:
 *         description: Es tu propia propiedad
 *       409:
 *         description: Horario ya reservado, ya tienes una visita pendiente, o el vendedor no declaró disponibilidad
 *   get:
 *     summary: Mis visitas (como comprador o como vendedor)
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de visitas
 */
router.post('/', con('visita.solicitar'), c.postVisita);
router.get('/', con('visita.ver_propias'), c.getVisitas);

/**
 * @swagger
 * /visitas/{id}/confirmar:
 *   patch:
 *     summary: El vendedor confirma una visita solicitada
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Visita confirmada (se notifica al comprador y se programa el recordatorio)
 *       403:
 *         description: Solo el vendedor de la propiedad
 *       409:
 *         description: La visita no está en estado solicitada
 */
router.patch('/:id/confirmar', con('visita.confirmar'), c.patchConfirmar);

/**
 * @swagger
 * /visitas/{id}/reprogramar:
 *   patch:
 *     summary: El vendedor propone otro horario
 *     description: La visita pasa a `reprogramada` y el comprador debe aceptar el nuevo horario (`/aceptar`) o cancelar.
 *     tags: [Agenda]
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
 *             type: object
 *             required: [fecha_hora]
 *             properties:
 *               fecha_hora: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Visita reprogramada
 *       400:
 *         description: Horario fuera de tu disponibilidad u ocupado
 *       409:
 *         description: La visita ya no se puede reprogramar
 */
router.patch('/:id/reprogramar', con('visita.confirmar'), c.patchReprogramar);

/**
 * @swagger
 * /visitas/{id}/aceptar:
 *   patch:
 *     summary: El comprador acepta el horario reprogramado
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Visita confirmada con el nuevo horario
 *       409:
 *         description: No hay reprogramación pendiente
 */
router.patch('/:id/aceptar', con('visita.solicitar'), c.patchAceptar);

/**
 * @swagger
 * /visitas/{id}/cancelar:
 *   patch:
 *     summary: Cancelar una visita (comprador o vendedor)
 *     description: Si el vendedor la cancela cuando aún está `solicitada`, queda como `rechazada`. La otra parte recibe una notificación.
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Visita cancelada
 *       403:
 *         description: No participas en esta visita
 *       409:
 *         description: La visita ya estaba cerrada
 */
router.patch('/:id/cancelar', con('visita.cancelar'), c.patchCancelar);

module.exports = router;