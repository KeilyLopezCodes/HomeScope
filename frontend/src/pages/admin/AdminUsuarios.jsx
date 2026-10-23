import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdminApi } from '../../components/admin/useAdminApi';
import {
  Alerta, Boton, Cargando, CampoTexto, EncabezadoPagina, EstadoBadge, ModalMotivo, Paginacion,
  Selector, Tarjeta, Vacio, formatearFecha, nombreCompleto,
} from '../../components/admin/AdminUI';

const ESTADOS = [
  { valor: '', texto: 'Todos los estados' },
  { valor: 'activo', texto: 'Activos' },
  { valor: 'suspendido', texto: 'Suspendidos' },
  { valor: 'inhabilitado', texto: 'Inhabilitados' },
];

export default function AdminUsuarios() {
  const api = useAdminApi();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const estado = params.get('estado') || '';
  const q = params.get('q') || '';
  const page = Number(params.get('page')) || 1;

  const [busqueda, setBusqueda] = useState(q);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [modal, setModal] = useState(null); // { usuario, accion }

  const actualizar = (cambios) => {
    const nuevos = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => (v ? nuevos.set(k, v) : nuevos.delete(k)));
    if (!('page' in cambios)) nuevos.delete('page');
    setParams(nuevos);
  };

  // Búsqueda con espera de 400 ms para no llamar a la API en cada tecla
  useEffect(() => {
    const t = setTimeout(() => {
      if (busqueda.trim() !== q) actualizar({ q: busqueda.trim() });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    api.listarUsuarios({ estado, q, page, limit: 15 })
      .then((r) => activo && setResultado(r))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => { activo = false; };
  }, [api, estado, q, page, recarga]);

  const confirmar = async (motivo) => {
    const { usuario, accion } = modal;
    const res = await api.moderarUsuario(usuario.id, { accion, motivo });
    setModal(null);
    setExito(`${nombreCompleto(usuario)}: ${res.message || 'acción aplicada'}`);
    setRecarga((n) => n + 1);
  };

  const usuarios = resultado?.data || [];
  const suspender = modal?.accion === 'suspender';

  return (
    <>
      <EncabezadoPagina titulo="Usuarios" descripcion="Busca cuentas y suspende o reactiva su acceso." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <CampoTexto
          etiqueta="Buscar"
          type="search"
          placeholder="Nombre, apellido o correo…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="sm:max-w-sm sm:flex-1"
        />
        <Selector etiqueta="Estado" value={estado} onChange={(v) => actualizar({ estado: v })} opciones={ESTADOS} className="sm:w-52" />
      </div>

      <Alerta tipo="exito" onCerrar={() => setExito('')}>{exito}</Alerta>
      <Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta>

      <Tarjeta>
        {cargando && !resultado ? (
          <Cargando />
        ) : usuarios.length === 0 ? (
          <Vacio titulo="No se encontraron usuarios" texto="Prueba con otra búsqueda o estado." />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${cargando ? 'opacity-50' : ''}`}>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Usuario</th>
                  <th className="px-5 py-3 font-medium">Roles</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Registro</th>
                  <th className="px-5 py-3 font-medium">Último acceso</th>
                  <th className="px-5 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((u) => {
                  const esAdmin = u.roles.includes('administrador');
                  const esYo = Number(u.id) === Number(user?.id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E4273]/10 text-sm font-semibold text-[#1E4273]">
                            {(u.nombre || '?').charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[#222A33]">
                              {nombreCompleto(u)} {esYo && <span className="text-xs font-normal text-slate-400">(tú)</span>}
                            </p>
                            <p className="truncate text-xs text-slate-500">{u.correo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length ? u.roles.map((rol) => (
                            <span
                              key={rol}
                              className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                                rol === 'administrador' ? 'bg-[#1E4273] text-white' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {rol}
                            </span>
                          )) : <span className="text-xs text-slate-400">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><EstadoBadge estado={u.estado} /></td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{formatearFecha(u.fecha_registro, false)}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{formatearFecha(u.ultimo_acceso)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/auditoria?usuario_id=${u.id}`}
                            className="whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium text-[#1E4273] hover:bg-[#1E4273]/5"
                          >
                            Historial
                          </Link>
                          {!esAdmin && !esYo && u.estado === 'activo' && (
                            <Boton variante="peligro" tamano="sm" onClick={() => { setExito(''); setModal({ usuario: u, accion: 'suspender' }); }}>
                              Suspender
                            </Boton>
                          )}
                          {!esAdmin && !esYo && u.estado === 'suspendido' && (
                            <Boton variante="exito" tamano="sm" onClick={() => { setExito(''); setModal({ usuario: u, accion: 'reactivar' }); }}>
                              Reactivar
                            </Boton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion pagination={resultado?.pagination} onCambiar={(p) => actualizar({ page: String(p) })} />
      </Tarjeta>

      <ModalMotivo
        abierto={Boolean(modal)}
        titulo={suspender ? 'Suspender usuario' : 'Reactivar usuario'}
        descripcion={modal && (suspender
          ? `${nombreCompleto(modal.usuario)} (${modal.usuario.correo}) no podrá usar su cuenta mientras esté suspendido.`
          : `${nombreCompleto(modal.usuario)} (${modal.usuario.correo}) recuperará el acceso a su cuenta.`)}
        textoConfirmar={suspender ? 'Suspender' : 'Reactivar'}
        variante={suspender ? 'peligro' : 'exito'}
        onConfirmar={confirmar}
        onCerrar={() => setModal(null)}
      />
    </>
  );
}