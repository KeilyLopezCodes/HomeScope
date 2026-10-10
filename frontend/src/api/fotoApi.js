const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const subirFotos = (propiedadId, fotos, { onProgress } = {}) =>
  new Promise((resolve, reject) => {
    const token = localStorage.getItem('homescope_token');
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