import { pedir } from './pedir';

// Gestión de las publicaciones del propio vendedor
export const listarMisPropiedades = () => pedir('/properties/mine');
export const actualizarPropiedad = (id, datos) =>
  pedir(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
export const cambiarEstadoPropiedad = (id, estado) =>
  pedir(`/properties/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
export const eliminarPropiedad = (id) => pedir(`/properties/${id}`, { method: 'DELETE' });

// Fotos (la subida de fotos nuevas usa subirFotos de fotoApi.js)
export const eliminarFoto = (propiedadId, fotoId) =>
  pedir(`/properties/${propiedadId}/fotos/${fotoId}`, { method: 'DELETE' });
export const reordenarFotos = (propiedadId, ids, portadaId) =>
  pedir(`/properties/${propiedadId}/fotos/orden`, { method: 'PUT', body: JSON.stringify({ ids, portadaId }) });