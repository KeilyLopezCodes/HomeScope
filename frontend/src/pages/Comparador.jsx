import { useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { mockPropiedades } from "../data/mockPropiedades";
import { useComparador } from "../hooks/useComparador";

// Filas del índice desglosado que se muestran en la tabla.
const filasDesglose = [
  { clave: "ubicacion", etiqueta: "Ubicación" },
  { clave: "seguridad", etiqueta: "Seguridad" },
  { clave: "servicios", etiqueta: "Servicios cercanos" },
  { clave: "transporte", etiqueta: "Transporte" },
];

export default function Comparador() {
  const { seleccionados, toggleComparar, limpiarComparar } = useComparador();

  const propiedades = useMemo(
    () => mockPropiedades.filter((p) => seleccionados.includes(p.id)),
    [seleccionados]
  );

  if (propiedades.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-[#222A33] mb-2">Comparador</h1>
          <p className="text-sm text-gray-500 mb-4">
            No has seleccionado propiedades para comparar. Marca el checkbox
            "Comparar" en el catálogo o en favoritos (hasta 4).
          </p>
          <Link to="/catalogo" className="text-[#1E4273] underline text-sm">
            Ir al catálogo
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-[#222A33]">
            Comparar propiedades ({propiedades.length}/4)
          </h1>
          <button
            onClick={limpiarComparar}
            className="text-xs font-medium text-gray-500 hover:text-red-500"
          >
            Quitar todas
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 p-2 w-36">
                  &nbsp;
                </th>
                {propiedades.map((p) => (
                  <th key={p.id} className="p-2 align-top">
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <img src={p.foto} alt={p.titulo} className="w-full h-28 object-cover" />
                      <div className="p-3 text-left">
                        <p className="font-semibold text-sm text-[#222A33] line-clamp-1">
                          {p.titulo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.zona}, {p.municipio}
                        </p>
                        <button
                          onClick={() => toggleComparar(p.id)}
                          className="mt-2 text-xs text-red-500 hover:underline"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="text-sm">
              <tr className="border-t border-gray-200">
                <td className="p-2 font-medium text-[#222A33]">Precio</td>
                {propiedades.map((p) => (
                  <td key={p.id} className="p-2 text-center font-bold text-[#1E4273]">
                    {p.moneda}
                    {p.precio.toLocaleString("es-GT")}
                  </td>
                ))}
              </tr>

              <tr className="border-t border-gray-200 bg-white">
                <td className="p-2 font-medium text-[#222A33]">Índice de conveniencia</td>
                {propiedades.map((p) => (
                  <td key={p.id} className="p-2 text-center font-bold">
                    {p.indice}
                  </td>
                ))}
              </tr>

              {filasDesglose.map((fila) => (
                <tr key={fila.clave} className="border-t border-gray-200">
                  <td className="p-2 text-gray-600">{fila.etiqueta}</td>
                  {propiedades.map((p) => (
                    <td key={p.id} className="p-2 text-center text-gray-700">
                      {p.indiceDesglose[fila.clave]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}