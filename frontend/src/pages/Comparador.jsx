import { Link } from "react-router-dom";
import { useComparador } from "../hooks/useComparador";
import { usePropiedadesPorIds } from "../hooks/usePropiedadesPorIds";
import { obtenerFotoPortada } from "../api/propertyApi";
import { formatearPrecio } from "../utils/formatoPrecio";
import { colorIndice, obtenerIndiceVigente, formatearDistancia } from "../utils/indice";
import { useIndices } from "../hooks/useIndices";
import { nombreCategoria } from "../utils/categorias";

export default function Comparador() {
  const { seleccionados, toggleComparar, limpiarComparar, MAX_COMPARAR } = useComparador();
  const { propiedades, noDisponibles, cargando, error } = usePropiedadesPorIds(seleccionados);
  const indices = useIndices(seleccionados);

  // Categorías presentes en al menos una propiedad (ordenadas por id)
  const categorias = [...new Map(
    propiedades.flatMap((p) => indices[p.id]?.subPuntajes ?? []).map((s) => [s.categoriaId, s])
  ).values()].sort((a, b) => a.categoriaId - b.categoriaId);

  if (seleccionados.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-[#222A33] mb-2">Comparador</h1>
        <p className="text-sm text-gray-500 mb-4">
          No has seleccionado propiedades. Marca "Comparar" en el catálogo o en favoritos (hasta {MAX_COMPARAR}).
        </p>
        <Link to="/" className="text-[#1E4273] underline text-sm">Ir al catálogo</Link>
      </main>
    );
  }

  if (cargando) return <main className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-gray-500">Cargando comparación...</main>;
  if (error) return <main className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-red-500">{error}</main>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-[#222A33]">Comparar propiedades ({propiedades.length}/{MAX_COMPARAR})</h1>
        <button type="button" onClick={limpiarComparar} className="text-xs font-medium text-gray-500 hover:text-red-500">Quitar todas</button>
      </div>

      {noDisponibles > 0 && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {noDisponibles} propiedad(es) seleccionada(s) ya no están disponibles.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="w-36 p-2" />
              {propiedades.map((p) => {
                const foto = obtenerFotoPortada(p);
                return (
                  <th key={p.id} className="p-2 align-top">
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden text-left">
                      {foto
                        ? <img src={foto} alt={p.titulo} className="w-full h-28 object-cover" />
                        : <div className="h-28 bg-gray-100 flex items-center justify-center text-xs text-gray-400">Sin foto</div>}
                      <div className="p-3">
                        <Link to={`/propiedades/${p.id}`} className="font-semibold text-sm text-[#222A33] line-clamp-1 hover:underline">{p.titulo}</Link>
                        <p className="text-xs text-gray-500">{p.zona}, {p.municipio}</p>
                        <button type="button" onClick={() => toggleComparar(p.id)} className="mt-2 text-xs text-red-500 hover:underline">Quitar</button>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-t border-gray-200">
              <td className="p-2 font-medium text-[#222A33]">Precio</td>
              {propiedades.map((p) => (
                <td key={p.id} className="p-2 text-center font-bold text-[#1E4273]">{formatearPrecio(p.precio, p.moneda)}</td>
              ))}
            </tr>
            <tr className="border-t border-gray-200 bg-white">
              <td className="p-2 font-medium text-[#222A33]">Índice de conveniencia</td>
              {propiedades.map((p) => {
                const v = obtenerIndiceVigente(p);
                const c = colorIndice(v);
                return (
                  <td key={p.id} className="p-2 text-center font-bold" style={{ color: c.bg }}>
                    {v !== null ? `${v.toFixed(0)} (${c.label})` : c.label}
                  </td>
                );
              })}
            </tr>
            {categorias.map((cat) => (
              <tr key={cat.categoriaId} className="border-t border-gray-200">
                <td className="p-2 text-gray-600">{nombreCategoria(cat.categoriaId, cat.nombre)}</td>
                {propiedades.map((p) => {
                  const sp = indices[p.id]?.subPuntajes.find((s) => s.categoriaId === cat.categoriaId);
                  const c = colorIndice(sp ? sp.puntaje : null);
                  return (
                    <td key={p.id} className="p-2 text-center">
                      {sp ? (
                        <>
                          <span className="inline-block min-w-12 rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: c.bg }}>
                            {sp.puntaje.toFixed(0)}
                          </span>
                          <p className="mt-0.5 text-[11px] text-gray-500">
                            {sp.cantidad} {sp.cantidad === 1 ? "lugar" : "lugares"}
                            {sp.distanciaMinimaM !== null && ` · desde ${formatearDistancia(sp.distanciaMinimaM)}`}
                          </p>
                        </>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t border-gray-200">
              <td className="p-2 text-gray-600">Ubicación</td>
              {propiedades.map((p) => (
                <td key={p.id} className="p-2 text-center text-gray-700">{p.zona}, {p.municipio}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">Puntaje de 0 a 100 por categoría según los lugares cercanos a cada propiedad.</p>
    </main>
  );
}