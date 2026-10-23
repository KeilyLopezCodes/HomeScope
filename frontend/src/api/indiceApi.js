// El índice de conveniencia vive bajo /api/v1 (a diferencia del resto de rutas, que están bajo /api)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_V1 = `${API_URL.replace(/\/api\/?$/, '')}/api/v1`;

export async function obtenerIndice(propiedadId) {
  const res = await fetch(`${API_V1}/propiedades/${propiedadId}/indice`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.message || `No se pudo obtener el índice (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return json.data ?? json;
}

// Normaliza la respuesta del backend a un objeto cómodo para la interfaz
export function normalizarIndice(i) {
  if (!i) return null;
  const lugares = i.puntosInteres ?? [];
  return {
    total: Number(i.puntajeTotal),
    nivel: i.nivelSemaforo ?? null,
    radioM: i.radioM ?? null,
    fechaCalculo: i.fechaCalculo ?? null,
    subPuntajes: (i.subPuntajes ?? []).map((s) => ({
      categoriaId: s.categoriaId,
      nombre: s.categoria ?? null,
      peso: s.peso ?? null,
      puntaje: Number(s.puntaje),
      cantidad: s.cantidadPuntos ?? 0,
      distanciaMinimaM: s.distanciaMinimaM ?? null,
      lugares: lugares.filter((l) => l.categoriaId === s.categoriaId),
    })),
  };
}