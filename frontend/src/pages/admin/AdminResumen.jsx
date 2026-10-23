import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminApi } from '../../components/admin/useAdminApi';
import {
  AccionBadge, Alerta, Cargando, EncabezadoPagina, EstadoBadge, Tarjeta, TipoBadge, Vacio,
  describirObjetivo, formatearFecha, nombreCompleto,
} from '../../components/admin/AdminUI';

function Metrica({ titulo, valor, detalle, to, acento }) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#1E4273]/40 hover:shadow"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${acento}`} />
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-[#222A33]">{valor ?? '—'}</p>
      <p className="mt-1 text-xs text-slate-500 group-hover:text-[#1E4273]">{detalle} →</p>
    </Link>
  );
}

export default function AdminResumen() {
  const api = useAdminApi();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    // Los totales salen de pagination.totalItems de cada listado (limit mínimo).
    Promise.all([
      api.listarReportes({ estado: 'pendiente', limit: 5 }),
      api.listarReportes({ estado: 'en_revision', limit: 1 }),
      api.listarUsuarios({ limit: 1 }),
      api.listarUsuarios({ estado: 'suspendido', limit: 1 }),
      api.listarAcciones({ limit: 6 }),
    ])
      .then(([pendientes, enRevision, usuarios, suspendidos, acciones]) => {
        if (!activo) return;
        setDatos({
          pendientes: pendientes.data,
          totalPendientes: pendientes.pagination.totalItems,
          totalEnRevision: enRevision.pagination.totalItems,
          totalUsuarios: usuarios.pagination.totalItems,
          totalSuspendidos: suspendidos.pagination.totalItems,
          acciones: acciones.data,
        });
      })
      .catch((e) => activo && setError(e.message));
    return () => { activo = false; };
  }, [api]);

  return (
    <>
      <EncabezadoPagina titulo="Resumen" descripcion="Estado actual de la moderación en HomeScope." />
      <Alerta tipo="error">{error}</Alerta>

      {!datos && !error && <Cargando />}

      {datos && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica titulo="Reportes pendientes" valor={datos.totalPendientes} detalle="Revisar pendientes" to="/admin/reportes?estado=pendiente" acento="bg-amber-500" />
            <Metrica titulo="En revisión" valor={datos.totalEnRevision} detalle="Ver en revisión" to="/admin/reportes?estado=en_revision" acento="bg-[#1E4273]" />
            <Metrica titulo="Usuarios registrados" valor={datos.totalUsuarios} detalle="Gestionar usuarios" to="/admin/usuarios" acento="bg-[#2E9E6B]" />
            <Metrica titulo="Usuarios suspendidos" valor={datos.totalSuspendidos} detalle="Ver suspendidos" to="/admin/usuarios?estado=suspendido" acento="bg-red-500" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <Tarjeta
              className="xl:col-span-3"
              titulo="Reportes pendientes más recientes"
              accion={<Link to="/admin/reportes?estado=pendiente" className="text-xs font-medium text-[#1E4273] hover:underline">Ver todos</Link>}
            >
              {datos.pendientes.length === 0 ? (
                <Vacio titulo="No hay reportes pendientes" texto="Todo está al día." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {datos.pendientes.map((r) => (
                    <li key={r.id}>
                      <Link to={`/admin/reportes/${r.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
                        <TipoBadge tipo={r.tipo_objetivo} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{describirObjetivo(r)}</p>
                          <p className="truncate text-xs text-slate-500">{r.motivo}</p>
                        </div>
                        <span className="hidden shrink-0 text-xs text-slate-400 sm:block">{formatearFecha(r.fecha_creacion, false)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Tarjeta>

            <Tarjeta
              className="xl:col-span-2"
              titulo="Últimas acciones"
              accion={<Link to="/admin/auditoria" className="text-xs font-medium text-[#1E4273] hover:underline">Auditoría</Link>}
            >
              {datos.acciones.length === 0 ? (
                <Vacio titulo="Aún no hay acciones registradas" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {datos.acciones.map((a) => (
                    <li key={a.id} className="px-5 py-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <AccionBadge accion={a.accion} />
                        <span className="text-xs text-slate-400">{formatearFecha(a.fecha_accion)}</span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{a.motivo}</p>
                      <p className="mt-1 text-xs text-slate-400">por {nombreCompleto(a.administrador)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Tarjeta>
          </div>

          <p className="text-xs text-slate-400">
            Estados de un reporte: <EstadoBadge estado="pendiente" /> → <EstadoBadge estado="en_revision" /> → <EstadoBadge estado="resuelto" /> o <EstadoBadge estado="descartado" />
          </p>
        </div>
      )}
    </>
  );
}