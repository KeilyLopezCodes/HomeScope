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