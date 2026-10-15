const { calcularIndice, tiempoEstimadoMin } = require('./indice.calculator');
const { distanciaHaversineM } = require('./haversine');
const { RADIO_M, MAX_PUNTOS_POR_CATEGORIA_RESPUESTA } = require('../config/indice.config');

function normalizarLugar(l) {
  if (!l) return null;
  const googlePlaceId = l.googlePlaceId ?? l.google_place_id ?? l.place_id;
  const nombre = l.nombre ?? l.name;
  const latitud = Number(l.latitud ?? l.lat ?? (l.geometry && l.geometry.location && l.geometry.location.lat));
  const longitud = Number(l.longitud ?? l.lng ?? (l.geometry && l.geometry.location && l.geometry.location.lng));
  if (!googlePlaceId || !Number.isFinite(latitud) || !Number.isFinite(longitud)) return null;
  return { googlePlaceId: String(googlePlaceId), nombre: nombre ? String(nombre) : 'Sin nombre', latitud, longitud };
}

function limitarPuntosPorCategoria(puntos, max) {
  const porCategoria = new Map();
  for (const p of puntos || []) {
    if (!porCategoria.has(p.categoriaId)) porCategoria.set(p.categoriaId, []);
    porCategoria.get(p.categoriaId).push(p);
  }
  const resultado = [];
  for (const [categoriaId, lista] of [...porCategoria.entries()].sort((a, b) => a[0] - b[0])) {
    lista.sort((a, b) => a.distanciaM - b.distanciaM);
    resultado.push(...lista.slice(0, max));
  }
  return resultado;
}

/**
 * @param {{ repo: object, buscarLugaresCercanos: Function }} deps
 */
function crearGeoIndiceService({ repo, buscarLugaresCercanos }) {
  async function calcularYGuardar(propiedadIdEntrada) {
    // el id puede llegar como string desde req.params
    const propiedadId = Number(propiedadIdEntrada);
    if (!Number.isInteger(propiedadId) || propiedadId <= 0) {
      const e = new Error('Id de propiedad inválido');
      e.status = 400;
      e.code = 'ID_INVALIDO';
      throw e;
    }
    const ubic = await repo.findPropertyLocation(propiedadId);
    if (!ubic) {
      const e = new Error('Propiedad no encontrada');
      e.status = 404;
      e.code = 'PROPIEDAD_NO_ENCONTRADA';
      throw e;
    }

    if (ubic.latitud === 0 && ubic.longitud === 0) {
      const e = new Error('La propiedad no tiene coordenadas');
      e.status = 422;
      e.code = 'SIN_COORDENADAS';
      throw e;
    }
    const categorias = await repo.findActiveCategories();

    const puntos = [];
    for (const cat of categorias) {
      const lugares = await buscarLugaresCercanos({
        lat: ubic.latitud,
        lng: ubic.longitud,
        tipos: cat.googlePlaceTypes,
        radio: RADIO_M,
      });
      let validos = 0;
      for (const crudo of lugares) {
        const l = normalizarLugar(crudo);
        if (!l) continue;
        validos++;
        const distanciaM = Math.round(
          distanciaHaversineM(ubic.latitud, ubic.longitud, l.latitud, l.longitud)
        );
        if (distanciaM > RADIO_M) continue; 
        puntos.push({
          categoriaId: cat.categoriaId,
          googlePlaceId: l.googlePlaceId,
          nombre: l.nombre,
          latitud: l.latitud,
          longitud: l.longitud,
          distanciaM,
          tiempoEstimadoMin: tiempoEstimadoMin(distanciaM),
        });
      }

      if (lugares.length > 0 && validos === 0) {
        const e = new Error(`Los lugares de Google para la categoría "${cat.nombre || cat.categoriaId}" no tienen el formato esperado`);
        e.status = 502;
        e.code = 'LUGARES_FORMATO_INVALIDO';
        throw e;
      }
    }

    const resultado = calcularIndice(categorias, puntos);

    const vistos = new Set();
    const puntosUnicos = puntos.filter((p) => {
      const k = `${p.categoriaId}|${p.googlePlaceId}`;
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });

    await repo.saveCurrentIndex({ propiedadId, resultado, puntos: puntosUnicos });
    return resultado;
  }

  function encolarCalculo(propiedadId, { intentos = 3, baseMs = 2000 } = {}) {
    setImmediate(async () => {
      for (let i = 0; i < intentos; i++) {
        try {
          await calcularYGuardar(propiedadId);
          return;
        } catch (err) {
          console.error(`[geo-indice] intento ${i + 1}/${intentos} falló (propiedad ${propiedadId}):`, err.message);
          if (err.status) return; // error de datos (404, 422...): reintentar no lo arregla
          if (i < intentos - 1) await new Promise((r) => setTimeout(r, baseMs * 2 ** i));
        }
      }
    });
  }

  async function obtenerVigente(propiedadId) {
    const indice = await repo.findCurrentByPropertyId(propiedadId);
    if (!indice) return null;
    return {
      ...indice,
      puntosInteres: limitarPuntosPorCategoria(indice.puntosInteres, MAX_PUNTOS_POR_CATEGORIA_RESPUESTA),
    };
  }

  return { calcularYGuardar, encolarCalculo, obtenerVigente };
}

let instancia;
function real() {
  if (!instancia) {
    instancia = crearGeoIndiceService({
      repo: require('../repositories/geo-indice.repository'),
      buscarLugaresCercanos: require('./placesService').buscarLugaresCercanos,
    });
  }
  return instancia;
}

module.exports = {
  crearGeoIndiceService,
  limitarPuntosPorCategoria,
  calcularYGuardar: (id) => real().calcularYGuardar(id),
  encolarCalculo: (id, opts) => real().encolarCalculo(id, opts),
  obtenerVigente: (id) => real().obtenerVigente(id),
};