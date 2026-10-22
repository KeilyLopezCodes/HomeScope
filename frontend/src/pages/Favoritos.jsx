import { useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import PropertyCard from "../components/PropertyCard";
import { mockPropiedades } from "../data/mockPropiedades";
import { useFavoritos } from "../hooks/useFavoritos";
import { useComparador } from "../hooks/useComparador";

export default function Favoritos() {
  const { favoritos } = useFavoritos();
  const { seleccionados } = useComparador();

  const propiedadesFavoritas = useMemo(
    () => mockPropiedades.filter((p) => favoritos.includes(p.id)),
    [favoritos]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-[#222A33] mb-1">Mis favoritos</h1>
        <p className="text-sm text-gray-500 mb-5">
          {propiedadesFavoritas.length} propiedades guardadas
        </p>

        {seleccionados.length >= 2 && (
          <div className="mb-5 flex items-center justify-between bg-[#1E4273]/5 border border-[#1E4273]/20 rounded-lg px-4 py-3">
            <span className="text-sm text-[#222A33]">
              {seleccionados.length} propiedades seleccionadas para comparar
            </span>
            <Link
              to="/comparador"
              className="bg-[#1E4273] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#163156]"
            >
              Ver comparación
            </Link>
          </div>
        )}

        {propiedadesFavoritas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {propiedadesFavoritas.map((propiedad) => (
              <PropertyCard key={propiedad.id} propiedad={propiedad} mostrarComparar />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500 text-sm">
            Todavía no tienes propiedades favoritas.{" "}
            <Link to="/catalogo" className="text-[#1E4273] underline">
              Ir al catálogo
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}