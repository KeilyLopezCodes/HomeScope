'use strict';

const { Router } = require('express');
const controller = require('../controllers/geo-indice.controller');

const router = Router();
router.get('/propiedades/:id/indice', controller.obtenerIndice);

//TEMPORAL (pruebas para probar el flujo de trabajo) eliminar antes del PR final
if(process.env.NODE_ENV !== 'production') {
    router.post('/propiedades/:id/indice/recalcular', controller.recalcular);
}
module.exports = router;