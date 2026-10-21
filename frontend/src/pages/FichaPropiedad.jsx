import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerHistorialPrecio, obtenerPropiedad } from '../api/propertyApi';
import { formatearPrecio } from '../utils/formatoPrecio';
import EditarPrecio from '../components/EditarPrecio';
import { Alerta, enlace } from '../components/AuthUI';
import BotonContactar from '../components/BotonContactar';

const formatearFecha = (fecha) =>
  new Date(fecha).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });

// key={id}: al navegar a otra propiedad el estado se reinicia desde cero
export default function FichaPropiedad() {
  const { id } = useParams();
  return <Ficha key={id} id={id} />;
}

function Ficha({ id }) {
  const { user } = useAuth();
  const [propiedad, setPropiedad] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => {
    let activo = true;
    obtenerPropiedad(id)
      .then((data) => {
        if (!activo) return;
        setPropiedad(data);
        setHistorial(data.historial_precio || []);
      })
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => { activo = false; };
  }, [id]);

  const alGuardarPrecio = async (actualizada) => {
    // El precio se refleja de inmediato con la respuesta del backend
    setPropiedad((prev) => ({ ...prev, precio: actualizada.precio }));
    setMensajeExito(`Precio actualizado a ${formatearPrecio(actualizada.precio, propiedad.moneda)}.`);
    try {
      setHistorial(await obtenerHistorialPrecio(id));
    } catch {
      // El precio ya se guardó; si falla recargar el historial no se bloquea al usuario
    }
  };

  if (cargando) {
    return <p className="p-10 text-[#222A33]/70">Cargando propiedad…</p>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Alerta>{error}</Alerta>
        <Link to="/" className={enlace}>Volver al inicio</Link>
      </div>
    );
  }

  const esDueno = user?.id === propiedad.vendedor_id;
  const portada = propiedad.foto_propiedad?.find((f) => f.es_portada) || propiedad.foto_propiedad?.[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 text-[#222A33]">
      {portada && (
        <img src={portada.url} alt={propiedad.titulo} className="aspect-[16/9] w-full rounded-xl object-cover" />
      )}

      <header className="space-y-1">
        <p className="text-sm text-[#222A33]/60">
          {propiedad.tipo_propiedad?.nombre} · {propiedad.modalidad === 'ALQUILER' ? 'Alquiler' : 'Venta'}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{propiedad.titulo}</h1>
        <p className="text-[#222A33]/70">
          {[propiedad.direccion, propiedad.zona && `Zona ${propiedad.zona}`, propiedad.municipio, propiedad.departamento]
            .filter(Boolean)
            .join(', ')}
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-[#222A33]/10 p-5" aria-label="Precio">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-3xl font-semibold text-[#1E4273]" aria-live="polite">
            {formatearPrecio(propiedad.precio, propiedad.moneda)}
          </p>
          {esDueno && (
            <EditarPrecio
              propiedadId={propiedad.id}
              precioActual={propiedad.precio}
              moneda={propiedad.moneda}
              onGuardado={alGuardarPrecio}
            />
          )}
          {!esDueno && <BotonContactar propiedadId={propiedad.id} />}
        </div>
        <Alerta tipo="ok">{mensajeExito}</Alerta>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Habitaciones', propiedad.habitaciones],
          ['Baños', Number(propiedad.banos)],
          ['Parqueos', propiedad.parqueos],
          ['Área', `${Number(propiedad.area_m2)} m²`],
        ].map(([etiqueta, valor]) => (
          <div key={etiqueta} className="rounded-lg bg-[#1E4273]/5 p-3">
            <p className="text-xs text-[#222A33]/60">{etiqueta}</p>
            <p className="font-semibold">{valor}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Descripción</h2>
        <p className="whitespace-pre-line text-[#222A33]/80">{propiedad.descripcion}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Historial de precios</h2>
        {historial.length === 0 ? (
          <p className="text-sm text-[#222A33]/60">El precio no ha cambiado desde su publicación.</p>
        ) : (
          <ol className="divide-y divide-[#222A33]/10 rounded-xl border border-[#222A33]/10">
            {historial.map((h) => {
              const bajo = Number(h.precio_nuevo) < Number(h.precio_anterior);
              return (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="text-[#222A33]/60">{formatearFecha(h.fecha_cambio)}</span>
                  <span>
                    <span className="text-[#222A33]/60 line-through">{formatearPrecio(h.precio_anterior, propiedad.moneda)}</span>
                    <span className="mx-2" aria-hidden="true">→</span>
                    <span className={`font-semibold ${bajo ? 'text-[#2E9E6B]' : 'text-[#222A33]'}`}>
                      {formatearPrecio(h.precio_nuevo, propiedad.moneda)}
                    </span>
                    <span className="sr-only">{bajo ? ' (bajó)' : ' (subió)'}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
