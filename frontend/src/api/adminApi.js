const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, { token, method = 'GET', body, query } = {}) {
  const url = new URL(`${API_URL}/admin${path}`);
  if (query) {
    Object.entries(query).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(clave, valor);
    });
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const error = new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    error.status = 0;
    throw error;
  }

  let json = {};
  try {
    json = await res.json();
  } catch {
    // respuesta sin cuerpo JSON
  }

  if (!res.ok || json.success === false) {
    const error = new Error(json.message || `Error ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return json;
}

/* ───────────── Reportes ───────────── */

// filtros: { estado, tipo, page, limit }
export const listarReportes = (token, filtros = {}) =>
  request('/reportes', { token, query: filtros });

export const obtenerReporte = (token, id) =>
  request(`/reportes/${id}`, { token });

// estado: 'en_revision' | 'resuelto' | 'descartado'
export const cambiarEstadoReporte = (token, id, { estado, motivo }) =>
  request(`/reportes/${id}`, { token, method: 'PATCH', body: { estado, motivo } });

/* ───────────── Propiedades ───────────── */

// accion: 'pausar' | 'aprobar'. reporte_id solo se permite con 'pausar'.
export const moderarPropiedad = (token, id, { accion, motivo, reporte_id }) =>
  request(`/propiedades/${id}/estado`, {
    token, method: 'PATCH', body: { accion, motivo, ...(reporte_id ? { reporte_id } : {}) },
  });

// Borrado lógico: la propiedad pasa a no_disponible.
export const eliminarPropiedad = (token, id, { motivo, reporte_id }) =>
  request(`/propiedades/${id}`, {
    token, method: 'DELETE', body: { motivo, ...(reporte_id ? { reporte_id } : {}) },
  });

/* ───────────── Usuarios ───────────── */

// filtros: { estado, q, page, limit }
export const listarUsuarios = (token, filtros = {}) =>
  request('/usuarios', { token, query: filtros });

// accion: 'suspender' | 'reactivar'. reporte_id solo se permite con 'suspender'.
export const moderarUsuario = (token, id, { accion, motivo, reporte_id }) =>
  request(`/usuarios/${id}/estado`, {
    token, method: 'PATCH', body: { accion, motivo, ...(reporte_id ? { reporte_id } : {}) },
  });

/* ───────────── Auditoría ───────────── */

// filtros: { administrador_id, accion, reporte_id, propiedad_id, usuario_id, page, limit }
export const listarAcciones = (token, filtros = {}) =>
  request('/acciones', { token, query: filtros });