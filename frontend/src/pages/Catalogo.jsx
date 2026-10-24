import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import Pagination from "../components/Pagination";
import { obtenerPropiedades } from "../api/propertyApi";
import { useComparador } from "../hooks/useComparador";
import FormularioPublicacion from "../components/FormularioPublicacion";
import { useAuth } from "../context/AuthContext";

const POR_PAGINA = 9;

const filtroTipos = ["Todos", "Casa", "Apartamento", "Terreno", "Local Comercial", "Oficina"];
// El backend solo filtra por índice mínimo (indice_min), por eso no hay opción "Bajo".
const filtroIndice = [
  { label: "Todos", valor: "" },
  { label: "Medio o más (50+)", valor: "medio" },
  { label: "Alto (80+)", valor: "alto" },
];

export default function Catalogo() {
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [indice, setIndice] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [intento, setIntento] = useState(0); // sube con "Intentar de nuevo"
  const { estaAutenticado } = useAuth();
  const [publicando, setPublicando] = useState(false);
  const [propiedades, setPropiedades] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const { seleccionados } = useComparador();
  const temporizador = useRef(null);

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
    return () => { cancelado = true; };
  }, [busquedaDebounced, tipo, indice, paginaActual, intento]);

  function cerrarPublicacion() {
    setPublicando(false);
    setIntento((n) => n + 1);
  }
  function cambiarPagina(numero) {
    if (numero < 1 || numero > totalPaginas) return;
    setPaginaActual(numero);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function elegir(setter, valor) {
    setter(valor);
    setPaginaActual(1);
  }

  const chip = (activo) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border ${
      activo ? "bg-[#1E4273] text-white border-[#1E4273]" : "bg-white text-[#222A33] border-gray-300 hover:bg-gray-50"
    }`;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#222A33] mb-1">Catálogo de propiedades</h1>
          <p className="text-sm text-gray-500">
            {cargando ? "Buscando..." : `${totalItems} propiedades disponibles`}
          </p>
        </div>
        {estaAutenticado ? (
          <button type="button" onClick={() => setPublicando(true)}
            className="shrink-0 rounded-lg bg-[#1E4273] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            + Publicar
          </button>
        ) : (
          <Link to="/login" className="shrink-0 rounded-lg border border-[#1E4273] px-4 py-2 text-sm font-semibold text-[#1E4273]">
            Inicia sesión para publicar
          </Link>
        )}
      </div>

      <div className="mb-4">
        <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por zona, municipio o título..."
          className="w-full sm:w-96 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4273]/30 focus:border-[#1E4273]" />
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-gray-500 w-full mb-1">Tipo de propiedad</span>
          {filtroTipos.map((t) => (
            <button key={t} type="button" onClick={() => elegir(setTipo, t)} className={chip(tipo === t)}>{t}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-gray-500 w-full mb-1">Índice de conveniencia</span>
          {filtroIndice.map((f) => (
            <button key={f.label} type="button" onClick={() => elegir(setIndice, f.valor)} className={chip(indice === f.valor)}>{f.label}</button>
          ))}
        </div>
      </div>

      {cargando && <div className="text-center py-16 text-gray-500 text-sm">Cargando propiedades...</div>}

      {!cargando && error && (
        <div className="text-center py-16">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <button type="button" onClick={() => setIntento((n) => n + 1)} className="text-xs font-medium text-[#1E4273] underline">
            Intentar de nuevo
          </button>
        </div>
      )}

      {!cargando && !error && propiedades.length === 0 && (
        <div className="text-center py-16 text-gray-500 text-sm">No se encontraron propiedades con esos filtros.</div>
      )}

      {!cargando && !error && propiedades.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {propiedades.map((p) => (
              <PropertyCard key={p.id} propiedad={p} mostrarComparar />
            ))}
          </div>
          <Pagination paginaActual={paginaActual} totalPaginas={totalPaginas} onCambiarPagina={cambiarPagina} />
        </>
      )}

      {seleccionados.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-full bg-[#1E4273] px-5 py-2 text-sm text-white shadow-lg">
          <span>{seleccionados.length} para comparar</span>
          <Link to="/comparador" className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1E4273]">
            Ver comparación
          </Link>
        </div>
      )}
      {publicando && (
        <div role="dialog" aria-modal="true" aria-label="Publicar propiedad"
          className="fixed inset-0 z-30 overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto max-w-3xl rounded-xl bg-white p-4 sm:p-6">
            <div className="mb-3 flex justify-end">
              <button type="button" onClick={cerrarPublicacion}
                className="text-sm text-gray-500 hover:text-gray-800" aria-label="Cerrar">✕ Cerrar</button>
            </div>
            <FormularioPublicacion onCerrar={cerrarPublicacion} />
          </div>
        </div>
      )}
    </main>
  );
}