const express = require('express');
const router = express.Router();
const c = require('../controllers/mensajeria.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Mensajería
 *   description: Chat interno entre comprador y vendedor, siempre ligado a una propiedad
 */

/**
 * @swagger
 * /conversaciones:
 *   post:
 *     summary: Abre (o reutiliza) la conversación del comprador con el vendedor de una propiedad
 *     tags: [Mensajería]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propiedad_id]
 *             properties:
 *               propiedad_id:
 *                 type: integer
 *               contenido:
 *                 type: string
 *                 description: Primer mensaje (opcional)
 *     responses:
 *       201:
 *         description: Conversación lista
 *       404:
 *         description: Propiedad no encontrada
 *   get:
 *     summary: Lista mis conversaciones (como comprador o vendedor) con no leídos
 *     tags: [Mensajería]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conversaciones
 */
router.post('/', c.iniciar);
router.get('/', c.listar);

/**
 * @swagger
 * /conversaciones/{id}:
 *   get:
 *     summary: Detalle de una conversación (solo participantes)
 *     tags: [Mensajería]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conversación
 *       403:
 *         description: No eres participante
 */
router.get('/:id', c.obtener);

/**
 * @swagger
 * /conversaciones/{id}/mensajes:
 *   get:
 *     summary: Mensajes en orden cronológico (marca como leídos los del otro)
 *     tags: [Mensajería]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: antes
 *         schema:
 *           type: string
 *         description: id de mensaje; trae los anteriores a ese (paginación)
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Mensajes
 *   post:
 *     summary: Envía un mensaje (se guarda, notifica al otro y se entrega por WebSocket)
 *     tags: [Mensajería]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenido]
 *             properties:
 *               contenido:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Mensaje enviado
 *       400:
 *         description: Vacío, muy largo o con datos de contacto
 *       403:
 *         description: No eres participante
 */
router.get('/:id/mensajes', c.listarMensajes);
router.post('/:id/mensajes', c.enviar);

module.exports = router;