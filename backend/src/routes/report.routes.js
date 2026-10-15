const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

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

module.exports = router;
