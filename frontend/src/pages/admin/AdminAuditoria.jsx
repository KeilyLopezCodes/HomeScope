import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdminApi } from '../../components/admin/useAdminApi';
import {
  AccionBadge, Alerta, Boton, Cargando, CampoTexto, ETIQUETA_ACCION, EncabezadoPagina, Paginacion,
  Selector, Tarjeta, Vacio, formatearFecha, nombreCompleto,
} from '../../components/admin/AdminUI';

const CAMPOS_ID = [
  { clave: 'administrador_id', etiqueta: 'ID administrador' },
  { clave: 'reporte_id', etiqueta: 'ID reporte' },
  { clave: 'propiedad_id', etiqueta: 'ID propiedad' },
  { clave: 'usuario_id', etiqueta: 'ID usuario' },
];

const OPCIONES_ACCION = [
  { valor: '', texto: 'Todas las acciones' },
  ...Object.entries(ETIQUETA_ACCION).map(([valor, texto]) => ({ valor, texto })),
];

const FILTROS = ['accion', ...CAMPOS_ID.map((c) => c.clave)];

export default function AdminAuditoria() {
  const api = useAdminApi();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;

  const filtrosActuales = Object.fromEntries(FILTROS.map((k) => [k, params.get(k) || '']));
  const [borrador, setBorrador] = useState(filtrosActuales);
  const clave = params.toString();

  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Mantiene el formulario sincronizado si la URL cambia (por ejemplo desde un enlace "Historial")
  useEffect(() => {
    setBorrador(Object.fromEntries(FILTROS.map((k) => [k, params.get(k) || ''])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    const filtros = Object.fromEntries(FILTROS.map((k) => [k, params.get(k) || undefined]));
    api.listarAcciones({ ...filtros, page, limit: 20 })
      .then((r) => activo && setResultado(r))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, clave]);

  const aplicar = (e) => {
    e.preventDefault();
    const nuevos = new URLSearchParams();
    Object.entries(borrador).forEach(([k, v]) => { if (String(v).trim()) nuevos.set(k, String(v).trim()); });
    setParams(nuevos);
  };

  const limpiar = () => setParams(new URLSearchParams());

  const cambiarPagina = (p) => {
    const nuevos = new URLSearchParams(params);
    nuevos.set('page', String(p));
    setParams(nuevos);
  };

  const hayFiltros = FILTROS.some((k) => params.get(k));
  const acciones = resultado?.data || [];

  return (
    <>
      <EncabezadoPagina
        titulo="Auditoría"
        descripcion="Registro de solo lectura de todas las acciones de moderación: quién, qué, cuándo y por qué."
      />

      <Tarjeta className="mb-4">
        <form onSubmit={aplicar} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
          <Selector
            etiqueta="Acción"
            value={borrador.accion}
            onChange={(v) => setBorrador((b) => ({ ...b, accion: v }))}
            opciones={OPCIONES_ACCION}
            className="lg:col-span-2"
          />
          {CAMPOS_ID.map((c) => (
            <CampoTexto
              key={c.clave}
              etiqueta={c.etiqueta}
              type="number"
              min="1"
              inputMode="numeric"
              value={borrador[c.clave]}
              onChange={(e) => setBorrador((b) => ({ ...b, [c.clave]: e.target.value }))}
            />
          ))}
          <div className="flex gap-2 sm:col-span-2 lg:col-span-6 lg:justify-end">
            {hayFiltros && <Boton variante="secundario" onClick={limpiar}>Limpiar filtros</Boton>}
            <Boton type="submit">Aplicar filtros</Boton>
          </div>
        </form>
      </Tarjeta>

      <Alerta tipo="error" onCerrar={() => setError('')}>{error}</Alerta>

      <Tarjeta>
        {cargando && !resultado ? (
          <Cargando />
        ) : acciones.length === 0 ? (
          <Vacio titulo="No hay acciones registradas" texto={hayFiltros ? 'Ninguna acción coincide con los filtros.' : undefined} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${cargando ? 'opacity-50' : ''}`}>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Acción</th>
                  <th className="px-5 py-3 font-medium">Motivo</th>
                  <th className="px-5 py-3 font-medium">Afecta a</th>
                  <th className="px-5 py-3 font-medium">Administrador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {acciones.map((a) => (
                  <tr key={a.id} className="align-top hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{formatearFecha(a.fecha_accion)}</td>
                    <td className="px-5 py-3.5"><AccionBadge accion={a.accion} /></td>
                    <td className="min-w-[16rem] max-w-md px-5 py-3.5 text-slate-700">{a.motivo}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1 text-xs">
                        {a.reporte_id && (
                          <Link to={`/admin/reportes/${a.reporte_id}`} className="text-[#1E4273] hover:underline">Reporte #{a.reporte_id}</Link>
                        )}
                        {a.propiedad_id && <span className="text-slate-600">Propiedad #{a.propiedad_id}</span>}
                        {a.usuario_id && (
                          <Link to={`/admin/auditoria?usuario_id=${a.usuario_id}`} className="text-[#1E4273] hover:underline">Usuario #{a.usuario_id}</Link>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{nombreCompleto(a.administrador)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion pagination={resultado?.pagination} onCambiar={cambiarPagina} />
      </Tarjeta>
    </>
  );
}