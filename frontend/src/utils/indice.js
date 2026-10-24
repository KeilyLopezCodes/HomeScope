export function colorIndice(valor) {
  if (valor === null) return { bg: "#9CA3AF", label: "Sin calcular" };
  if (valor >= 80) return { bg: "#2E9E6B", label: "Alto" };
  if (valor >= 50) return { bg: "#F2A93B", label: "Medio" };
  return { bg: "#E0564B", label: "Bajo" };
}

export function obtenerIndiceVigente(propiedad) {
  const lista = propiedad.indice_conveniencia;
  if (!lista || lista.length === 0) return null;
  const vigente = lista.find((i) => i.es_vigente) ?? lista[0];
  const valor = vigente.puntaje_total ?? vigente.puntajeTotal;
  return valor !== undefined && valor !== null ? Number(valor) : null;
}

// 286 -> "286 m"   |   1845 -> "1.8 km"
export function formatearDistancia(metros) {
  if (metros === null || metros === undefined) return "";
  return metros < 1000 ? `${metros} m` : `${(metros / 1000).toFixed(1)} km`;
}

// El backend ya clasifica el nivel; si no viene, se deduce del puntaje
const COLOR_NIVEL = { verde: "#2E9E6B", amarillo: "#F2A93B", rojo: "#E0564B" };
export const colorDeNivel = (nivel, puntaje) => COLOR_NIVEL[nivel] ?? colorIndice(puntaje).bg;