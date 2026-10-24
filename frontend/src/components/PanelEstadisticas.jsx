import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerEstadisticas } from '../api/panelApi';
import GraficaInteres from './GraficaInteres';

const PERIODOS = [7, 30, 90];
const ESTADO_TEXTO = { publicado: 'Publicada', borrador: 'Borrador', pausado: 'Pausada' };
const NIVEL = {
  importante: { texto: 'Importante', clase: 'bg-red-50 text-red-700 ring-red-600/20' },
  aviso: { texto: 'Sugerencia', clase: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  info: { texto: 'Info', clase: 'bg-blue-50 text-[#1E4273] ring-[#1E4273]/20' },
};

function Metrica({ titulo, valor, detalle, to }) {
  const cuerpo = (
    <>
      <p className="text-sm font-medium text-slate-500">{titulo}</p>
      <p className="mt-2 text-3xl font-bold text-[#222A33]">{valor}</p>
      <p className="mt-1 text-xs text-slate-500">{detalle}</p>
    </>
  );
  const clase = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm';
  return to ? <Link to={to} className={`${clase} transition hover:border-[#1E4273]/40`}>{cuerpo}</Link> : <div className={clase}>{cuerpo}</div>;
}

function Sugerencia({ s }) {
  const nivel = NIVEL[s.nivel] || NIVEL.info;
  return (
    <li className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-start sm:gap-3">
      <span className={`inline-flex w-fit shrink-0 rounded-md sm:mt-0.5 px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${nivel.clase}`}>{nivel.texto}</span>
      <p className="min-w-0 flex-1 text-sm text-[#222A33]">{s.texto}</p>
      {s.accion && <Link to={s.accion.to} className="shrink-0 text-sm font-medium text-[#1E4273] hover:underline">{s.accion.texto} →</Link>}
    </li>
  );
}

// Panel del vendedor: métricas por propiedad, gráfica de interés y sugerencias de mejora
export default function PanelEstadisticas() {
  const [dias, setDias] = useState(30);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [propiedadId, setPropiedadId] = useState(null); // null = todas

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    obtenerEstadisticas(dias)
      .then((r) => activo && setDatos(r))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => { activo = false; };
  }, [dias]);

  if (!datos) {
    return error
      ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      : <p className="py-10 text-center text-sm text-slate-500">Cargando estadísticas…</p>;
  }

  const { resumen, propiedades, serie, periodo } = datos;
  const sugerenciasPorPropiedad = propiedades.filter((p) => p.sugerencias.length > 0);
  const hayAlgo = datos.sugerencias.length > 0 || sugerenciasPorPropiedad.length > 0;
  const rango = `últimos ${periodo.dias} días`;

  return (
    <div className={`space-y-6 transition-opacity ${cargando ? 'opacity-60' : ''}`}>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Periodo">
        {PERIODOS.map((p) => (
          <button key={p} type="button" aria-pressed={dias === p} onClick={() => setDias(p)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${dias === p ? 'border-[#1E4273] bg-[#1E4273] text-white' : 'border-slate-300 bg-white text-[#222A33] hover:border-[#1E4273]'}`}>
            Últimos {p} días
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metrica titulo="Vistas" valor={resumen.vistas} detalle={rango} />
        <Metrica titulo="Favoritos nuevos" valor={resumen.favoritos} detalle={rango} />
        <Metrica titulo="Mensajes recibidos" valor={resumen.mensajes} detalle={resumen.mensajes_sin_leer > 0 ? `${resumen.mensajes_sin_leer} sin leer` : rango} />
        <Metrica titulo="Visitas por responder" valor={resumen.visitas_pendientes} detalle={resumen.visitas_pendientes > 0 ? 'Ir a responder →' : 'Todo al día'} to={resumen.visitas_pendientes > 0 ? '/panel?tab=visitas' : undefined} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#222A33]">Interés a lo largo del tiempo</h2>
          {propiedades.length > 1 && (
            <label className="flex w-full items-center gap-2 text-xs text-slate-600 sm:w-auto">
              Propiedad
              <select value={propiedadId ?? ''} onChange={(e) => setPropiedadId(e.target.value ? Number(e.target.value) : null)}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-[#222A33] sm:flex-none">
                <option value="">Todas</option>
                {propiedades.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
              </select>
            </label>
          )}
        </div>
        <GraficaInteres serie={serie} periodo={periodo} propiedadId={propiedadId} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-[#222A33]">Por propiedad</h2>
        {propiedades.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Todavía no tienes propiedades.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Propiedad</th>
                  <th className="px-4 py-2.5 text-right font-medium">Vistas</th>
                  <th className="px-4 py-2.5 text-right font-medium">Favoritos</th>
                  <th className="px-4 py-2.5 text-right font-medium">Mensajes</th>
                  <th className="px-4 py-2.5 text-right font-medium" title="Mensajes recibidos ÷ vistas">Contacto</th>
                  <th className="px-4 py-2.5 text-right font-medium">Visitas pend.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {propiedades.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/propiedades/${p.id}`} className="font-medium text-[#222A33] hover:text-[#1E4273] hover:underline">{p.titulo}</Link>
                      <p className="text-xs text-slate-500">{ESTADO_TEXTO[p.estado] || p.estado}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {p.vistas}<span className="block text-xs text-slate-400">{p.vistas_total} en total</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {p.favoritos}<span className="block text-xs text-slate-400">{p.favoritos_total} en total</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {p.mensajes}<span className="block text-xs text-slate-400">{p.mensajes_total} en total</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.tasa_contacto == null ? '—' : `${p.tasa_contacto}%`}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.visitas_pendientes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-[#222A33]">Sugerencias de mejora</h2>
        {!hayAlgo ? (
          <p className="py-4 text-sm text-slate-500">Todo en orden: no hay sugerencias por ahora.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {datos.sugerencias.length > 0 && <ul>{datos.sugerencias.map((s, i) => <Sugerencia key={i} s={s} />)}</ul>}
            {sugerenciasPorPropiedad.map((p) => (
              <div key={p.id} className="py-2">
                <p className="mt-1 text-sm font-semibold text-[#222A33]">{p.titulo}</p>
                <ul>{p.sugerencias.map((s, i) => <Sugerencia key={i} s={s} />)}</ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}