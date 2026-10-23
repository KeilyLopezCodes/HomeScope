import { useEffect, useState } from "react";
import { obtenerPropiedad } from "../api/propertyApi";

export function usePropiedadesPorIds(ids) {
  const [propiedades, setPropiedades] = useState([]);
  const [noDisponibles, setNoDisponibles] = useState(0);
  const [cargando, setCargando] = useState(ids.length > 0);
  const [error, setError] = useState("");
  const clave = ids.join(",");

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      if (ids.length === 0) {
        setPropiedades([]); setNoDisponibles(0); setCargando(false);
        return;
      }
      setCargando(true);
      setError("");
      const resultados = await Promise.allSettled(ids.map((id) => obtenerPropiedad(id)));
      if (cancelado) return;
      const encontradas = resultados.filter((r) => r.status === "fulfilled").map((r) => r.value);
      const fallidas = resultados.filter((r) => r.status === "rejected");
      setPropiedades(encontradas);
      setNoDisponibles(fallidas.length);
      if (encontradas.length === 0 && fallidas.length > 0) {
        setError(fallidas[0].reason?.message || "No se pudieron cargar las propiedades.");
      }
      setCargando(false);
    }
    cargar();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return { propiedades, noDisponibles, cargando, error };
}