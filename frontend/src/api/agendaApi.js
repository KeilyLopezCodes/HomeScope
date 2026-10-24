import { pedir } from './pedir';

// Comprador
export const obtenerHorarios = (propiedadId, dias = 30) => pedir(`/visitas/horarios/${propiedadId}?dias=${dias}`);
export const solicitarVisita = (propiedad_id, fecha_hora, nota) =>
  pedir('/visitas', { method: 'POST', body: JSON.stringify({ propiedad_id, fecha_hora, ...(nota?.trim() ? { nota: nota.trim() } : {}) }) });
export const aceptarReprogramacion = (id) => pedir(`/visitas/${id}/aceptar`, { method: 'PATCH' });

// Ambos roles
export const misVisitas = () => pedir('/visitas');
export const cancelarVisita = (id) => pedir(`/visitas/${id}/cancelar`, { method: 'PATCH' });

// Vendedor
export const confirmarVisita = (id) => pedir(`/visitas/${id}/confirmar`, { method: 'PATCH' });
export const reprogramarVisita = (id, fecha_hora) =>
  pedir(`/visitas/${id}/reprogramar`, { method: 'PATCH', body: JSON.stringify({ fecha_hora }) });
export const obtenerMiDisponibilidad = () => pedir('/disponibilidad');
export const guardarDisponibilidad = (franjas, propiedad_id = null) =>
  pedir('/disponibilidad', { method: 'PUT', body: JSON.stringify({ propiedad_id, franjas }) });