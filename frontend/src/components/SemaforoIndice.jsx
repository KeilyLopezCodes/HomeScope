import { useEffect, useState } from "react";
import { obtenerIndice, normalizarIndice } from "../api/indiceApi";
import { colorIndice, colorDeNivel, formatearDistancia } from "../utils/indice";
import { nombreCategoria } from "../utils/categorias";

const ETIQUETA_NIVEL = { verde: "Alto", amarillo: "Medio", rojo: "Bajo" };

const urlMapa = (l) =>
  `https://www.google.com/maps/search/?api=1&query=${l.latitud},${l.longitud}&query_place_id=${l.googlePlaceId}`;

// Índice de conveniencia tipo semáforo, con el detalle por categoría desplegable.
// Se carga solo a partir del id de la propiedad.
export default function SemaforoIndice({ propiedadId }) {
  const [indice, setIndice] = useState(undefined); // undefined = cargando, null = sin calcular
  const [error, setError] = useState("");
  const [abierta, setAbierta] = useState(null); // id de la categoría desplegada

  useEffect(() => {
    let activo = true;
    obtenerIndice(propiedadId)
      .then((d) => activo && setIndice(normalizarIndice(d)))
      .catch((e) => {
        if (!activo) return;
        if (e.status === 404) setIndice(null);
        else setError(e.message);
      });
    return () => { activo = false; };
  }, [propiedadId]);

  if (error) return <p className="text-sm text-[#222A33]/60">No se pudo cargar el índice de conveniencia.</p>;
  if (indice === undefined) return <p className="text-sm text-[#222A33]/60">Calculando índice…</p>;
  if (indice === null) return <p className="text-sm text-[#222A33]/60">El índice de esta propiedad aún no se ha calculado.</p>;

  const colorTotal = colorDeNivel(indice.nivel, indice.total);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full text-white"
          style={{ backgroundColor: colorTotal }}>
          <span className="text-2xl font-bold leading-none">{indice.total.toFixed(0)}</span>
          <span className="text-[10px] uppercase tracking-wide">de 100</span>
        </div>
        <div>
          <p className="font-semibold">Índice de conveniencia: {ETIQUETA_NIVEL[indice.nivel] ?? colorIndice(indice.total).label}</p>
          <p className="text-sm text-[#222A33]/60">
            Según los lugares de interés en un radio de {formatearDistancia(indice.radioM)} de la propiedad.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-[#222A33]/10 rounded-xl border border-[#222A33]/10">
        {indice.subPuntajes.map((s) => {
          const color = colorIndice(s.puntaje).bg;
          const desplegada = abierta === s.categoriaId;
          return (
            <li key={s.categoriaId}>
              <button type="button" onClick={() => setAbierta(desplegada ? null : s.categoriaId)}
                aria-expanded={desplegada}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#1E4273]/5">
                <span className="w-28 shrink-0 text-sm font-medium">{nombreCategoria(s.categoriaId, s.nombre)}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
                  <span className="block h-2 rounded-full" style={{ width: `${Math.min(s.puntaje, 100)}%`, backgroundColor: color }} />
                </span>
                <span className="w-9 shrink-0 text-right text-sm font-semibold" style={{ color }}>{s.puntaje.toFixed(0)}</span>
                <span className="w-24 shrink-0 text-right text-xs text-[#222A33]/60">
                  {s.cantidad} {s.cantidad === 1 ? "lugar" : "lugares"}
                </span>
                <span aria-hidden="true" className="text-[#222A33]/40">{desplegada ? "▲" : "▼"}</span>
              </button>

              {desplegada && (
                <div className="space-y-2 bg-gray-50 px-4 py-3 text-sm">
                  <p className="text-xs text-[#222A33]/60">
                    {s.peso !== null && <>Pesa {Math.round(s.peso * 100)}% del índice. </>}
                    {s.distanciaMinimaM !== null && <>El más cercano está a {formatearDistancia(s.distanciaMinimaM)}.</>}
                  </p>
                  {s.lugares.length === 0 ? (
                    <p className="text-[#222A33]/60">No se encontraron lugares de esta categoría dentro del radio.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {s.lugares.map((l) => (
                        <li key={l.googlePlaceId} className="flex items-baseline justify-between gap-3">
                          <a href={urlMapa(l)} target="_blank" rel="noopener noreferrer"
                            className="text-[#1E4273] hover:underline">{l.nombre}</a>
                          <span className="shrink-0 text-xs text-[#222A33]/60">
                            {formatearDistancia(l.distanciaM)} · {l.tiempoEstimadoMin} min
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.cantidad > s.lugares.length && (
                    <p className="text-xs text-[#222A33]/50">
                      Se muestran los {s.lugares.length} más cercanos de {s.cantidad} encontrados.
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}