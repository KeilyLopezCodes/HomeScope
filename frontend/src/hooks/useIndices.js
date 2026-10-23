// Trae el índice detallado (con sub-puntajes) de varias propiedades a la vez.
import { useEffect, useState } from "react";
import { obtenerIndice, normalizarIndice } from "../api/indiceApi";

export function useIndices(ids) {
  const [indices, setIndices] = useState({}); // { [propiedadId]: indice | null }
  const clave = ids.join(",");

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      const resultados = await Promise.allSettled(ids.map((id) => obtenerIndice(id)));
      if (cancelado) return;
      const mapa = {};
      ids.forEach((id, i) => {
        mapa[id] = resultados[i].status === "fulfilled" ? normalizarIndice(resultados[i].value) : null;
      });
      setIndices(mapa);
    }
    if (ids.length > 0) cargar();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return indices;
}