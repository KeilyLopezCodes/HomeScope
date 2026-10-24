const { crearGeoIndiceService, limitarPuntosPorCategoria } = require('../src/services/geo-indice.service');

const CATS = [
  { categoriaId: 1, peso: 0.2, activa: true, googlePlaceTypes: ['school'] },
  { categoriaId: 6, peso: 0.1, activa: true, googlePlaceTypes: ['police'] },
];
const UBIC = { id: 7, latitud: 14.63, longitud: -89.98 };

function crear({ lugares, falla } = {}) {
  const guardados = [];
  const repo = {
    findPropertyLocation: async () => UBIC,
    findActiveCategories: async () => CATS,
    saveCurrentIndex: async (arg) => guardados.push(arg),
    findCurrentByPropertyId: async () => null,
  };
  const buscarLugaresCercanos = async ({ tipos }) => {
    if (falla) throw new Error('Google caído');
    return lugares[tipos[0]] || [];
  };
  return { svc: crearGeoIndiceService({ repo, buscarLugaresCercanos }), guardados };
}

describe('geo-indice.service', () => {
  test('calcula y guarda índice con puntos dentro del radio', async () => {
    const { svc, guardados } = crear({
      lugares: { school: [{ googlePlaceId: 'a', nombre: 'Escuela', latitud: 14.6305, longitud: -89.98 }] },
    });
    const r = await svc.calcularYGuardar(7);
    expect(guardados).toHaveLength(1);
    expect(guardados[0].puntos).toHaveLength(1);
    expect(r.subPuntajes.find((s) => s.categoriaId === 1).cantidadPuntos).toBe(1);
    expect(r.subPuntajes.find((s) => s.categoriaId === 6).cantidadPuntos).toBe(0);
  });

  test('descarta lugares fuera de 2 km', async () => {
    const { svc, guardados } = crear({
      lugares: { school: [{ googlePlaceId: 'lejos', nombre: 'Lejos', latitud: 14.7, longitud: -89.98 }] },
    });
    await svc.calcularYGuardar(7);
    expect(guardados[0].puntos).toHaveLength(0);
  });

  test('si Google falla NO guarda nada', async () => {
    const { svc, guardados } = crear({ falla: true });
    let error = null;
    try { await svc.calcularYGuardar(7); } catch (e) { error = e; }
    expect(error === null).toBe(false);
    expect(guardados).toHaveLength(0);
  });

  test('acepta el id como string (viene de req.params)', async () => {
    const { svc, guardados } = crear({ lugares: {} });
    await svc.calcularYGuardar('7');
    expect(guardados[0].propiedadId).toBe(7);
  });

  test('propiedad con coordenadas 0,0 no se calcula (422)', async () => {
    const guardados = [];
    const repo = {
      findPropertyLocation: async () => ({ id: 7, latitud: 0, longitud: 0 }),
      findActiveCategories: async () => CATS,
      saveCurrentIndex: async (a) => guardados.push(a),
      findCurrentByPropertyId: async () => null,
    };
    const svc = crearGeoIndiceService({ repo, buscarLugaresCercanos: async () => [] });
    let error = null;
    try { await svc.calcularYGuardar(7); } catch (e) { error = e; }
    expect(error.status).toBe(422);
    expect(error.code).toBe('SIN_COORDENADAS');
    expect(guardados).toHaveLength(0);
  });

  test('acepta el formato crudo de Google (place_id, name, geometry)', async () => {
    const { svc, guardados } = crear({
      lugares: { school: [{ place_id: 'g1', name: 'Escuela Raw', geometry: { location: { lat: 14.6305, lng: -89.98 } } }] },
    });
    await svc.calcularYGuardar(7);
    expect(guardados[0].puntos).toHaveLength(1);
    expect(guardados[0].puntos[0].googlePlaceId).toBe('g1');
    expect(guardados[0].puntos[0].nombre).toBe('Escuela Raw');
  });

  test('si los lugares no tienen formato reconocible falla (502) y no guarda', async () => {
    const { svc, guardados } = crear({ lugares: { school: [{ algo: 'raro' }] } });
    let error = null;
    try { await svc.calcularYGuardar(7); } catch (e) { error = e; }
    expect(error.status).toBe(502);
    expect(error.code).toBe('LUGARES_FORMATO_INVALIDO');
    expect(guardados).toHaveLength(0);
  });

  test('GET: devuelve solo los 5 lugares mas cercanos por categoria y conserva el total real', async () => {
    const puntos = [];
    for (let i = 0; i < 12; i++) puntos.push({ categoriaId: 1, googlePlaceId: 'e' + i, distanciaM: 1000 - i * 50 });
    for (let i = 0; i < 3; i++) puntos.push({ categoriaId: 2, googlePlaceId: 's' + i, distanciaM: 100 + i });
    const indiceCompleto = {
      puntajeTotal: 80,
      subPuntajes: [{ categoriaId: 1, cantidadPuntos: 12 }, { categoriaId: 2, cantidadPuntos: 3 }],
      puntosInteres: puntos,
    };
    const repo = { findCurrentByPropertyId: async () => indiceCompleto };
    const svc = crearGeoIndiceService({ repo, buscarLugaresCercanos: async () => [] });
    const r = await svc.obtenerVigente(7);
    const educ = r.puntosInteres.filter((p) => p.categoriaId === 1);
    expect(educ).toHaveLength(5);
    expect(educ[0].distanciaM).toBe(450); // el mas cercano (1000 - 11*50)
    expect(educ[4].distanciaM).toBe(650);
    expect(r.puntosInteres.filter((p) => p.categoriaId === 2)).toHaveLength(3);
    expect(r.subPuntajes[0].cantidadPuntos).toBe(12); // total real intacto
    expect(indiceCompleto.puntosInteres).toHaveLength(15); // no muta el original
  });

  test('GET: sin indice devuelve null', async () => {
    const repo = { findCurrentByPropertyId: async () => null };
    const svc = crearGeoIndiceService({ repo, buscarLugaresCercanos: async () => [] });
    const r = await svc.obtenerVigente(7);
    expect(r).toBeNull();
  });

  test('limitarPuntosPorCategoria ordena por distancia aunque lleguen desordenados', () => {
    const r = limitarPuntosPorCategoria([
      { categoriaId: 3, distanciaM: 900 }, { categoriaId: 3, distanciaM: 100 }, { categoriaId: 3, distanciaM: 500 },
    ], 2);
    expect(r.map((p) => p.distanciaM).join(',')).toBe('100,500');
  });
});