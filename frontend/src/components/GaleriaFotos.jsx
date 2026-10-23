import { useState } from "react";

// Galería de la ficha: foto grande con flechas, miniaturas debajo y teclado (← →).
// Recibe el arreglo "foto_propiedad" tal como lo manda el backend.
export default function GaleriaFotos({ fotos = [], titulo = "" }) {
  // La portada va primero; el resto sigue el orden que eligió el vendedor
  const ordenadas = [...fotos].sort((a, b) => {
    if (a.es_portada !== b.es_portada) return a.es_portada ? -1 : 1;
    return (a.orden ?? 0) - (b.orden ?? 0);
  });
  const [actual, setActual] = useState(0);

  if (ordenadas.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
        Esta propiedad aún no tiene fotos
      </div>
    );
  }

  const total = ordenadas.length;
  const ir = (i) => setActual((i + total) % total);

  return (
    <div className="space-y-2" aria-roledescription="carrusel" aria-label={`Fotos de ${titulo}`}>
      <div
        className="relative"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") ir(actual - 1);
          if (e.key === "ArrowRight") ir(actual + 1);
        }}
      >
        <img
          src={ordenadas[actual].url}
          alt={`${titulo} — foto ${actual + 1} de ${total}`}
          className="aspect-[16/9] w-full rounded-xl object-cover"
        />
        {total > 1 && (
          <>
            <button type="button" onClick={() => ir(actual - 1)} aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg shadow hover:bg-white">‹</button>
            <button type="button" onClick={() => ir(actual + 1)} aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg shadow hover:bg-white">›</button>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              {actual + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {ordenadas.map((f, i) => (
            <li key={f.id ?? f.url} className="shrink-0">
              <button type="button" onClick={() => setActual(i)} aria-label={`Ver foto ${i + 1}`}
                aria-current={i === actual}
                className={`block overflow-hidden rounded-lg border-2 ${i === actual ? "border-[#1E4273]" : "border-transparent opacity-70 hover:opacity-100"}`}>
                <img src={f.url} alt="" className="h-16 w-24 object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}