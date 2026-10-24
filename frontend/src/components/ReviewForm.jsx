// Formulario para dejar una reseña/calificación AL VENDEDOR de una
// propiedad puntual (POST /reviews manda
// propiedad_id, el backend deduce solo quién es el dueño).
//
// El backend valida el "contacto previo" (visita agendada o mensaje
// enviado) él mismo y responde 403 si no se cumple, o 409 si ya la
// calificaste antes.

import { useState } from "react";
import { crearResena } from "../api/reviewApi";

export default function ReviewForm({ propiedadId, onResenaCreada }) {
  const [calificacion, setCalificacion] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (calificacion === 0 || comentario.trim() === "") return;

    setEnviando(true);
    setError("");
    try {
      const nueva = await crearResena(propiedadId, { calificacion, comentario });
      setCalificacion(0);
      setComentario("");
      setEnviado(true);
      setTimeout(() => setEnviado(false), 3000);
      onResenaCreada?.(nueva);
    } catch (err) {
      // Aquí llega el mensaje del backend: por ejemplo
      // "Solo puedes calificar al vendedor si agendaste una visita o lo
      // contactaste por esta propiedad" (403) o "Ya calificaste al
      // vendedor por esta propiedad" (409).
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="font-semibold text-sm text-[#222A33] mb-3">Deja tu reseña</h3>

      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => setCalificacion(valor)}
            onMouseEnter={() => setHover(valor)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${valor} estrellas`}
            className="text-2xl leading-none"
          >
            <span className={(hover || calificacion) >= valor ? "text-[#F2A93B]" : "text-gray-300"}>
              ★
            </span>
          </button>
        ))}
      </div>

      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        rows={3}
        placeholder="Cuéntanos cómo fue tu experiencia con el vendedor y la zona..."
        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4273]/30 focus:border-[#1E4273] mb-3"
      />

      <button
        type="submit"
        disabled={calificacion === 0 || comentario.trim() === "" || enviando}
        className="bg-[#1E4273] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#163156] disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {enviando ? "Enviando..." : "Enviar reseña"}
      </button>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      {enviado && (
        <p className="text-xs text-[#2E9E6B] mt-2">¡Gracias por tu reseña!</p>
      )}
    </form>
  );
}