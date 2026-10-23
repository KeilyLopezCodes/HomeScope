// Muestra el promedio de calificación y la lista de comentarios recibidos
// por un VENDEDOR (GET /sellers/:id/reviews). Se usa en la ficha de propiedd

import { useEffect, useState } from "react";
import { obtenerResenasVendedor } from "../api/reviewApi";

function Estrellas({ valor }) {
  return (
    <span aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(valor) ? "text-[#F2A93B]" : "text-gray-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

const formatearFecha = (fecha) =>
  new Date(fecha).toLocaleDateString("es-GT", { dateStyle: "medium" });

export default function Resenas({ vendedorId, recargarCuando }) {
  const [calificacion, setCalificacion] = useState(null);
  const [resenas, setResenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!vendedorId) return;
    let activo = true;

    setCargando(true);
    setError("");
    obtenerResenasVendedor(vendedorId)
      .then(({ calificacion, resenas }) => {
        if (!activo) return;
        setCalificacion(calificacion);
        setResenas(resenas);
      })
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
    // "recargarCuando" cambia (por ejemplo al enviar una reseña nueva)
    // para volver a pedir la lista actualizada sin recargar la página.
  }, [vendedorId, recargarCuando]);

  if (cargando) {
    return <p className="text-sm text-gray-500">Cargando reseñas...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  const promedio = calificacion?.promedio ?? 0;
  const total = calificacion?.total ?? 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Estrellas valor={promedio} />
        <span className="text-sm font-semibold text-[#222A33]">
          {promedio > 0 ? promedio.toFixed(1) : "Sin calificar"}
        </span>
        <span className="text-xs text-gray-500">
          ({total} {total === 1 ? "reseña" : "reseñas"})
        </span>
      </div>

      {resenas.length === 0 ? (
        <p className="text-sm text-gray-500">Todavía no hay reseñas para este vendedor.</p>
      ) : (
        <ul className="space-y-4">
          {resenas.map((r) => (
            <li key={r.id} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="text-sm font-medium text-[#222A33]">{r.comprador?.nombre}</span>
                <Estrellas valor={r.calificacion} />
              </div>
              <p className="text-sm text-gray-600">{r.comentario}</p>
              <p className="text-xs text-gray-400 mt-1">
                {r.propiedad?.titulo} · {formatearFecha(r.fecha_creacion)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}