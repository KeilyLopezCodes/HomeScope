import { pedir } from './pedir';

export const obtenerEstadisticas = (dias = 30) => pedir(`/panel-vendedor/estadisticas?dias=${dias}`);

// Registra una vista de la ficha (con o sin sesión). Nunca debe molestar al visitante: los errores se ignoran.
export async function registrarVista(propiedadId) {
  try {
    await pedir(`/vistas/${propiedadId}`, { method: 'POST' });
  } catch {
    /* secundario */
  }
}