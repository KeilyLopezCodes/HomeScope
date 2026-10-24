import { Link } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import { useFavoritos } from "../hooks/useFavoritos";
import { usePropiedadesPorIds } from "../hooks/usePropiedadesPorIds";

export default function Favoritos() {
  const { favoritos } = useFavoritos();
  const { propiedades, noDisponibles, cargando, error } = usePropiedadesPorIds(favoritos);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-[#222A33] mb-1">Mis favoritos</h1>
      <p className="text-sm text-gray-500 mb-5">
        {favoritos.length === 0 ? "Aún no tienes favoritos." : `${favoritos.length} guardadas`}
      </p>

      {favoritos.length === 0 && (
        <div className="text-center py-16 text-sm text-gray-500">
          Toca el corazón en una propiedad para guardarla.{" "}
          <Link to="/" className="text-[#1E4273] underline">Ir al catálogo</Link>
        </div>
      )}

      {cargando && favoritos.length > 0 && <div className="text-center py-16 text-sm text-gray-500">Cargando favoritos...</div>}
      {!cargando && error && <div className="text-center py-16 text-sm text-red-500">{error}</div>}

      {!cargando && !error && noDisponibles > 0 && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {noDisponibles} propiedad(es) guardada(s) ya no están disponibles.
        </p>
      )}

      {!cargando && !error && propiedades.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {propiedades.map((p) => <PropertyCard key={p.id} propiedad={p} mostrarComparar />)}
        </div>
      )}
    </main>
  );
}