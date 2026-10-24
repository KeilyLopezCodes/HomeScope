import { useEffect, useMemo, useState } from 'react';
import { obtenerHorarios } from '../../api/agendaApi';
import { MESES, DIAS_CORTOS, cuadriculaDelMes, formatoDiaLargo, formatoHora } from '../../utils/fechas';

/**
 * Calendario mensual + horas libres de una propiedad (el comprador elige; el vendedor lo reusa para reprogramar).
 * `onChange(inicioISO)` recibe el horario elegido, o null si se cambia de día.
 */
export default function SelectorHorario({ propiedadId, valor, onChange, diasMax = 30 }) {
  const [dias, setDias] = useState(null); // [{ fecha: 'YYYY-MM-DD', horarios: [{ inicio, fin }] }]
  const [error, setError] = useState('');
  const [mes, setMes] = useState(null); // { anio, mes }
  const [diaElegido, setDiaElegido] = useState(null);

  useEffect(() => {
    let activo = true;
    setDias(null);
    setError('');
    obtenerHorarios(propiedadId, diasMax)
      .then((lista) => {
        if (!activo) return;
        setDias(lista);
        if (lista.length) {
          const [a, m] = lista[0].fecha.split('-').map(Number);
          setMes({ anio: a, mes: m - 1 });
        }
      })
      .catch((e) => activo && setError(e.message));
    return () => { activo = false; };
  }, [propiedadId, diasMax]);

  const porFecha = useMemo(() => new Map((dias || []).map((d) => [d.fecha, d.horarios])), [dias]);
  const semanas = useMemo(() => (mes ? cuadriculaDelMes(mes.anio, mes.mes) : []), [mes]);

  if (error) return <p role="alert" className="text-sm text-red-600">{error}</p>;
  if (!dias) return <p className="text-sm text-slate-500">Cargando horarios…</p>;
  if (dias.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        No hay horarios disponibles en los próximos {diasMax} días. Puedes escribir al vendedor desde Mensajes.
      </p>
    );
  }

  const [primeroA, primeroM] = dias[0].fecha.split('-').map(Number);
  const [ultimoA, ultimoM] = dias[dias.length - 1].fecha.split('-').map(Number);
  const indice = (a, m) => a * 12 + m;
  const puedeIrAtras = indice(mes.anio, mes.mes) > indice(primeroA, primeroM - 1);
  const puedeIrAdelante = indice(mes.anio, mes.mes) < indice(ultimoA, ultimoM - 1);
  const mover = (delta) => {
    const t = mes.anio * 12 + mes.mes + delta;
    setMes({ anio: Math.floor(t / 12), mes: t % 12 });
  };
  const horasDelDia = diaElegido ? porFecha.get(diaElegido) || [] : [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => mover(-1)} disabled={!puedeIrAtras} aria-label="Mes anterior"
            className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30">←</button>
          <p className="text-sm font-semibold capitalize text-[#222A33]">{MESES[mes.mes]} {mes.anio}</p>
          <button type="button" onClick={() => mover(1)} disabled={!puedeIrAdelante} aria-label="Mes siguiente"
            className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30">→</button>
        </div>

        <div role="grid" aria-label="Calendario de visitas" className="grid grid-cols-7 gap-1 text-center">
          {DIAS_CORTOS.map((d, i) => <span key={i} className="py-1 text-xs font-medium text-slate-400">{d}</span>)}
          {semanas.flat().map((dia, i) => {
            if (!dia) return <span key={`v${i}`} />;
            const hay = porFecha.has(dia);
            const elegido = dia === diaElegido;
            return (
              <button
                key={dia}
                type="button"
                disabled={!hay}
                aria-pressed={elegido}
                aria-label={hay ? `${formatoDiaLargo(dia)}, ${porFecha.get(dia).length} horarios libres` : `${formatoDiaLargo(dia)}, sin horarios`}
                onClick={() => { setDiaElegido(dia); onChange(null); }}
                className={`h-10 rounded-lg text-sm transition ${
                  elegido ? 'bg-[#1E4273] font-semibold text-white'
                    : hay ? 'bg-emerald-50 font-medium text-[#2E9E6B] hover:bg-emerald-100'
                      : 'text-slate-300'
                }`}
              >
                {Number(dia.slice(8))}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500"><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-emerald-100 align-middle" /> Días con horarios libres</p>
      </div>

      {diaElegido && (
        <div>
          <p className="mb-2 text-sm font-medium text-[#222A33] first-letter:uppercase">{formatoDiaLargo(diaElegido)}</p>
          <div className="flex flex-wrap gap-2">
            {horasDelDia.map((h) => (
              <button
                key={h.inicio}
                type="button"
                aria-pressed={valor === h.inicio}
                onClick={() => onChange(h.inicio)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  valor === h.inicio ? 'border-[#1E4273] bg-[#1E4273] text-white' : 'border-slate-300 bg-white text-[#222A33] hover:border-[#1E4273]'
                }`}
              >
                {formatoHora(h.inicio)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Cada visita dura 1 hora. Hora de Guatemala.</p>
        </div>
      )}
    </div>
  );
}