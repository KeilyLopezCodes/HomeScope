import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../context/AuthContext';
import { agregarFavorito, listarFavoritos, quitarFavorito, subirFavoritos } from '../api/favoritoApi';

/**
 * Favoritos: con sesión se guardan en el servidor (así cuentan en las estadísticas del vendedor);
 * sin sesión se quedan en este navegador. Al iniciar sesión, los guardados sin sesión se suben solos.
 * Mismo uso de siempre: const { favoritos, esFavorito, toggleFavorito } = useFavoritos();
 *
 * Es una sola lista compartida por todos los componentes (no una por tarjeta), para no repetir peticiones.
 */
const CLAVE = 'homescope_favoritos';
const CLAVE_TOKEN = 'homescope_token';

function leerLocal() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    return Array.isArray(guardado) ? guardado.map(Number).filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

let ids = leerLocal();
let tokenSincronizado = null;
const oyentes = new Set();

function publicar(nuevos) {
  ids = nuevos;
  try { localStorage.setItem(CLAVE, JSON.stringify(nuevos)); } catch { /* sin almacenamiento */ }
  oyentes.forEach((avisar) => avisar());
}
const suscribir = (avisar) => { oyentes.add(avisar); return () => oyentes.delete(avisar); };
const instantanea = () => ids;
const haySesion = () => { try { return Boolean(localStorage.getItem(CLAVE_TOKEN)); } catch { return false; } };

// Se ejecuta una sola vez por sesión iniciada, aunque haya muchos componentes usando el hook
async function sincronizar(token) {
  if (!token) {
    if (tokenSincronizado) { tokenSincronizado = null; publicar([]); } // cerró sesión: no dejar favoritos de esa cuenta
    return;
  }
  if (token === tokenSincronizado) return;
  tokenSincronizado = token;
  try {
    const delServidor = await listarFavoritos();
    const sinSubir = ids.filter((id) => !delServidor.includes(id));
    publicar(sinSubir.length ? await subirFavoritos(sinSubir) : delServidor);
  } catch {
    tokenSincronizado = null; // reintenta en la próxima carga; mientras tanto se usa la lista local
  }
}

async function alternar(id) {
  const antes = ids;
  const eraFavorito = antes.includes(id);
  publicar(eraFavorito ? antes.filter((f) => f !== id) : [...antes, id]);
  if (!haySesion()) return;
  try {
    await (eraFavorito ? quitarFavorito(id) : agregarFavorito(id));
  } catch {
    publicar(antes); // el servidor lo rechazó (p. ej. tu propia propiedad): se deshace
  }
}

export function useFavoritos() {
  const { token } = useAuth();
  const favoritos = useSyncExternalStore(suscribir, instantanea);

  useEffect(() => { sincronizar(token); }, [token]);

  const esFavorito = useCallback((id) => favoritos.includes(Number(id)), [favoritos]);
  const toggleFavorito = useCallback((id) => alternar(Number(id)), []);
  return { favoritos, esFavorito, toggleFavorito };
}