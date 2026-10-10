const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');

// Importar el middleware con su nombre real
const { authenticateToken } = require('../middlewares/auth.middleware');

const fotoController = require('../controllers/foto.controller');
const { subirFotosMiddleware } = require('../middlewares/upload.middleware');

// Rutas de propiedades
router.post('/', authenticateToken, propertyController.create);
router.get('/', propertyController.getAll);
router.get('/:id', propertyController.getById);

// T14: Actualización e Historial de precios
router.put('/:id', authenticateToken, propertyController.update);
router.get('/:id/history', propertyController.getHistory);

router.delete('/:id', authenticateToken, propertyController.remove);

router.post('/:id/fotos', authenticateToken, subirFotosMiddleware, fotoController.subirFotos);
router.put('/:id/fotos/orden', authenticateToken, fotoController.reordenar);
router.delete('/:id/fotos/:fotoId', authenticateToken, fotoController.eliminar);

module.exports = router;