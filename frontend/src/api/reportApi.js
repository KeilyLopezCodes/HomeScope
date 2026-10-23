const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const obtenerToken = () => localStorage.getItem('homescope_token');

const MENSAJES_HTTP = {
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  409: 'Ya tienes un reporte abierto sobre esta publicación.',
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
    const esErrorCliente = response.status >= 400 && response.status < 500;
    const mensaje = esErrorCliente
      ? MENSAJES_HTTP[response.status] || data.message
      : null;
    const error = new Error(mensaje || mensajePorDefecto);
    error.status = response.status;
    throw error;
  }
  return data;
};

/** Lista de motivos válidos para reportar: [{ codigo, descripcion }] */
export const obtenerMotivosReporte = async () => {
  const respuesta = await pedir('/reportes/motivos', {}, 'No se pudieron cargar los motivos de reporte.');
  return respuesta.data;
};

/**
 * Reporta una propiedad. "motivo" debe ser uno de los códigos de
 * obtenerMotivosReporte(); si es "otro", descripcion es obligatoria.
 */
export const reportarPropiedad = async (propiedadId, { motivo, descripcion }) => {
  const respuesta = await pedir(
    `/properties/${propiedadId}/reportes`,
    { method: 'POST', body: JSON.stringify({ motivo, descripcion }) },
    'No se pudo enviar el reporte. Intenta de nuevo.'
  );
  return respuesta.data;
};