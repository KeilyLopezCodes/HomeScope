// Botón "Reportar publicación" para la ficha de propiedad (HOM-15).
// al reportar, se confirma visualmente que se envió. no se puede reportar la misma publicación más
// de una vez por usuario.
import { useEffect, useState } from "react";
import { obtenerMotivosReporte, reportarPropiedad } from "../api/reportApi";

const CLAVE_REPORTADAS = "homescope_propiedades_reportadas";

function marcarComoReportada(propiedadId) {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_REPORTADAS) || "[]");
    if (!guardado.includes(propiedadId)) {
      localStorage.setItem(CLAVE_REPORTADAS, JSON.stringify([...guardado, propiedadId]));
    }
  } catch {
  }
}

function yaFueReportada(propiedadId) {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_REPORTADAS) || "[]");
    return guardado.includes(propiedadId);
  } catch {
    return false;
  }
}

const IconoBandera = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M5 21V4m0 0h11l-2 4 2 4H5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function BotonReportar({ propiedadId }) {
  const [abierto, setAbierto] = useState(false);
  const [motivos, setMotivos] = useState([]);
  const [motivo, setMotivo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [reportada, setReportada] = useState(() => yaFueReportada(propiedadId));

  useEffect(() => {
    if (!abierto || motivos.length > 0) return;
    obtenerMotivosReporte()
      .then(setMotivos)
      .catch((e) => setError(e.message));
  }, [abierto, motivos.length]);

  // Cerrar con la tecla Escape
  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => { if (e.key === "Escape") setAbierto(false); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  const necesitaDescripcion = motivo === "otro";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!motivo || (necesitaDescripcion && descripcion.trim() === "")) return;

    setEnviando(true);
    setError("");
    try {
      await reportarPropiedad(propiedadId, { motivo, descripcion: descripcion.trim() || undefined });
      marcarComoReportada(propiedadId);
      setReportada(true);
      setEnviado(true);
      setAbierto(false);
      setMotivo("");
      setDescripcion("");
    } catch (err) {
      if (err.status === 409) {
        marcarComoReportada(propiedadId);
        setReportada(true);
        setAbierto(false);
      } else {
        setError(err.message);
      }
    } finally {
      setEnviando(false);
    }
  }

  if (reportada) {
    return (
      <p
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
          enviado ? "bg-emerald-50 text-[#2E9E6B]" : "bg-gray-100 text-gray-600"
        }`}
        role="status"
      >
        <IconoBandera className="h-3.5 w-3.5" />
        {enviado ? "Reporte enviado. Gracias por avisarnos." : "Ya reportaste esta publicación."}
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      >
        <IconoBandera />
        Reportar publicación
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-reporte"
          onClick={(e) => { if (e.target === e.currentTarget) setAbierto(false); }}
        >
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <IconoBandera className="h-5 w-5" />
              </span>
              <div>
                <h2 id="titulo-reporte" className="text-base font-semibold text-[#222A33]">
                  ¿Por qué reportas esta publicación?
                </h2>
                <p className="text-xs text-gray-500">Nuestro equipo la revisará. Tu reporte es confidencial.</p>
              </div>
            </div>

            <div>
              <label htmlFor="motivo-reporte" className="mb-1 block text-sm font-medium text-[#222A33]">Motivo</label>
              <select
                id="motivo-reporte"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4273]"
              >
                <option value="">Selecciona un motivo...</option>
                {motivos.map((m) => (
                  <option key={m.codigo} value={m.codigo}>
                    {m.descripcion}
                  </option>
                ))}
              </select>
            </div>

            {necesitaDescripcion && (
              <div>
                <label htmlFor="detalle-reporte" className="mb-1 block text-sm font-medium text-[#222A33]">
                  Cuéntanos qué pasó
                </label>
                <textarea
                  id="detalle-reporte"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Describe el problema con la mayor claridad posible..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4273]"
                />
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando || !motivo || (necesitaDescripcion && descripcion.trim() === "")}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {enviando ? "Enviando..." : "Enviar reporte"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}