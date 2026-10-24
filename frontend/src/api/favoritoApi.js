import { pedir } from './pedir';

export const listarFavoritos = async () => (await pedir('/favoritos')).map(Number);
export const agregarFavorito = (id) => pedir(`/favoritos/${id}`, { method: 'PUT' });
export const quitarFavorito = (id) => pedir(`/favoritos/${id}`, { method: 'DELETE' });
export const subirFavoritos = async (ids) =>
  (await pedir('/favoritos/lote', { method: 'POST', body: JSON.stringify({ ids }) })).map(Number);