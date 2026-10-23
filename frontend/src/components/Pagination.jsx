export default function Pagination({ paginaActual, totalPaginas, onCambiarPagina }) {
  if (totalPaginas <= 1) return null;

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginación">
      <button
        onClick={() => onCambiarPagina(paginaActual - 1)}
        disabled={paginaActual === 1}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-[#222A33] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Anterior
      </button>

      <div className="hidden sm:flex items-center gap-1">
        {paginas.map((num) => (
          <button
            key={num}
            onClick={() => onCambiarPagina(num)}
            className={`w-9 h-9 rounded-lg text-sm font-medium ${
              num === paginaActual
                ? "bg-[#1E4273] text-white"
                : "text-[#222A33] hover:bg-gray-100"
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      <span className="sm:hidden text-sm text-gray-500">
        Página {paginaActual} de {totalPaginas}
      </span>

      <button
        onClick={() => onCambiarPagina(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-[#222A33] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Siguiente
      </button>
    </nav>
  );
}