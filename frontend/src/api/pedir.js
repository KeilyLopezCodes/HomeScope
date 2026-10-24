// Petición autenticada a la API (compartida por agendaApi y panelApi).
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function pedir(ruta, opciones = {}) {
  const token = localStorage.getItem('homescope_token');
  const res = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.message || `No se pudo completar la acción (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return json.data ?? json;
}