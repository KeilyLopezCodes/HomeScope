// Hook para guardar/quitar propiedades favoritas.
// Mismo patrón que useComparador: persiste en localStorage y se
// sincroniza entre componentes sin caer en un ciclo infinito.

import { useCallback, useEffect, useRef, useState } from "react";

const CLAVE = "homescope_favoritos";
const EVENTO = "homescope_favoritos_cambio";

function leerFavoritos() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
}

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState(leerFavoritos);
  const sincronizando = useRef(false);

  useEffect(() => {
    if (sincronizando.current) {
      sincronizando.current = false;
      return;
    }
    localStorage.setItem(CLAVE, JSON.stringify(favoritos));
    // Esperamos un tick antes de avisarle a las demás tarjetas: si varias
    // se montan al mismo tiempo (como en el catálogo), disparar el evento
    // de una vez puede chocar con el montaje de las otras y React se queja
    // con "Cannot update a component while rendering a different component".
    const id = setTimeout(() => window.dispatchEvent(new Event(EVENTO)), 0);
    return () => clearTimeout(id);
  }, [favoritos]);

  useEffect(() => {
    function sincronizar() {
      sincronizando.current = true;
      setFavoritos(leerFavoritos());
    }
    window.addEventListener(EVENTO, sincronizar);
    return () => window.removeEventListener(EVENTO, sincronizar);
  }, []);

  const esFavorito = useCallback(
    (id) => favoritos.includes(id),
    [favoritos]
  );

  const toggleFavorito = useCallback((id) => {
    setFavoritos((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }, []);

  return { favoritos, esFavorito, toggleFavorito };
}