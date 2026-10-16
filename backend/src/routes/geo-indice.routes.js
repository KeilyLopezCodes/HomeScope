'use strict';

const { Router } = require('express');
const controller = require('../controllers/geo-indice.controller');

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SubPuntajeCategoria:
 *       type: object
 *       description: Sub-puntaje de una categoría (0 a 100) con los datos que lo explican.
 *       properties:
 *         categoriaId:
 *           type: integer
 *           example: 1
 *         categoria:
 *           type: string
 *           example: educación
 *         icono:
 *           type: string
 *           example: school
 *         peso:
 *           type: number
 *           description: Peso de la categoría en el puntaje total (los pesos activos suman 1).
 *           example: 0.2
 *         puntaje:
 *           type: number
 *           description: Sub-puntaje de 0 a 100.
 *           example: 100
 *         cantidadPuntos:
 *           type: integer
 *           description: Total de lugares encontrados dentro del radio (no se limita a los 5 que se listan).
 *           example: 36
 *         distanciaMinimaM:
 *           type: integer
 *           nullable: true
 *           description: Distancia en metros al lugar más cercano; null si no hay lugares.
 *           example: 59
 *     PuntoInteres:
 *       type: object
 *       description: Lugar cercano usado en el cálculo.
 *       properties:
 *         categoriaId:
 *           type: integer
 *           example: 1
 *         googlePlaceId:
 *           type: string
 *           example: ChIJH517O2h1Yo8RgH9LVoR2How
 *         nombre:
 *           type: string
 *           example: Escuela Oficial Urbana De Niñas
 *         latitud:
 *           type: number
 *           example: 14.634842
 *         longitud:
 *           type: number
 *           example: -89.989427
 *         distanciaM:
 *           type: integer
 *           description: Distancia en línea recta, en metros.
 *           example: 59
 *         tiempoEstimadoMin:
 *           type: integer
 *           description: Minutos a pie (80 m por minuto). Es informativo y no entra en la fórmula.
 *           example: 1
 *     IndiceConveniencia:
 *       type: object
 *       description: Índice de Conveniencia vigente de una propiedad, leído de la base de datos.
 *       properties:
 *         puntajeTotal:
 *           type: number
 *           description: Puntaje de 0 a 100 con 2 decimales.
 *           example: 91.33
 *         nivelSemaforo:
 *           type: string
 *           enum: [verde, amarillo, rojo]
 *           description: verde desde 70, amarillo desde 40 y rojo por debajo de 40.
 *           example: verde
 *         radioM:
 *           type: integer
 *           example: 2000
 *         versionAlgoritmo:
 *           type: string
 *           example: v1.0
 *         fechaCalculo:
 *           type: string
 *           format: date-time
 *           example: "2026-10-14T02:54:37.882Z"
 *         subPuntajes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubPuntajeCategoria'
 *         puntosInteres:
 *           type: array
 *           description: Máximo 5 lugares por categoría, los más cercanos primero.
 *           items:
 *             $ref: '#/components/schemas/PuntoInteres'
 *     IndiceEnCalculo:
 *       type: object
 *       description: La propiedad aún no tiene un índice calculado.
 *       properties:
 *         estado:
 *           type: string
 *           example: en_calculo
 *     SubPuntajeCalculado:
 *       type: object
 *       properties:
 *         categoriaId:
 *           type: integer
 *           example: 4
 *         puntaje:
 *           type: number
 *           example: 49.97
 *         cantidadPuntos:
 *           type: integer
 *           example: 1
 *         distanciaMinimaM:
 *           type: integer
 *           nullable: true
 *           example: 1084
 *     IndiceCalculado:
 *       type: object
 *       description: Resultado del cálculo recién guardado.
 *       properties:
 *         puntajeTotal:
 *           type: number
 *           example: 91.33
 *         nivelSemaforo:
 *           type: string
 *           enum: [verde, amarillo, rojo]
 *           example: verde
 *         radioM:
 *           type: integer
 *           example: 2000
 *         versionAlgoritmo:
 *           type: string
 *           example: v1.0
 *         subPuntajes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubPuntajeCalculado'
 *     ErrorGeoIndice:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: ID_INVALIDO
 *             message:
 *               type: string
 *               example: Id de propiedad inválido
 */

/**
 * @swagger
 * /v1/propiedades/{id}/indice:
 *   get:
 *     tags: [Geo-Índice]
 *     summary: Obtiene el Índice de Conveniencia vigente de una propiedad
 *     description: >
 *       Devuelve el índice ya calculado, con su semáforo, el desglose por categoría y los
 *       lugares más cercanos. Solo lee de la base de datos (no consulta a Google) y es público:
 *       no requiere sesión. El índice se calcula solo cuando la propiedad se publica o cambia
 *       su ubicación. Mientras no exista, responde `en_calculo`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Id de la propiedad.
 *         example: 5
 *     responses:
 *       200:
 *         description: Índice vigente, o `en_calculo` si todavía no existe (también si la propiedad no existe).
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/IndiceConveniencia'
 *                 - $ref: '#/components/schemas/IndiceEnCalculo'
 *             examples:
 *               calculado:
 *                 summary: Índice ya calculado
 *                 value:
 *                   puntajeTotal: 91.33
 *                   nivelSemaforo: verde
 *                   radioM: 2000
 *                   versionAlgoritmo: v1.0
 *                   fechaCalculo: "2026-10-14T02:54:37.882Z"
 *                   subPuntajes:
 *                     - categoriaId: 1
 *                       categoria: educación
 *                       icono: school
 *                       peso: 0.2
 *                       puntaje: 100
 *                       cantidadPuntos: 36
 *                       distanciaMinimaM: 59
 *                   puntosInteres:
 *                     - categoriaId: 1
 *                       googlePlaceId: ChIJH517O2h1Yo8RgH9LVoR2How
 *                       nombre: Escuela Oficial Urbana De Niñas
 *                       latitud: 14.634842
 *                       longitud: -89.989427
 *                       distanciaM: 59
 *                       tiempoEstimadoMin: 1
 *               enCalculo:
 *                 summary: Aún sin índice
 *                 value:
 *                   estado: en_calculo
 *       400:
 *         description: El id no es un entero positivo.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGeoIndice'
 *             example:
 *               error:
 *                 code: ID_INVALIDO
 *                 message: Id de propiedad inválido
 */
router.get('/propiedades/:id/indice', controller.obtenerIndice);

/**
 * @swagger
 * /v1/propiedades/{id}/indice/recalcular:
 *   post:
 *     tags: [Geo-Índice]
 *     summary: "[Solo desarrollo] Calcula el índice de una propiedad al momento"
 *     description: >
 *       Endpoint de apoyo para pruebas: fuerza el cálculo sin pasar por el flujo de publicación
 *       y espera a que termine (unos segundos). **No existe cuando `NODE_ENV=production`.**
 *       No tiene autenticación y cada llamada hace unas 17 consultas a Google Places,
 *       por lo que consume cuota: usarlo con moderación.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Id de la propiedad.
 *         example: 5
 *     responses:
 *       200:
 *         description: Índice calculado y guardado como vigente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndiceCalculado'
 *       400:
 *         description: El id no es un entero positivo (`ID_INVALIDO`).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGeoIndice'
 *       404:
 *         description: No existe una propiedad con ese id (`PROPIEDAD_NO_ENCONTRADA`).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGeoIndice'
 *       422:
 *         description: La propiedad no tiene coordenadas, latitud y longitud en 0 (`SIN_COORDENADAS`).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGeoIndice'
 *       502:
 *         description: Google devolvió lugares con un formato que no se reconoce (`LUGARES_FORMATO_INVALIDO`).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorGeoIndice'
 *       500:
 *         description: Fallo al consultar Google u otro error interno (ver los logs del backend).
 */
// De apoyo para pruebas: fuerza el cálculo sin pasar por el flujo de publicación.
// Sin autenticación y con costo en Google: solo se registra fuera de producción.
if (process.env.NODE_ENV !== 'production') {
  router.post('/propiedades/:id/indice/recalcular', controller.recalcular);
}

module.exports = router;