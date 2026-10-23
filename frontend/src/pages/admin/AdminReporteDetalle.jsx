import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdminApi } from '../../components/admin/useAdminApi';
import {
  AccionBadge, Alerta, Boton, Cargando, EstadoBadge, ModalMotivo, Tarjeta, TipoBadge, Vacio,
  formatearFecha, nombreCompleto,
} from '../../components/admin/AdminUI';

const ESTADOS_ABIERTOS = ['pendiente', 'en_revision'];

function Dato({ etiqueta, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{etiqueta}</dt>
      <dd className="mt-1 text-sm text-[#222A33]">{children}</dd>
    </div>
  );
}

export default function AdminReporteDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const api = useAdminApi();

  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Acción que se está confirmando en el modal
  const [modal, setModal] = useState(null);
  const [vincular, setVincular] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const r = await api.obtenerReporte(id);
      setReporte(r.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [api, id]);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando && !reporte) return <Cargando texto="Cargando reporte…" />;

  if (!reporte) {
    return (
      <>
        <Volver />
        <Alerta tipo="error">{error || 'Reporte no encontrado'}</Alerta>
      </>
    );
  }

  const abierto = ESTADOS_ABIERTOS.includes(reporte.estado);
  const { propiedad, usuario_reportado: usuarioReportado, comentario } = reporte;

  // Usuario sobre el que se puede actuar: el reportado o el anunciante de la propiedad
  const usuarioObjetivo = reporte.tipo_objetivo === 'usuario' && usuarioReportado
    ? { id: usuarioReportado.id, nombre: nombreCompleto(usuarioReportado), estado: usuarioReportado.estado }
    : reporte.tipo_objetivo === 'propiedad' && propiedad?.vendedor_id
      ? { id: propiedad.vendedor_id, nombre: `Anunciante #${propiedad.vendedor_id}`, estado: null }
      : null;
  const esMiCuenta = usuarioObjetivo && Number(usuarioObjetivo.id) === Number(user?.id);

  const abrir = (config) => {
    setVincular(true);
    setExito('');
    setModal(config);
  };

  const confirmar = async (motivo) => {
    const reporteId = modal.vinculable && abierto && vincular ? reporte.id : undefined;
    const res = await modal.ejecutar(motivo, reporteId);
    setModal(null);
    setExito(res.message || 'Acción aplicada');
    await cargar();
  };

  /* ───── Configuración de cada acción ───── */

  const accionReporte = (estado, titulo, variante, descripcion) => abrir({
    titulo, descripcion, variante, textoConfirmar: titulo,
    ejecutar: (motivo) => api.cambiarEstadoReporte(reporte.id, { estado, motivo }),
  });

  const accionPropiedad = (accion) => {
    const cfg = {
      pausar: {
        titulo: 'Pausar publicación', variante: 'advertencia', vinculable: true,
        descripcion: 'La propiedad dejará de aparecer en el listado público hasta que se apruebe de nuevo.',
      },
      aprobar: {
        titulo: 'Aprobar publicación', variante: 'exito', vinculable: false,
        descripcion: 'La propiedad volverá a estar visible en el listado público.',
      },
    }[accion];
    abrir({
      ...cfg, textoConfirmar: cfg.titulo,
      ejecutar: (motivo, reporteId) => api.moderarPropiedad(propiedad.id, { accion, motivo, reporte_id: reporteId }),
    });
  };

  const eliminarPropiedad = () => abrir({
    titulo: 'Eliminar publicación', variante: 'peligro', vinculable: true, textoConfirmar: 'Eliminar',
    descripcion: 'La propiedad pasará a “no disponible”. Sus datos se conservan, pero ya no se podrá reactivar desde el panel.',
    ejecutar: (motivo, reporteId) => api.eliminarPropiedad(propiedad.id, { motivo, reporte_id: reporteId }),
  });

  const accionUsuario = (accion) => {
    const suspender = accion === 'suspender';
    abrir({
      titulo: suspender ? 'Suspender usuario' : 'Reactivar usuario',
      variante: suspender ? 'peligro' : 'exito',
      textoConfirmar: suspender ? 'Suspender' : 'Reactivar',
      vinculable: suspender,
      descripcion: suspender
        ? `${usuarioObjetivo.nombre} no podrá usar su cuenta mientras esté suspendido.`
        : `${usuarioObjetivo.nombre} recuperará el acceso a su cuenta.`,
      ejecutar: (motivo, reporteId) => api.moderarUsuario(usuarioObjetivo.id, { accion, motivo, reporte_id: reporteId }),
    });
  };

  return (
    <>
      <Volver />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-[#222A33]">Reporte #{reporte.id}</h1>
        <TipoBadge tipo={reporte.tipo_objetivo} />
        <EstadoBadge estado={reporte.estado} />
      </div>

      <Alerta tipo="exito" onCerrar={() => setExito('')}>{exito}</Alerta>
      <Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Detalle del reporte */}
          <Tarjeta titulo="Detalle del reporte">
            <dl className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <Dato etiqueta="Motivo">{reporte.motivo || '—'}</Dato>
              <Dato etiqueta="Fecha">{formatearFecha(reporte.fecha_creacion)}</Dato>
              <Dato etiqueta="Reportado por">
                {reporte.reportante ? (
                  <Link to={`/admin/usuarios?q=${encodeURIComponent(reporte.reportante.nombre || '')}`} className="text-[#1E4273] hover:underline">
                    {nombreCompleto(reporte.reportante)}
                  </Link>
                ) : '—'}
              </Dato>
              <div className="sm:col-span-2">
                <Dato etiqueta="Descripción">
                  <p className="whitespace-pre-line text-slate-600">{reporte.descripcion || 'Sin descripción adicional.'}</p>
                </Dato>
              </div>
            </dl>
          </Tarjeta>

          {/* Objetivo reportado */}
          <Tarjeta titulo="Contenido reportado">
            <div className="p-5">
              {reporte.tipo_objetivo === 'propiedad' && propiedad && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#222A33]">{propiedad.titulo}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Propiedad #{propiedad.id} · Anunciante #{propiedad.vendedor_id}
                    </p>
                  </div>
                  <EstadoBadge estado={propiedad.estado} />
                </div>
              )}

              {reporte.tipo_objetivo === 'usuario' && usuarioReportado && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#222A33]">{nombreCompleto(usuarioReportado)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Usuario #{usuarioReportado.id}</p>
                  </div>
                  <EstadoBadge estado={usuarioReportado.estado} />
                </div>
              )}

              {reporte.tipo_objetivo === 'comentario' && comentario && (
                <div>
                  <blockquote className="border-l-4 border-slate-200 pl-4 text-sm italic text-slate-600">
                    {comentario.comentario}
                  </blockquote>
                  <p className="mt-2 text-xs text-slate-500">
                    Comentario #{comentario.id} · estado: {comentario.estado}
                  </p>
                </div>
              )}

              {!propiedad && !usuarioReportado && !comentario && (
                <p className="text-sm text-slate-500">El contenido reportado ya no está disponible.</p>
              )}
            </div>
          </Tarjeta>

          {/* Historial */}
          <Tarjeta
            titulo="Historial de acciones"
            accion={(
              <Link to={`/admin/auditoria?reporte_id=${reporte.id}`} className="text-xs font-medium text-[#1E4273] hover:underline">
                Ver en auditoría
              </Link>
            )}
          >
            {reporte.acciones?.length ? (
              <ol className="space-y-5 p-5">
                {reporte.acciones.map((a) => (
                  <li key={a.id} className="relative border-l-2 border-slate-200 pl-5">
                    <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#1E4273]" />
                    <div className="flex flex-wrap items-center gap-2">
                      <AccionBadge accion={a.accion} />
                      <span className="text-xs text-slate-400">{formatearFecha(a.fecha_accion)}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700">{a.motivo}</p>
                    <p className="mt-0.5 text-xs text-slate-400">por {nombreCompleto(a.administrador)}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <Vacio titulo="Sin acciones todavía" texto="Las acciones que tomes sobre este reporte aparecerán aquí." />
            )}
          </Tarjeta>
        </div>

        {/* Panel de acciones */}
        <div className="space-y-6">
          <Tarjeta titulo="Estado del reporte">
            <div className="space-y-2 p-5">
              {abierto ? (
                <>
                  {reporte.estado === 'pendiente' && (
                    <Boton variante="primario" className="w-full" onClick={() => accionReporte('en_revision', 'Marcar en revisión', 'primario', 'Indica que estás investigando este reporte.')}>
                      Marcar en revisión
                    </Boton>
                  )}
                  <Boton variante="exito" className="w-full" onClick={() => accionReporte('resuelto', 'Resolver reporte', 'exito', 'El reporte se cerrará como resuelto. No se podrá modificar después.')}>
                    Resolver
                  </Boton>
                  <Boton variante="secundario" className="w-full" onClick={() => accionReporte('descartado', 'Descartar reporte', 'primario', 'El reporte se cerrará como no fundamentado. No se podrá modificar después.')}>
                    Descartar
                  </Boton>
                </>
              ) : (
                <p className="text-sm text-slate-500">Este reporte está cerrado y ya no se puede modificar.</p>
              )}
            </div>
          </Tarjeta>

          {reporte.tipo_objetivo === 'propiedad' && propiedad && (
            <Tarjeta titulo="Moderar publicación">
              <div className="space-y-2 p-5">
                {propiedad.estado === 'publicado' && (
                  <Boton variante="advertencia" className="w-full" onClick={() => accionPropiedad('pausar')}>Pausar publicación</Boton>
                )}
                {propiedad.estado === 'pausado' && (
                  <Boton variante="exito" className="w-full" onClick={() => accionPropiedad('aprobar')}>Aprobar publicación</Boton>
                )}
                {propiedad.estado !== 'no_disponible' ? (
                  <Boton variante="peligro" className="w-full" onClick={eliminarPropiedad}>Eliminar publicación</Boton>
                ) : (
                  <p className="text-sm text-slate-500">La publicación ya fue eliminada.</p>
                )}
              </div>
            </Tarjeta>
          )}

          {usuarioObjetivo && !esMiCuenta && (
            <Tarjeta titulo={reporte.tipo_objetivo === 'usuario' ? 'Moderar usuario' : 'Moderar anunciante'}>
              <div className="space-y-2 p-5">
                {usuarioObjetivo.estado !== 'suspendido' && (
                  <Boton variante="peligro" className="w-full" onClick={() => accionUsuario('suspender')}>
                    Suspender {reporte.tipo_objetivo === 'usuario' ? 'usuario' : 'anunciante'}
                  </Boton>
                )}
                {usuarioObjetivo.estado === 'suspendido' && (
                  <Boton variante="exito" className="w-full" onClick={() => accionUsuario('reactivar')}>Reactivar usuario</Boton>
                )}
                <p className="text-xs text-slate-400">No se puede moderar a otros administradores.</p>
              </div>
            </Tarjeta>
          )}
        </div>
      </div>

      <ModalMotivo
        abierto={Boolean(modal)}
        titulo={modal?.titulo}
        descripcion={modal?.descripcion}
        textoConfirmar={modal?.textoConfirmar}
        variante={modal?.variante}
        onConfirmar={confirmar}
        onCerrar={() => setModal(null)}
      >
        {modal?.vinculable && abierto && (
          <label className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={vincular}
              onChange={(e) => setVincular(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#1E4273]"
            />
            <span>Marcar el reporte #{reporte.id} como <strong>resuelto</strong> con esta acción.</span>
          </label>
        )}
      </ModalMotivo>
    </>
  );
}

function Volver() {
  return (
    <Link to="/admin/reportes" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#1E4273]">
      ← Volver a reportes
    </Link>
  );
}