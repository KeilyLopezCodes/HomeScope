import { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import PropertyCard from "../components/PropertyCard";
import Pagination from "../components/Pagination";
import { obtenerPropiedades } from "../api/propertyApi";

const POR_PAGINA = 9;

const filtroTipos = ["Todos", "Casa", "Apartamento", "Terreno", "Local Comercial", "Oficina"];
const filtroIndice = [
  { label: "Todos", valor: "" },
  { label: "Alto", valor: "alto" },
  { label: "Medio", valor: "medio" },
  { label: "Bajo", valor: "bajo" },
];

export default function Catalogo() {
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [indice, setIndice] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const [propiedades, setPropiedades] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Para no mandar una petición en cada letra que escribe en el buscador,
  // esperamos 400ms después de que deja de teclear.
  const temporizador = useRef(null);
  const [busquedaDebounced, setBusquedaDebounced] = useState("");

  useEffect(() => {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      setBusquedaDebounced(busqueda);
      setPaginaActual(1);
    }, 400);
    return () => clearTimeout(temporizador.current);
  }, [busqueda]);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError("");
      try {
        const indiceMin = indice === "alto" ? 80 : indice === "medio" ? 50 : undefined;

        const { propiedades: data, paginacion } = await obtenerPropiedades({
          texto: busquedaDebounced,
          tipo: tipo === "Todos" ? "" : tipo,
          indiceMin,
          pagina: paginaActual,
          limite: POR_PAGINA,
        });

        if (cancelado) return;
        setPropiedades(data);
        setTotalPaginas(paginacion.totalPages || 1);
        setTotalItems(paginacion.totalItems || 0);
      } catch (err) {
        if (!cancelado) setError(err.message || "No se pudieron cargar las propiedades.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [busquedaDebounced, tipo, indice, paginaActual]);

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
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-[#222A33] mb-1">Catálogo de propiedades</h1>
        <p className="text-sm text-gray-500 mb-5">
          {cargando ? "Buscando..." : `${totalItems} propiedades disponibles`}
        </p>

        {/* Buscador */}
        <div className="mb-4">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
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

        {/* Estado: cargando */}
        {cargando && (
          <div className="text-center py-16 text-gray-500 text-sm">
            Cargando propiedades...
          </div>
        )}

        {/* Estado: error de conexión */}
        {!cargando && error && (
          <div className="text-center py-16">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button
              onClick={() => setPaginaActual((p) => p)}
              className="text-xs font-medium text-[#1E4273] underline"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Estado: sin resultados */}
        {!cargando && !error && propiedades.length === 0 && (
          <div className="text-center py-16 text-gray-500 text-sm">
            No se encontraron propiedades con esos filtros.
          </div>
        )}

        {/* Grid de tarjetas */}
        {!cargando && !error && propiedades.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {propiedades.map((propiedad) => (
              <PropertyCard key={propiedad.id} propiedad={propiedad} />
            ))}
          </div>
        )}

        {!cargando && !error && propiedades.length > 0 && (
          <Pagination
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onCambiarPagina={cambiarPagina}
          />
        )}
      </main>
    </div>
  );
}