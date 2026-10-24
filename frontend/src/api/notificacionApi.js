const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function pedir(ruta, opciones = {}) {
  const token = localStorage.getItem('homescope_token');
  const res = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.message || datos.error || 'No se pudo completar la acción.');
  return datos;
}

export const listarNotificaciones = (pagina = 1) => pedir(`/notificaciones?page=${pagina}&limit=20`);
export const contarNoLeidas = () => pedir('/notificaciones/no-leidas/contar');
export const marcarLeida = (id) => pedir(`/notificaciones/${id}/leer`, { method: 'PATCH' });
export const marcarTodasLeidas = () => pedir('/notificaciones/leer-todas', { method: 'PATCH' });