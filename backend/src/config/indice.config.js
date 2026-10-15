'use strict';

// Constantes del algoritmo del Índice de Conveniencia (v1.0).
// Cualquier cambio implica subir VERSION_ALGORITMO y recalcular (ver doc §9).
const VERSION_ALGORITMO = 'v1.0';

const RADIO_M = 2000;          // R: radio de análisis
const DISTANCIA_OPTIMA_M = 500; // D0
const ALFA = 0.6;              // peso de cercanía
const BETA = 0.4;              // peso de densidad (ALFA + BETA = 1)

// N_c por categoriaId (ids del seed: categoria_interes)
const CANTIDAD_OBJETIVO = {
  1: 3, // educación
  2: 2, // salud
  3: 5, // comercio
  4: 3, // transporte
  5: 2, // áreas verdes
  6: 1, // seguridad
};

const UMBRAL_VERDE = 70;
const UMBRAL_AMARILLO = 40;

const CAMINATA_M_POR_MIN = 80; 

const MAX_PUNTOS_POR_CATEGORIA_RESPUESTA = 5;

module.exports = {
  VERSION_ALGORITMO,
  RADIO_M,
  DISTANCIA_OPTIMA_M,
  ALFA,
  BETA,
  CANTIDAD_OBJETIVO,
  UMBRAL_VERDE,
  UMBRAL_AMARILLO,
  CAMINATA_M_POR_MIN,
  MAX_PUNTOS_POR_CATEGORIA_RESPUESTA,
};