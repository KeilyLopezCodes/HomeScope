'use strict';

const prisma = require('../config/db');
const IGeoIndiceRepository = require('../interfaces/IGeoIndice.repository');

class GeoIndiceRepository extends IGeoIndiceRepository {
  async findPropertyLocation(propiedadId) {
    const p = await prisma.propiedad.findUnique({
      where: { id: propiedadId },
      select: { id: true, latitud: true, longitud: true },
    });
    if (!p) return null;
    return { id: p.id, latitud: Number(p.latitud), longitud: Number(p.longitud) };
  }

  /** Categorías activas con el formato que espera calcularIndice (+ tipos de Google). */
  async findActiveCategories() {
    const filas = await prisma.categoria_interes.findMany({
      where: { activa: true },
      orderBy: { id: 'asc' },
    });
    return filas.map((c) => ({
      categoriaId: c.id,
      nombre: c.nombre,
      peso: Number(c.peso), 
      activa: c.activa,
      googlePlaceTypes: c.google_place_types.split(/[,|]/).map((s) => s.trim()).filter(Boolean),
    }));
  }

  
  async saveCurrentIndex({ propiedadId, resultado, puntos }) {
    return prisma.$transaction(async (tx) => {
      await tx.punto_interes.deleteMany({ where: { propiedad_id: propiedadId } });
      if (puntos.length > 0) {
        await tx.punto_interes.createMany({
          data: puntos.map((p) => ({
            propiedad_id: propiedadId,
            categoria_id: p.categoriaId,
            google_place_id: String(p.googlePlaceId).slice(0, 200),
            nombre: String(p.nombre).slice(0, 200),
            latitud: p.latitud,
            longitud: p.longitud,
            distancia_m: p.distanciaM,
            tiempo_estimado_min: p.tiempoEstimadoMin,
            radio_consulta_m: resultado.radioM,
          })),
        });
      }

      await tx.indice_conveniencia.updateMany({
        where: { propiedad_id: propiedadId, es_vigente: true },
        data: { es_vigente: false },
      });

      const nuevo = await tx.indice_conveniencia.create({
        data: {
          propiedad_id: propiedadId,
          puntaje_total: resultado.puntajeTotal,
          nivel_semaforo: resultado.nivelSemaforo,
          radio_m: resultado.radioM,
          version_algoritmo: resultado.versionAlgoritmo,
          es_vigente: true,
          sub_puntaje_categoria: {
            create: resultado.subPuntajes.map((s) => ({
              categoria_id: s.categoriaId,
              puntaje: s.puntaje,
              cantidad_puntos: s.cantidadPuntos,
              distancia_minima_m: s.distanciaMinimaM,
            })),
          },
        },
      });
      return nuevo.id;
    });
  }

  /** DTO listo para JSON */
  async findCurrentByPropertyId(propiedadId) {
    const indice = await prisma.indice_conveniencia.findFirst({
      where: { propiedad_id: propiedadId, es_vigente: true },
      include: {
        sub_puntaje_categoria: {
          include: { categoria_interes: { select: { nombre: true, icono: true, peso: true } } },
          orderBy: { categoria_id: 'asc' },
        },
      },
    });
    if (!indice) return null;

    const puntos = await prisma.punto_interes.findMany({
      where: { propiedad_id: propiedadId },
      orderBy: [{ categoria_id: 'asc' }, { distancia_m: 'asc' }],
    });

    return {
      puntajeTotal: Number(indice.puntaje_total),
      nivelSemaforo: indice.nivel_semaforo,
      radioM: indice.radio_m,
      versionAlgoritmo: indice.version_algoritmo,
      fechaCalculo: indice.fecha_calculo,
      subPuntajes: indice.sub_puntaje_categoria.map((s) => ({
        categoriaId: s.categoria_id,
        categoria: s.categoria_interes.nombre,
        icono: s.categoria_interes.icono,
        peso: Number(s.categoria_interes.peso),
        puntaje: Number(s.puntaje),
        cantidadPuntos: s.cantidad_puntos,
        distanciaMinimaM: s.distancia_minima_m,
      })),
      puntosInteres: puntos.map((p) => ({
        categoriaId: p.categoria_id,
        googlePlaceId: p.google_place_id,
        nombre: p.nombre,
        latitud: Number(p.latitud),
        longitud: Number(p.longitud),
        distanciaM: p.distancia_m,
        tiempoEstimadoMin: p.tiempo_estimado_min,
      })),
    };
  }
}

module.exports = new GeoIndiceRepository();