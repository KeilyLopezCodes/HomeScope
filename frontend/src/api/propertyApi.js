const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Obtiene el token guardado en el localStorage
 */
const obtenerToken = () => localStorage.getItem('homescope_token');

/**
 * Envía la propiedad al backend 
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

// Mensajes claros para el usuario según el código HTTP 
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

// Mapeo de nombre de tipo (como se maneja en el catálogo) -> id que espera el backend
const TIPO_PROPIEDAD_ID = {
  Casa: 1,
  Apartamento: 2,
  Terreno: 3,
  'Local Comercial': 4,
  Oficina: 5,
};

/**
 * Busca propiedades publicadas con filtros combinados.
 * filtros: { texto, tipo, indiceMin, orden, pagina, limite }
 * Devuelve { propiedades, paginacion }
 */
export const obtenerPropiedades = async (filtros = {}) => {
  const params = new URLSearchParams();

  if (filtros.texto) params.set('q', filtros.texto);
  if (filtros.tipo && TIPO_PROPIEDAD_ID[filtros.tipo]) {
    params.set('tipo_propiedad_id', TIPO_PROPIEDAD_ID[filtros.tipo]);
  }
  if (filtros.indiceMin) params.set('indice_min', filtros.indiceMin);
  if (filtros.orden) params.set('orden', filtros.orden); // precio | precio_desc | fecha | fecha_asc | indice
  params.set('page', filtros.pagina || 1);
  params.set('limit', filtros.limite || 12);

  const respuesta = await pedir(
    `/properties?${params.toString()}`,
    {},
    'No se pudieron cargar las propiedades. Intenta de nuevo.'
  );

  return {
    propiedades: respuesta.data,
    paginacion: respuesta.pagination,
  };
};

/**
 * Saca la foto de portada de una propiedad (o la primera si ninguna está
 * marcada como portada, o null si no tiene fotos).
 */
export const obtenerFotoPortada = (propiedad) => {
  const fotos = propiedad.foto_propiedad;
  if (!fotos || fotos.length === 0) return null;
  return (fotos.find((f) => f.es_portada) ?? fotos[0]).url;
};

// --- Subida de fotos (T25 · Cloudinary) ---

export const subirFotos = (propiedadId, fotos, { onProgress } = {}) =>
  new Promise((resolve, reject) => {
    const token = obtenerToken();
    const form = new FormData();
    fotos.forEach((f) => form.append('fotos', f.file));
    const portada = fotos.findIndex((f) => f.esPortada);
    form.append('portada', portada >= 0 ? portada : 0);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/properties/${propiedadId}/fotos`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let json = {};
      try { json = JSON.parse(xhr.responseText); } catch { /* respuesta no JSON */ }
      if (xhr.status >= 200 && xhr.status < 300 && json.success !== false) resolve(json);
      else reject(new Error(json.message || 'No se pudieron subir las fotos'));
    };
    xhr.onerror = () => reject(new Error('No se pudo conectar con el servidor'));
    xhr.send(form);
  });