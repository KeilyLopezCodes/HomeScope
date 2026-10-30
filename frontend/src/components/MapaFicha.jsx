// Mapa de la ubicación de una propiedad (solo lectura). No necesita librerías ni clave de API.
export default function MapaFicha({ latitud, longitud, titulo = 'la propiedad' }) {
  const lat = Number(latitud);
  const lng = Number(longitud);
  const valido = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

  if (!valido) {
    return (
      <p className="rounded-lg bg-gray-50 p-4 text-sm text-[#222A33]/60">
        El vendedor aún no indicó la ubicación en el mapa.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-[#222A33]/10">
        <iframe
          title={`Mapa de ${titulo}`}
          src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
          className="h-64 w-full sm:h-80"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        className="inline-block text-sm font-medium text-[#1E4273] underline underline-offset-2"
      >
        Abrir en Google Maps
      </a>
    </div>
  );
}