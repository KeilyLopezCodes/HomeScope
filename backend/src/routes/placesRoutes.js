const express = require('express')
const router = express.Router()
const placesController = require('../controllers/placesController')

//ruta para obtener y guardar los puntos de interes 
router.get('/search', placesController.obtenerLugaresPorCategoria)

module.exports = router