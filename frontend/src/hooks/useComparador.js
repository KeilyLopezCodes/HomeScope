// Hook para manejar la selección de propiedades a comparar (máximo 4).
// Persiste en localStorage y se sincroniza entre todos los componentes
// que lo usan al mismo tiempo, avisando con un evento cada vez que algo
// cambia. La bandera "sincronizando" evita que un componente reaccione
// a su propio aviso y se arme un ciclo infinito.

import { useCallback, useEffect, useRef, useState } from "react";

const CLAVE = "homescope_comparar";
const EVENTO = "homescope_comparar_cambio";
const MAX_COMPARAR = 4;

function leerComparar() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
}

export function useComparador() {
  const [seleccionados, setSeleccionados] = useState(leerComparar);
  const sincronizando = useRef(false);

  // Cuando ESTE componente cambia la selección, la guarda y avisa a los
  // demás. Si el cambio vino de un aviso de OTRO componente, no vuelve
  // a guardar ni a avisar (por eso existe la bandera).
  useEffect(() => {
    if (sincronizando.current) {
      sincronizando.current = false;
      return;
    }
    localStorage.setItem(CLAVE, JSON.stringify(seleccionados));
    // Esperamos un tick antes de avisar: si varias tarjetas se montan al
    // mismo tiempo, avisar de una vez puede chocar con el montaje de las
    // otras y React se queja con "Cannot update a component while
    // rendering a different component".
    const id = setTimeout(() => window.dispatchEvent(new Event(EVENTO)), 0);
    return () => clearTimeout(id);
  }, [seleccionados]);

  // Escucha los avisos de otros componentes y se sincroniza.
  useEffect(() => {
    function sincronizar() {
      sincronizando.current = true;
      setSeleccionados(leerComparar());
    }
    window.addEventListener(EVENTO, sincronizar);
    return () => window.removeEventListener(EVENTO, sincronizar);
  }, []);

  const estaSeleccionado = useCallback(
    (id) => seleccionados.includes(id),
    [seleccionados]
  );

  const toggleComparar = useCallback((id) => {
    setSeleccionados((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= MAX_COMPARAR) return prev; 
      return [...prev, id];
    });
  }, []);

  const limpiarComparar = useCallback(() => {
    setSeleccionados([]);
  }, []);

  return {
    seleccionados,
    estaSeleccionado,
    toggleComparar,
    limpiarComparar,
    MAX_COMPARAR,
  };
}