const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Obtiene el token guardado en el localStorage
 */
const obtenerToken = () => localStorage.getItem('homescope_token');

/**
 * Envía la propiedad al backend (Soporta JSON o FormData para fotografías)
 */
export const publicarPropiedad = async (datos) => {
  const token = obtenerToken();

  const response = await fetch(`${API_URL}/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(datos)
  });

  const data = await response.json();

  if (!response.ok || (data.success !== undefined && !data.success)) {
    throw new Error(data.message || 'Error al publicar la propiedad');
  }

  return data;
};

// Mensajes claros para el usuario según el código HTTP (el backend puede devolver textos técnicos en 500)
const MENSAJES_HTTP = {
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para modificar esta propiedad.',
  404: 'La propiedad no existe o fue eliminada.',
};

const pedir = async (ruta, opciones = {}, mensajePorDefecto) => {
  const token = obtenerToken();
  let response;
  try {
    response = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opciones.headers
      }
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
  }

  let data = {};
  try { data = await response.json(); } catch { /* respuesta no JSON */ }

  if (!response.ok || data.success === false) {
    // 4xx: el backend explica el motivo; 5xx: mensaje genérico (puede traer detalles técnicos)
    const esErrorCliente = response.status >= 400 && response.status < 500;
    const mensaje = esErrorCliente ? data.message || MENSAJES_HTTP[response.status] : null;
    throw new Error(mensaje || mensajePorDefecto);
  }
  return data;
};

export const obtenerPropiedad = async (id) =>
  (await pedir(`/properties/${id}`, {}, 'No se pudo cargar la propiedad.')).data;

export const obtenerHistorialPrecio = async (id) =>
  (await pedir(`/properties/${id}/history`, {}, 'No se pudo cargar el historial de precios.')).data;

export const actualizarPrecio = async (id, precio) =>
  (await pedir(
    `/properties/${id}`,
    { method: 'PUT', body: JSON.stringify({ precio }) },
    'No se pudo guardar el nuevo precio. Intenta de nuevo.'
  )).data;