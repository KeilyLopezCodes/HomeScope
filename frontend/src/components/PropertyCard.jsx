import { useFavoritos } from "../hooks/useFavoritos";
import { useComparador } from "../hooks/useComparador";
import { obtenerFotoPortada } from "../api/propertyApi";

function colorIndice(valor) {
  if (valor === null) return { bg: "#9CA3AF", label: "Sin calcular" };
  if (valor >= 80) return { bg: "#2E9E6B", label: "Alto" };
  if (valor >= 50) return { bg: "#F2A93B", label: "Medio" };
  return { bg: "#E0564B", label: "Bajo" };
}

// El backend manda el índice dentro de un arreglo "indice_conveniencia"
function obtenerIndiceVigente(propiedad) {
  const lista = propiedad.indice_conveniencia;
  if (!lista || lista.length === 0) return null;
  const vigente = lista.find((i) => i.es_vigente) ?? lista[0];
  const valor = vigente.puntaje_total ?? vigente.puntajeTotal;
  return valor !== undefined && valor !== null ? Number(valor) : null;
}

export default function PropertyCard({ propiedad, mostrarComparar = false }) {
  const { id, titulo, precio, moneda, zona, municipio } = propiedad;
  const foto = obtenerFotoPortada(propiedad);
  const indice = obtenerIndiceVigente(propiedad);
  const badge = colorIndice(indice);

  const { esFavorito, toggleFavorito } = useFavoritos();
  const { estaSeleccionado, toggleComparar, seleccionados, MAX_COMPARAR } = useComparador();

  const favorito = esFavorito(id);
  const enComparador = estaSeleccionado(id);
  const comparadorLleno = seleccionados.length >= MAX_COMPARAR && !enComparador;

  return (
    <article className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="relative">
        {foto ? (
          <img src={foto} alt={titulo} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
            Sin foto disponible
          </div>
        )}

        <span
          className="absolute top-2 right-2 text-xs font-semibold text-white px-2 py-1 rounded-full"
          style={{ backgroundColor: badge.bg }}
        >
          {indice !== null ? `Índice ${indice.toFixed(0)}` : badge.label}
        </span>

        <button
          type="button"
          onClick={() => toggleFavorito(id)}
          aria-label={favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow text-lg"
        >
          <span className={favorito ? "text-red-500" : "text-gray-400"}>
            {favorito ? "♥" : "♡"}
          </span>
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-[#222A33] text-sm mb-1 line-clamp-1">{titulo}</h3>
        <p className="text-xs text-gray-500 mb-3">{zona}, {municipio}</p>
        <p className="text-lg font-bold text-[#1E4273] mb-3">
          {moneda}{Number(precio).toLocaleString("es-GT")}
        </p>

        {mostrarComparar && (
          <label
            className={`mt-auto flex items-center gap-2 text-xs ${
              comparadorLleno ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <input
              type="checkbox"
              checked={enComparador}
              disabled={comparadorLleno}
              onChange={() => toggleComparar(id)}
              className="rounded border-gray-300 text-[#1E4273] focus:ring-[#1E4273]"
            />
            Comparar
          </label>
        )}
      </div>
    </article>
  );
}