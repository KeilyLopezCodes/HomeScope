const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Rutas públicas
router.get('/', propertyController.getAll);
router.get('/:id', propertyController.getById);

// Rutas protegidas (Requieren Login)
router.post('/', authenticateToken, propertyController.create);
router.put('/:id', authenticateToken, propertyController.update);
router.delete('/:id', authenticateToken, propertyController.remove);

module.exports = router;