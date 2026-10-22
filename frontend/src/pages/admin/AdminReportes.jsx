import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminApi } from '../../components/admin/useAdminApi';
import {
  Alerta, Cargando, EncabezadoPagina, EstadoBadge, Paginacion, Selector, Tarjeta, TipoBadge, Vacio,
  describirObjetivo, formatearFecha, nombreCompleto,
} from '../../components/admin/AdminUI';

const PESTANAS = [
  { valor: '', texto: 'Todos' },
  { valor: 'pendiente', texto: 'Pendientes' },
  { valor: 'en_revision', texto: 'En revisión' },
  { valor: 'resuelto', texto: 'Resueltos' },
  { valor: 'descartado', texto: 'Descartados' },
];

const TIPOS = [
  { valor: '', texto: 'Todos los tipos' },
  { valor: 'propiedad', texto: 'Propiedades' },
  { valor: 'usuario', texto: 'Usuarios' },
  { valor: 'comentario', texto: 'Comentarios' },
];

export default function AdminReportes() {
  const api = useAdminApi();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const estado = params.get('estado') || '';
  const tipo = params.get('tipo') || '';
  const page = Number(params.get('page')) || 1;

  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    api.listarReportes({ estado, tipo, page, limit: 15 })
      .then((r) => activo && setResultado(r))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => { activo = false; };
  }, [api, estado, tipo, page]);

  // Cambia un filtro y vuelve a la página 1
  const actualizar = (cambios) => {
    const nuevos = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => (v ? nuevos.set(k, v) : nuevos.delete(k)));
    if (!('page' in cambios)) nuevos.delete('page');
    setParams(nuevos);
  };

  const reportes = resultado?.data || [];

  return (
    <>
      <EncabezadoPagina titulo="Reportes" descripcion="Denuncias de usuarios sobre propiedades, perfiles y comentarios." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-200/60 p-1">
          {PESTANAS.map((p) => (
            <button
              key={p.valor}
              type="button"
              onClick={() => actualizar({ estado: p.valor })}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                estado === p.valor ? 'bg-white text-[#1E4273] shadow-sm' : 'text-slate-600 hover:text-[#222A33]'
              }`}
            >
              {p.texto}
            </button>
          ))}
        </div>
        <Selector etiqueta="Tipo de reporte" value={tipo} onChange={(v) => actualizar({ tipo: v })} opciones={TIPOS} className="lg:w-56" />
      </div>

      <Alerta tipo="error">{error}</Alerta>

      <Tarjeta>
        {cargando && !resultado ? (
          <Cargando />
        ) : reportes.length === 0 ? (
          <Vacio titulo="No hay reportes" texto="Prueba con otros filtros." />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${cargando ? 'opacity-50' : ''}`}>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">Objetivo</th>
                  <th className="px-5 py-3 font-medium">Motivo</th>
                  <th className="px-5 py-3 font-medium">Reportado por</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportes.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/admin/reportes/${r.id}`)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-5 py-3.5 tabular-nums text-slate-400">{r.id}</td>
                    <td className="max-w-xs px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <TipoBadge tipo={r.tipo_objetivo} />
                        <span className="truncate font-medium text-[#222A33]">{describirObjetivo(r)}</span>
                      </div>
                    </td>
                    <td className="max-w-xs truncate px-5 py-3.5 text-slate-600">{r.motivo}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{nombreCompleto(r.reportante)}</td>
                    <td className="px-5 py-3.5"><EstadoBadge estado={r.estado} /></td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{formatearFecha(r.fecha_creacion, false)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/admin/reportes/${r.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium text-[#1E4273] hover:underline"
                      >
                        Revisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion pagination={resultado?.pagination} onCambiar={(p) => actualizar({ page: String(p) })} />
      </Tarjeta>
    </>
  );
}