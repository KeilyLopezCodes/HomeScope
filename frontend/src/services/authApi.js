// Comunicación con el backend de auth.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa que el backend esté corriendo.');
  }

  const json = await res.json().catch(() => ({}));
  // El backenk va a responder con  { success, message, data }
  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Algo salió mal. Intenta de nuevo.');
  }
  return json;
}

export const registrar = (datos) =>
  request('/auth/register', { method: 'POST', body: datos });

export const iniciarSesion = (email, password) =>
  request('/auth/login', { method: 'POST', body: { email, password } });

export const pedirRecuperacion = (email) =>
  request('/auth/forgot-password', { method: 'POST', body: { email } });

export const cambiarPassword = (token, password) =>
  request('/auth/reset-password', { method: 'POST', body: { token, password } });

export const actualizarPerfil = (token, datos) =>
  request('/auth/profile', { method: 'PUT', token, body: datos });