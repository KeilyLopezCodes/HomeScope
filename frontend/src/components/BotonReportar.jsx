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
      <p className="text-xs text-gray-500">
        {enviado ? "✓ Reporte enviado. Gracias por avisarnos." : "Ya reportaste esta publicación."}
      </p>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-xs text-gray-500 underline hover:text-red-600"
      >
        Reportar publicación
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
      <p className="font-semibold text-[#222A33] mb-2">¿Por qué reportas esta publicación?</p>

      <select
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm mb-2"
      >
        <option value="">Selecciona un motivo...</option>
        {motivos.map((m) => (
          <option key={m.codigo} value={m.codigo}>
            {m.descripcion}
          </option>
        ))}
      </select>

      {necesitaDescripcion && (
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          placeholder="Cuéntanos qué pasó..."
          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm mb-2"
        />
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={enviando || !motivo || (necesitaDescripcion && descripcion.trim() === "")}
          className="bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {enviando ? "Enviando..." : "Enviar reporte"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-xs text-gray-500 hover:underline"
        >
          Cancelar
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </form>
  );
}