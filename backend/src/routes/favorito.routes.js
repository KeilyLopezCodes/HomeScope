const express = require('express');
const router = express.Router();
const c = require('../controllers/favorito.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Favoritos
 *   description: Propiedades guardadas por el usuario (alimentan las estadísticas del vendedor)
 */

/**
 * @swagger
 * /favoritos:
 *   get:
 *     summary: Ids de mis propiedades favoritas (solo las publicadas)
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ids, de la más reciente a la más antigua
 */
router.get('/', c.listar);

/**
 * @swagger
 * /favoritos/lote:
 *   post:
 *     summary: Subir varios favoritos de una vez (los que se guardaron sin sesión)
 *     description: Ignora las propiedades que no existen, no están publicadas o son del propio usuario. Máximo 100. Devuelve la lista completa actualizada.
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids: { type: array, items: { type: integer }, example: [1, 2] }
 *     responses:
 *       200:
 *         description: Lista de ids favoritos
 *       400:
 *         description: Datos inválidos
 */
router.post('/lote', c.lote);

/**
 * @swagger
 * /favoritos/{propiedadId}:
 *   put:
 *     summary: Agregar una propiedad a favoritos (repetirlo no hace nada)
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propiedadId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Agregada
 *       403:
 *         description: Es tu propia propiedad
 *       404:
 *         description: Propiedad no encontrada o no publicada
 *   delete:
 *     summary: Quitar una propiedad de favoritos
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propiedadId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Quitada
 */
router.put('/:propiedadId', c.agregar);
router.delete('/:propiedadId', c.quitar);

module.exports = router;