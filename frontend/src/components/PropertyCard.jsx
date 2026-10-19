function colorIndice(valor) {
  if (valor >= 80) return { bg: "#2E9E6B", label: "Alto" };
  if (valor >= 50) return { bg: "#F2A93B", label: "Medio" };
  return { bg: "#E0564B", label: "Bajo" };
}

export default function PropertyCard({ propiedad }) {
  const { titulo, precio, moneda, zona, municipio, indice, foto } = propiedad;
  const badge = colorIndice(indice);

  return (
    <article className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="relative">
        <img src={foto} alt={titulo} className="w-full h-40 object-cover" />
        <span
          className="absolute top-2 right-2 text-xs font-semibold text-white px-2 py-1 rounded-full"
          style={{ backgroundColor: badge.bg }}
        >
          Índice {indice}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-[#222A33] text-sm mb-1 line-clamp-1">{titulo}</h3>
        <p className="text-xs text-gray-500 mb-3">{zona}, {municipio}</p>
        <p className="text-lg font-bold text-[#1E4273] mt-auto">
          {moneda}{precio.toLocaleString("es-GT")}
        </p>
      </div>
    </article>
  );
}