import { useMemo, useState } from "react";
import PropertyCard from "../components/PropertyCard";
import Pagination from "../components/Pagination";
import { mockPropiedades } from "../data/mockPropiedades";
import logo from "../assets/logo.png";

const POR_PAGINA = 9;

const filtroTipos = ["Todos", "Casa", "Apartamento", "Terreno"];
const filtroIndice = [
  { label: "Todos", valor: "" },
  { label: "Alto", valor: "alto" },
  { label: "Medio", valor: "medio" },
  { label: "Bajo", valor: "bajo" },
];

function cumpleIndice(indice, filtro) {
  if (!filtro) return true;
  if (filtro === "alto") return indice >= 80;
  if (filtro === "medio") return indice >= 50 && indice < 80;
  return indice < 50;
}

export default function Catalogo() {
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [indice, setIndice] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const propiedadesFiltradas = useMemo(() => {
    return mockPropiedades.filter((p) => {
      const coincideBusqueda =
        busqueda.trim() === "" ||
        p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.zona.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.municipio.toLowerCase().includes(busqueda.toLowerCase());

      const coincideTipo = tipo === "Todos" || p.titulo.startsWith(tipo);
      const coincideIndice = cumpleIndice(p.indice, indice);

      return coincideBusqueda && coincideTipo && coincideIndice;
    });
  }, [busqueda, tipo, indice]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(propiedadesFiltradas.length / POR_PAGINA)
  );

  const propiedadesPagina = propiedadesFiltradas.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  function cambiarPagina(numero) {
    if (numero < 1 || numero > totalPaginas) return;
    setPaginaActual(numero);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFiltro(setter) {
    return (valor) => {
      setter(valor);
      setPaginaActual(1);
    };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="HomeScope" className="h-8 w-8" />
            <span className="text-lg font-bold text-[#1E4273]">HomeScope</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#222A33]">
            <a href="/" className="hover:text-[#1E4273]">Inicio</a>
            <a href="/catalogo" className="text-[#1E4273]">Catálogo</a>
            <a href="/publicar" className="hover:text-[#1E4273]">Publicar</a>
          </nav>
          <button className="bg-[#2E9E6B] text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90">Publicar propiedad</button>
          </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-[#222A33] mb-1">Catálogo de propiedades</h1>
        <p className="text-sm text-gray-500 mb-5">
          {propiedadesFiltradas.length} propiedades disponibles
        </p>

        {/* Buscador */}
        <div className="mb-4">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
            placeholder="Buscar por zona, municipio o título..."
            className="w-full sm:w-96 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4273]/30 focus:border-[#1E4273]"
          />
        </div>

        {/* Filtros (chips) */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-gray-500 w-full mb-1">Tipo de propiedad</span>
            {filtroTipos.map((t) => (
              <button
                key={t}
                onClick={() => handleFiltro(setTipo)(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  tipo === t
                    ? "bg-[#1E4273] text-white border-[#1E4273]"
                    : "bg-white text-[#222A33] border-gray-300 hover:bg-gray-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-gray-500 w-full mb-1">Índice de conveniencia</span>
            {filtroIndice.map((f) => (
              <button
                key={f.label}
                onClick={() => handleFiltro(setIndice)(f.valor)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  indice === f.valor
                    ? "bg-[#1E4273] text-white border-[#1E4273]"
                    : "bg-white text-[#222A33] border-gray-300 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de tarjetas */}
        {propiedadesPagina.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {propiedadesPagina.map((propiedad) => (
              <PropertyCard key={propiedad.id} propiedad={propiedad} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500 text-sm">
            No se encontraron propiedades con esos filtros.
          </div>
        )}

        <Pagination
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          onCambiarPagina={cambiarPagina}
        />
      </main>
    </div>
  );
}