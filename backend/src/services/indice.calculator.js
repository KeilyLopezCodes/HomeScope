const {
  VERSION_ALGORITMO,
  RADIO_M,
  DISTANCIA_OPTIMA_M,
  ALFA,
  BETA,
  CANTIDAD_OBJETIVO,
  UMBRAL_VERDE,
  UMBRAL_AMARILLO,
  CAMINATA_M_POR_MIN,
} = require('../config/indice.config');

const redondear2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

function nivelSemaforo(puntaje) {
  if (puntaje >= UMBRAL_VERDE) return 'verde';
  if (puntaje >= UMBRAL_AMARILLO) return 'amarillo';
  return 'rojo';
}

/**tiempo_estimado_min: informativo, no entra en la fórmula. */
function tiempoEstimadoMin(distanciaM) {
  return Math.ceil(distanciaM / CAMINATA_M_POR_MIN);
}

/**
 * @param {Array<{categoriaId:number, peso:number, activa:boolean}>} categorias
 * @param {Array<{categoriaId:number, googlePlaceId:string, distanciaM:number}>} puntos
 */
function calcularIndice(categorias, puntos) {
  const subPuntajes = [];
  let sumaPonderada = 0;
  let sumaPesos = 0;

  for (const cat of categorias) {
    if (cat.activa === false) continue;
    const peso = Number(cat.peso); 

    //Puntos de la categoría dentro de R, sin repetir google_place_id.
    const vistos = new Map();
    for (const p of puntos) {
      if (p.categoriaId !== cat.categoriaId) continue;
      if (!(p.distanciaM <= RADIO_M)) continue;
      const previo = vistos.get(p.googlePlaceId);
      if (previo === undefined || p.distanciaM < previo) {
        vistos.set(p.googlePlaceId, p.distanciaM);
      }
    }

    const n = vistos.size;
    let puntaje = 0;
    let distanciaMinimaM = null;

    if (n > 0) {
      distanciaMinimaM = Math.min(...vistos.values());
      const cercania =
        distanciaMinimaM <= DISTANCIA_OPTIMA_M
          ? 1
          : (RADIO_M - distanciaMinimaM) / (RADIO_M - DISTANCIA_OPTIMA_M);
      const nObjetivo = CANTIDAD_OBJETIVO[cat.categoriaId];
      const densidad = Math.min(1, n / nObjetivo);
      puntaje = redondear2(100 * (ALFA * cercania + BETA * densidad));
    }

    subPuntajes.push({
      categoriaId: cat.categoriaId,
      puntaje,
      cantidadPuntos: n,
      distanciaMinimaM,
    });
    sumaPonderada += peso * puntaje;
    sumaPesos += peso;
  }

  const puntajeTotal = sumaPesos > 0 ? redondear2(sumaPonderada / sumaPesos) : 0;

  return {
    puntajeTotal,
    nivelSemaforo: nivelSemaforo(puntajeTotal), 
    radioM: RADIO_M,
    versionAlgoritmo: VERSION_ALGORITMO,
    subPuntajes,
  };
}

module.exports = { calcularIndice, nivelSemaforo, tiempoEstimadoMin };