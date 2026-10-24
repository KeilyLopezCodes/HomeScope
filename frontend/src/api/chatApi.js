const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const obtenerToken = () => localStorage.getItem('homescope_token');

const pedir = async (ruta, opciones = {}, mensajePorDefecto) => {
  const token = obtenerToken();
  let response;
  try {
    response = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error('Sin conexión con el servidor. Reintenta en un momento.');
  }
  let data = {};
  try { data = await response.json(); } catch { /* respuesta no JSON */ }
  if (!response.ok || data.success === false) {
    const esErrorCliente = response.status >= 400 && response.status < 500;
    throw new Error((esErrorCliente && data.message) || mensajePorDefecto);
  }
  return data.data;
};

export const iniciarConversacion = (propiedad_id, contenido) =>
  pedir('/conversaciones', { method: 'POST', body: JSON.stringify({ propiedad_id, contenido }) },
    'No se pudo abrir la conversación.');

export const listarConversaciones = () =>
  pedir('/conversaciones', {}, 'No se pudieron cargar tus conversaciones.');

export const obtenerConversacion = (id) =>
  pedir(`/conversaciones/${id}`, {}, 'No se pudo cargar la conversación.');

export const listarMensajes = (id, { antes, limite } = {}) => {
  const q = new URLSearchParams();
  if (antes) q.set('antes', antes);
  if (limite) q.set('limite', limite);
  const qs = q.toString();
  return pedir(`/conversaciones/${id}/mensajes${qs ? `?${qs}` : ''}`, {}, 'No se pudieron cargar los mensajes.');
};

export const enviarMensaje = (id, contenido) =>
  pedir(`/conversaciones/${id}/mensajes`, { method: 'POST', body: JSON.stringify({ contenido }) },
    'No se pudo enviar el mensaje.');