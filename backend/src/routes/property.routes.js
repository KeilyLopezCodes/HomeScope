const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');

// Importar el middleware con su nombre real
const { authenticateToken } = require('../middlewares/auth.middleware');

// Rutas de propiedades
router.post('/', authenticateToken, propertyController.create);
router.get('/', propertyController.getAll);
router.get('/:id', propertyController.getById);

// T14: Actualización e Historial de precios
router.put('/:id', authenticateToken, propertyController.update);
router.get('/:id/history', propertyController.getHistory);

router.delete('/:id', authenticateToken, propertyController.remove);

module.exports = router;