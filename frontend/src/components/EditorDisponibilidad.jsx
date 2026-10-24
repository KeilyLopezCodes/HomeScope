import { useEffect, useState } from 'react';
import { guardarDisponibilidad, obtenerMiDisponibilidad } from '../api/agendaApi';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']; // dia_semana 1..7
const aMinutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// Horarios semanales en los que el vendedor atiende visitas (generales: valen para todas sus propiedades)
export default function EditorDisponibilidad() {
  const [franjas, setFranjas] = useState(null); // [{ dia_semana, hora_inicio, hora_fin }]
  const [especificas, setEspecificas] = useState(0);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    obtenerMiDisponibilidad()
      .then((lista) => {
        if (!activo) return;
        setFranjas(lista.filter((f) => f.propiedad_id === null).map(({ dia_semana, hora_inicio, hora_fin }) => ({ dia_semana, hora_inicio, hora_fin })));
        setEspecificas(new Set(lista.filter((f) => f.propiedad_id !== null).map((f) => f.propiedad_id)).size);
      })
      .catch((e) => { if (activo) { setError(e.message); setFranjas([]); } });
    return () => { activo = false; };
  }, []);

  if (!franjas) return <p className="py-10 text-center text-sm text-slate-500">Cargando disponibilidad…</p>;

  const cambiar = (indice, campo, valor) => {
    setExito('');
    setFranjas((prev) => prev.map((f, i) => (i === indice ? { ...f, [campo]: valor } : f)));
  };
  const agregar = (dia) => { setExito(''); setFranjas((prev) => [...prev, { dia_semana: dia, hora_inicio: '09:00', hora_fin: '12:00' }]); };
  const quitar = (indice) => { setExito(''); setFranjas((prev) => prev.filter((_, i) => i !== indice)); };
  const entreSemana = () => {
    setExito('');
    setFranjas([1, 2, 3, 4, 5].flatMap((d) => [
      { dia_semana: d, hora_inicio: '09:00', hora_fin: '12:00' },
      { dia_semana: d, hora_inicio: '14:00', hora_fin: '17:00' },
    ]));
  };

  function validar() {
    for (const f of franjas) {
      if (!f.hora_inicio || !f.hora_fin) return `${DIAS[f.dia_semana - 1]}: completa la hora de inicio y de fin.`;
      if (aMinutos(f.hora_fin) - aMinutos(f.hora_inicio) < 60) return `${DIAS[f.dia_semana - 1]}: cada franja debe durar al menos 1 hora.`;
    }
    return '';
  }

  async function guardar() {
    const problema = validar();
    if (problema) { setError(problema); setExito(''); return; }
    setGuardando(true);
    setError('');
    setExito('');
    try {
      await guardarDisponibilidad(franjas);
      setExito('Disponibilidad guardada. Los compradores ya pueden pedir visitas en estos horarios.');
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Define en qué horarios puedes mostrar tus propiedades. Las visitas duran 1 hora y los compradores solo ven los espacios libres.
      </p>
      {especificas > 0 && (
        <p className="rounded-lg bg-blue-50 p-3 text-xs text-[#1E4273]">
          Tienes horarios propios en {especificas} propiedad{especificas === 1 ? '' : 'es'}; esos tienen prioridad sobre estos horarios generales.
        </p>
      )}

      <button type="button" onClick={entreSemana} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-[#222A33] hover:bg-slate-50">
        Usar lunes a viernes (9–12 y 14–17)
      </button>

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {DIAS.map((nombre, i) => {
          const dia = i + 1;
          const propias = franjas.map((f, indice) => ({ f, indice })).filter(({ f }) => f.dia_semana === dia);
          return (
            <div key={dia} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
              <p className="w-28 shrink-0 pt-1.5 text-sm font-medium text-[#222A33]">{nombre}</p>
              <div className="flex-1 space-y-2">
                {propias.length === 0 && <p className="pt-1.5 text-sm text-slate-400">Sin atención</p>}
                {propias.map(({ f, indice }) => (
                  <div key={indice} className="flex flex-wrap items-center gap-2">
                    <input type="time" value={f.hora_inicio} onChange={(e) => cambiar(indice, 'hora_inicio', e.target.value)}
                      aria-label={`${nombre}: hora de inicio`} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                    <span className="text-slate-400">a</span>
                    <input type="time" value={f.hora_fin} onChange={(e) => cambiar(indice, 'hora_fin', e.target.value)}
                      aria-label={`${nombre}: hora de fin`} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                    <button type="button" onClick={() => quitar(indice)} className="rounded-lg px-2 py-1.5 text-xs text-red-600 hover:bg-red-50" aria-label={`Quitar franja del ${nombre}`}>Quitar</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => agregar(dia)} className="self-start rounded-lg px-2 py-1.5 text-xs font-medium text-[#1E4273] hover:bg-blue-50">+ Agregar franja</button>
            </div>
          );
        })}
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {exito && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-[#2E9E6B]">{exito}</p>}
      <button type="button" onClick={guardar} disabled={guardando}
        className="rounded-lg bg-[#1E4273] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163357] disabled:opacity-50">
        {guardando ? 'Guardando…' : 'Guardar disponibilidad'}
      </button>
    </div>
  );
}