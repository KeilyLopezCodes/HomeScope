const express = require('express');
const router = express.Router();
const c = require('../controllers/agenda.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

// TODO: activar cuando se implemente la validación de roles (igual que en report.routes.js y review.routes.js).
// Mientras esté en false basta con estar autenticado; la propiedad de cada recurso se valida siempre en el servicio.
const VALIDAR_PERMISOS = false;
const gestionar = VALIDAR_PERMISOS
  ? [authenticateToken, requirePermission('disponibilidad.gestionar')]
  : [authenticateToken];

/**
 * @swagger
 * tags:
 *   name: Agenda
 *   description: Disponibilidad del vendedor y solicitudes de visita
 */

/**
 * @swagger
 * /disponibilidad:
 *   get:
 *     summary: Mis franjas de disponibilidad para visitas
 *     description: "`dia_semana`: 1 = lunes ... 7 = domingo. Horas en formato HH:MM (hora de Guatemala)."
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de franjas
 *   put:
 *     summary: Definir mis horarios disponibles (reemplaza todas las franjas del ámbito indicado)
 *     description: |
 *       Sin `propiedad_id` define los horarios **generales** (valen para todas tus propiedades).
 *       Con `propiedad_id` define horarios **solo para esa propiedad**; si existen, tienen prioridad sobre los generales.
 *       Enviar `franjas: []` borra las franjas de ese ámbito. Cada franja dura al menos 1 hora y las visitas se reservan por hora en punto.
 *     tags: [Agenda]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [franjas]
 *             properties:
 *               propiedad_id: { type: integer, nullable: true, example: 1 }
 *               franjas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [dia_semana, hora_inicio, hora_fin]
 *                   properties:
 *                     dia_semana: { type: integer, minimum: 1, maximum: 7, example: 2 }
 *                     hora_inicio: { type: string, example: "09:00" }
 *                     hora_fin: { type: string, example: "12:00" }
 *     responses:
 *       200:
 *         description: Disponibilidad guardada
 *       400:
 *         description: Franjas inválidas o traslapadas
 *       403:
 *         description: La propiedad no es tuya
 */
router.get('/', gestionar, c.getMiDisponibilidad);
router.put('/', gestionar, c.putDisponibilidad);

module.exports = router;