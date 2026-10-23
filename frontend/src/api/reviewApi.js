const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const obtenerToken = () => localStorage.getItem('homescope_token');

const MENSAJES_HTTP = {
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  404: 'No se encontró lo que buscabas.',
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
        ...opciones.headers,
      },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
  }

  let data = {};
  try { data = await response.json(); } catch { /* respuesta no JSON */ }

  if (!response.ok || data.success === false) {
    // El backend manda mensajes claros para 400/403/404/409
    // (ej. "Solo puedes calificar al vendedor si agendaste una visita..."),

    const esErrorCliente = response.status >= 400 && response.status < 500;
    const mensaje = esErrorCliente ? data.message || MENSAJES_HTTP[response.status] : null;
    throw new Error(mensaje || mensajePorDefecto);
  }
  return data;
};

/**
 * Reseñas que ha recibido un vendedor (perfil del vendedor / ficha de propiedad).
 * Devuelve { vendedor, calificacion: { promedio, total, distribucion }, resenas, paginacion }
 */
export const obtenerResenasVendedor = async (vendedorId, { pagina = 1, limite = 10 } = {}) => {
  const params = new URLSearchParams({ page: pagina, limit: limite });
  const respuesta = await pedir(
    `/sellers/${vendedorId}/reviews?${params}`,
    {},
    'No se pudieron cargar las reseñas.'
  );
  return {
    vendedor: respuesta.vendedor,
    calificacion: respuesta.calificacion,
    resenas: respuesta.data,
    paginacion: respuesta.pagination,
  };
};

/**
 * Registra una calificación/comentario al vendedor de una propiedad.
 * El backend valida que haya habido contacto previo (visita o mensaje) y
 * que no la hayas calificado ya pq si no se puede, lanza un Error con el
 * motivo exacto que da el backend (403 o 409).
 */
export const crearResena = async (propiedadId, { calificacion, comentario }) => {
  const respuesta = await pedir(
    '/reviews',
    {
      method: 'POST',
      body: JSON.stringify({ propiedad_id: propiedadId, calificacion, comentario }),
    },
    'No se pudo enviar la reseña. Intenta de nuevo.'
  );
  return respuesta.data;
};