import { useEffect, useMemo, useRef, useState } from 'react';
import { claveDia, formatoDiaCorto, formatoDiaLargo, rangoDeDias } from '../utils/fechas';

// Colores validados (diferencia entre vecinos, contraste con el fondo y visión de colores).
// La identidad nunca depende solo del color: hay leyenda con totales, tooltip y vista de tabla.
const SERIES = [
  { clave: 'vistas', nombre: 'Vistas', color: '#2F6DB5' },
  { clave: 'favoritos', nombre: 'Favoritos', color: '#2E9E6B' },
  { clave: 'mensajes', nombre: 'Mensajes', color: '#D97706' },
];
const ALTO = 280;
const M = { izq: 40, der: 16, arr: 14, abj: 30 };
const TEXTO = '#64748b'; // slate-500
const REJILLA = '#e2e8f0'; // slate-200
const SUPERFICIE = '#ffffff';

function pasoLimpio(max, marcas = 4) {
  const bruto = Math.max(max, 1) / marcas;
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / pot;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pot;
}
const compacto = (n) => (n >= 1000 ? `${Math.round(n / 100) / 10}K` : String(n));

function useAncho(ref) {
  const [ancho, setAncho] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const obs = new ResizeObserver(([e]) => setAncho(Math.max(280, Math.floor(e.contentRect.width))));
    obs.observe(el);
    setAncho(Math.max(280, Math.floor(el.getBoundingClientRect().width) || 640));
    return () => obs.disconnect();
  }, [ref]);
  return ancho;
}

/** Interés a lo largo del tiempo: vistas, favoritos y mensajes por día. `propiedadId` null = todas las propiedades. */
export default function GraficaInteres({ serie, periodo, propiedadId = null, titulo = 'Interés a lo largo del tiempo' }) {
  const caja = useRef(null);
  const ancho = useAncho(caja);
  const [visibles, setVisibles] = useState({ vistas: true, favoritos: true, mensajes: true });
  const [hover, setHover] = useState(null);
  const [tabla, setTabla] = useState(false);

  const datos = useMemo(() => {
    const dias = rangoDeDias(claveDia(new Date(periodo.desde)), claveDia(new Date(periodo.hasta)));
    const porDia = new Map(dias.map((fecha) => [fecha, { fecha, vistas: 0, favoritos: 0, mensajes: 0 }]));
    serie.forEach((r) => {
      if (propiedadId != null && r.propiedad_id !== propiedadId) return;
      const d = porDia.get(r.fecha);
      if (d) { d.vistas += r.vistas; d.favoritos += r.favoritos; d.mensajes += r.mensajes; }
    });
    return [...porDia.values()];
  }, [serie, periodo, propiedadId]);

  const totales = SERIES.reduce((acc, s) => ({ ...acc, [s.clave]: datos.reduce((a, d) => a + d[s.clave], 0) }), {});
  const activas = SERIES.filter((s) => visibles[s.clave]);
  const maxValor = Math.max(0, ...activas.flatMap((s) => datos.map((d) => d[s.clave])));
  const paso = pasoLimpio(maxValor);
  const yMax = Math.max(paso * 4, 4);
  const n = datos.length;
  const anchoUtil = ancho - M.izq - M.der;
  const altoUtil = ALTO - M.arr - M.abj;
  const x = (i) => M.izq + (n <= 1 ? anchoUtil / 2 : (i * anchoUtil) / (n - 1));
  const y = (v) => M.arr + altoUtil - (v / yMax) * altoUtil;
  const cadaX = Math.max(1, Math.ceil(n / 6));

  const alternar = (clave) => {
    setVisibles((prev) => {
      const quedan = SERIES.filter((s) => prev[s.clave]).length;
      if (prev[clave] && quedan === 1) return prev; // siempre queda al menos una serie
      return { ...prev, [clave]: !prev[clave] };
    });
  };

  const indiceCercano = (clientX, rect) => {
    const px = clientX - rect.left - M.izq;
    return Math.min(n - 1, Math.max(0, Math.round(px / (anchoUtil / Math.max(1, n - 1)))));
  };
  const alMover = (e) => setHover(indiceCercano(e.clientX, e.currentTarget.getBoundingClientRect()));
  const alTeclear = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); setHover((h) => Math.min(n - 1, (h ?? -1) + 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setHover((h) => Math.max(0, (h ?? n) - 1)); }
    if (e.key === 'Escape') setHover(null);
  };

  const hayActividad = SERIES.some((s) => totales[s.clave] > 0);
  const resumenAccesible = `${titulo}. ${SERIES.map((s) => `${s.nombre}: ${totales[s.clave]}`).join(', ')} en ${n} días.`;
  const d = hover != null ? datos[hover] : null;
  const izquierdaTip = d ? (x(hover) > ancho * 0.6 ? x(hover) - 168 : x(hover) + 12) : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <ul className="flex flex-wrap gap-2" aria-label="Series">
          {SERIES.map((s) => (
            <li key={s.clave}>
              <button
                type="button"
                aria-pressed={visibles[s.clave]}
                onClick={() => alternar(s.clave)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${visibles[s.clave] ? 'border-slate-300 bg-white text-[#222A33]' : 'border-slate-200 bg-slate-50 text-slate-400'}`}
              >
                <span className="h-0.5 w-4 rounded" style={{ background: visibles[s.clave] ? s.color : '#cbd5e1' }} aria-hidden="true" />
                <span>{s.nombre}</span>
                <strong className="font-semibold tabular-nums">{totales[s.clave]}</strong>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setTabla((t) => !t)} className="rounded-lg px-2 py-1 text-xs font-medium text-[#1E4273] hover:bg-blue-50">
          {tabla ? 'Ver gráfica' : 'Ver tabla'}
        </button>
      </div>

      {!hayActividad ? (
        <p className="rounded-lg bg-slate-50 py-12 text-center text-sm text-slate-500">Aún no hay actividad en este periodo.</p>
      ) : tabla ? (
        <div className="max-h-72 overflow-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <caption className="sr-only">{resumenAccesible}</caption>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-3 py-2 font-medium">Día</th>{SERIES.map((s) => <th key={s.clave} className="px-3 py-2 text-right font-medium">{s.nombre}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {datos.map((fila) => (
                <tr key={fila.fecha}>
                  <td className="px-3 py-1.5 text-slate-600 first-letter:uppercase">{formatoDiaLargo(fila.fecha)}</td>
                  {SERIES.map((s) => <td key={s.clave} className="px-3 py-1.5 text-right tabular-nums">{fila[s.clave]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={caja} className="relative">
          <svg
            width={ancho}
            height={ALTO}
            role="img"
            aria-label={resumenAccesible}
            tabIndex={0}
            onKeyDown={alTeclear}
            onFocus={() => hover == null && setHover(n - 1)}
            onBlur={() => setHover(null)}
            onPointerMove={alMover}
            onPointerLeave={() => setHover(null)}
            className="block touch-pan-y rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E4273]"
          >
            {/* Rejilla y eje Y */}
            {[0, 1, 2, 3, 4].map((k) => (
              <g key={k}>
                <line x1={M.izq} x2={ancho - M.der} y1={y(k * paso)} y2={y(k * paso)} stroke={REJILLA} strokeWidth="1" />
                <text x={M.izq - 8} y={y(k * paso)} dy="0.32em" textAnchor="end" fontSize="11" fill={TEXTO}>{compacto(k * paso)}</text>
              </g>
            ))}
            {/* Eje X */}
            {datos.map((fila, i) => (n - 1 - i) % cadaX === 0 && (
              <text key={fila.fecha} x={x(i)} y={ALTO - 8} textAnchor="middle" fontSize="11" fill={TEXTO}>{formatoDiaCorto(fila.fecha)}</text>
            ))}

            {/* Líneas */}
            {activas.map((s) => (
              <polyline
                key={s.clave}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={datos.map((fila, i) => `${x(i)},${y(fila[s.clave])}`).join(' ')}
              />
            ))}
            {/* Punto final de cada serie, con anillo del color de la superficie */}
            {activas.map((s) => (
              <circle key={`fin-${s.clave}`} cx={x(n - 1)} cy={y(datos[n - 1][s.clave])} r="4" fill={s.color} stroke={SUPERFICIE} strokeWidth="2" />
            ))}

            {/* Cruz del día señalado */}
            {d && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={M.arr} y2={M.arr + altoUtil} stroke="#94a3b8" strokeWidth="1" />
                {activas.map((s) => <circle key={s.clave} cx={x(hover)} cy={y(d[s.clave])} r="4.5" fill={s.color} stroke={SUPERFICIE} strokeWidth="2" />)}
              </g>
            )}
          </svg>

          {d && (
            <div
              role="status"
              className="pointer-events-none absolute z-10 w-40 rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-md"
              style={{ left: izquierdaTip, top: 8 }}
            >
              <p className="mb-1.5 text-slate-500 first-letter:uppercase">{formatoDiaLargo(d.fecha)}</p>
              {activas.map((s) => (
                <p key={s.clave} className="flex items-center justify-between gap-2 py-0.5">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="h-0.5 w-3 rounded" style={{ background: s.color }} aria-hidden="true" />{s.nombre}
                  </span>
                  <strong className="text-sm tabular-nums text-[#222A33]">{d[s.clave]}</strong>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}