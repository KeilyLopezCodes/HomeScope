import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cambiarEstadoPropiedad, eliminarPropiedad, listarMisPropiedades } from '../api/misPropiedadesApi';
import { formatearPrecio } from '../utils/formatoPrecio';
import EditarPropiedad from '../components/EditarPropiedad';

const ESTADOS = {
  borrador: { texto: 'Borrador', clase: 'bg-gray-100 text-gray-700' },
  publicado: { texto: 'Publicada', clase: 'bg-emerald-50 text-[#2E9E6B]' },
  pausado: { texto: 'Pausada', clase: 'bg-amber-50 text-amber-700' },
  vendido: { texto: 'Vendida', clase: 'bg-blue-50 text-[#1E4273]' },
  alquilado: { texto: 'Alquilada', clase: 'bg-blue-50 text-[#1E4273]' },
  no_disponible: { texto: 'No disponible', clase: 'bg-rose-50 text-rose-700' },
};
const AYUDA_ESTADO = {
  publicado: 'Visible en el catálogo',
  borrador: 'Solo tú la ves',
  pausado: 'Oculta temporalmente',
  vendido: 'Ya no aparece en el catálogo',
  alquilado: 'Ya no aparece en el catálogo',
  no_disponible: 'Ya no aparece en el catálogo',
};

const portadaDe = (p) => p.foto_propiedad?.find((f) => f.es_portada) ?? p.foto_propiedad?.[0];

export default function MisPropiedades() {
  const [lista, setLista] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [editando, setEditando] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [trabajando, setTrabajando] = useState(null); // id con una acción en curso

  useEffect(() => {
    let activo = true;
    listarMisPropiedades()
      .then((datos) => activo && setLista(Array.isArray(datos) ? datos : []))
      .catch((e) => activo && setError(e.message));
    return () => { activo = false; };
  }, []);

  const mostrarAviso = (texto) => {
    setAviso(texto);
    setTimeout(() => setAviso(''), 4000);
  };

  const cambiarEstado = async (propiedad, estado) => {
    if (estado === propiedad.estado) return;
    setTrabajando(propiedad.id);
    setError('');
    try {
      await cambiarEstadoPropiedad(propiedad.id, estado);
      setLista((l) => l.map((p) => (p.id === propiedad.id ? { ...p, estado } : p)));
      mostrarAviso(`"${propiedad.titulo}" ahora está: ${ESTADOS[estado].texto.toLowerCase()}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setTrabajando(null);
    }
  };

  const confirmarEliminar = async () => {
    const propiedad = aEliminar;
    setTrabajando(propiedad.id);
    setError('');
    try {
      await eliminarPropiedad(propiedad.id);
      setLista((l) => l.filter((p) => p.id !== propiedad.id));
      setAEliminar(null);
      mostrarAviso('Publicación eliminada.');
    } catch (e) {
      setError(e.message);
      setAEliminar(null);
    } finally {
      setTrabajando(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 text-[#222A33]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis propiedades</h1>
          <p className="text-sm text-[#222A33]/60">Edita tus publicaciones, cambia su estado o márcalas como vendidas.</p>
        </div>
        <Link to="/publicar" className="rounded-lg bg-[#1E4273] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163156]">
          + Publicar propiedad
        </Link>
      </div>

      {aviso && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-[#2E9E6B]">{aviso}</p>}
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {lista === null && !error && <p className="text-[#222A33]/70">Cargando tus propiedades…</p>}

      {lista?.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#222A33]/20 p-10 text-center">
          <p className="font-medium">Aún no has publicado propiedades.</p>
          <Link to="/publicar" className="mt-2 inline-block text-sm font-medium text-[#1E4273] underline underline-offset-2">Publica la primera</Link>
        </div>
      )}

      <ul className="space-y-4">
        {lista?.map((p) => {
          const portada = portadaDe(p);
          const estado = ESTADOS[p.estado] ?? { texto: p.estado, clase: 'bg-gray-100 text-gray-700' };
          const ocupado = trabajando === p.id;
          return (
            <li key={p.id} className="flex flex-col gap-4 rounded-xl border border-[#222A33]/10 bg-white p-4 sm:flex-row">
              <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:w-48">
                {portada ? (
                  <img src={portada.url} alt={p.titulo} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">Sin fotos</div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${estado.clase}`}>{estado.texto}</span>
                    <span className="text-xs text-[#222A33]/60">{p.tipo_propiedad?.nombre}</span>
                  </div>
                  <h2 className="truncate text-lg font-semibold">{p.titulo}</h2>
                  <p className="text-lg font-semibold text-[#1E4273]">{formatearPrecio(p.precio, p.moneda)}</p>
                  <p className="truncate text-sm text-[#222A33]/60">{[p.direccion, p.municipio].filter(Boolean).join(', ')}</p>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label htmlFor={`estado-${p.id}`} className="block text-xs font-medium text-[#222A33]/70">Estado</label>
                    <select
                      id={`estado-${p.id}`}
                      value={p.estado}
                      disabled={ocupado}
                      onChange={(e) => cambiarEstado(p, e.target.value)}
                      className="mt-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4273] disabled:opacity-50"
                    >
                      {Object.entries(ESTADOS).map(([valor, { texto }]) => (
                        <option key={valor} value={valor}>{texto}</option>
                      ))}
                    </select>
                  </div>
                  <p className="pb-2 text-xs text-[#222A33]/50">{AYUDA_ESTADO[p.estado]}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setEditando(p)} disabled={ocupado}
                    className="rounded-lg border border-[#1E4273] px-3 py-1.5 text-sm font-medium text-[#1E4273] hover:bg-[#1E4273]/5 disabled:opacity-50">
                    Editar
                  </button>
                  {p.estado === 'publicado' && p.modalidad !== 'ALQUILER' && (
                    <button type="button" onClick={() => cambiarEstado(p, 'vendido')} disabled={ocupado}
                      className="rounded-lg bg-[#2E9E6B] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#258258] disabled:opacity-50">
                      Marcar como vendida
                    </button>
                  )}
                  {p.estado === 'publicado' && p.modalidad === 'ALQUILER' && (
                    <button type="button" onClick={() => cambiarEstado(p, 'alquilado')} disabled={ocupado}
                      className="rounded-lg bg-[#2E9E6B] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#258258] disabled:opacity-50">
                      Marcar como alquilada
                    </button>
                  )}
                  <Link to={`/propiedades/${p.id}`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
                    Ver ficha
                  </Link>
                  <button type="button" onClick={() => setAEliminar(p)} disabled={ocupado}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {editando && (
        <EditarPropiedad
          propiedad={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={(actualizada) => {
            setLista((l) => l.map((p) => (p.id === actualizada.id ? actualizada : p)));
            setEditando(null);
            mostrarAviso('Cambios guardados.');
          }}
        />
      )}

      {aEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="alertdialog" aria-modal="true" aria-labelledby="titulo-eliminar">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="titulo-eliminar" className="text-lg font-semibold">¿Eliminar esta publicación?</h2>
            <p className="text-sm text-[#222A33]/70">
              &ldquo;{aEliminar.titulo}&rdquo; se borrará junto con sus fotos. Si solo ya no está disponible, mejor cámbiale el estado.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAEliminar(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button" onClick={confirmarEliminar} disabled={trabajando === aEliminar.id}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-gray-300">
                {trabajando === aEliminar.id ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}