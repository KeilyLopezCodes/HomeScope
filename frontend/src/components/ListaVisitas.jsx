import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  aceptarReprogramacion, cancelarVisita, confirmarVisita, misVisitas, reprogramarVisita,
} from '../api/agendaApi';
import { formatoFechaHora } from '../utils/fechas';
import SelectorHorario from './agenda/SelectorHorario';

// Texto y color de cada estado según quién mira la visita
const ESTADO = {
  solicitada: { vendedor: ['Por confirmar', 'amber'], comprador: ['Esperando al vendedor', 'amber'] },
  confirmada: { vendedor: ['Confirmada', 'green'], comprador: ['Confirmada', 'green'] },
  reprogramada: { vendedor: ['Esperando al comprador', 'amber'], comprador: ['Nuevo horario propuesto', 'blue'] },
  cancelada: { vendedor: ['Cancelada', 'gray'], comprador: ['Cancelada', 'gray'] },
  rechazada: { vendedor: ['Rechazada', 'gray'], comprador: ['Rechazada por el vendedor', 'gray'] },
  realizada: { vendedor: ['Realizada', 'gray'], comprador: ['Realizada', 'gray'] },
};
const COLOR = {
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  green: 'bg-emerald-50 text-[#2E9E6B] ring-[#2E9E6B]/20',
  blue: 'bg-blue-50 text-[#1E4273] ring-[#1E4273]/20',
  gray: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};
const FINALES = ['cancelada', 'rechazada', 'realizada'];

const porFecha = (a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora);

function Etiqueta({ visita }) {
  const [texto, color] = ESTADO[visita.estado]?.[visita.mi_rol] || [visita.estado, 'gray'];
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${COLOR[color]}`}>{texto}</span>;
}

function Boton({ variante = 'secundario', ...props }) {
  const estilos = {
    primario: 'bg-[#1E4273] text-white hover:bg-[#163357]',
    exito: 'bg-[#2E9E6B] text-white hover:bg-[#25835a]',
    peligro: 'border border-red-300 bg-white text-red-600 hover:bg-red-50',
    secundario: 'border border-slate-300 bg-white text-[#222A33] hover:bg-slate-50',
  };
  return <button type="button" className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${estilos[variante]}`} {...props} />;
}

function Modal({ titulo, children, onCerrar }) {
  useEffect(() => {
    const alPresionar = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#222A33]/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h3 className="mb-3 text-lg font-semibold text-[#222A33]">{titulo}</h3>
        {children}
      </div>
    </div>
  );
}

/**
 * Visitas del usuario. `rol="vendedor"` muestra las solicitudes de sus propiedades; `rol="comprador"`, las que él pidió.
 * El vendedor confirma, reprograma o rechaza; el comprador acepta el nuevo horario o cancela.
 */
export default function ListaVisitas({ rol }) {
  const [visitas, setVisitas] = useState(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [ocupado, setOcupado] = useState(null); // id de la visita en proceso
  const [reprogramando, setReprogramando] = useState(null);
  const [nuevoHorario, setNuevoHorario] = useState(null);
  const [cancelando, setCancelando] = useState(null);
  const [errorModal, setErrorModal] = useState('');

  const cargar = useCallback(async () => {
    try {
      const todas = await misVisitas();
      setVisitas(todas.filter((v) => v.mi_rol === rol));
    } catch (e) {
      setError(e.message);
      setVisitas((prev) => prev ?? []);
    }
  }, [rol]);

  useEffect(() => { cargar(); }, [cargar]);

  async function ejecutar(visita, accion, mensaje) {
    setOcupado(visita.id);
    setError('');
    setExito('');
    try {
      await accion();
      setExito(mensaje);
      await cargar();
      return true;
    } catch (e) {
      setError(e.message);
      await cargar();
      return false;
    } finally {
      setOcupado(null);
    }
  }

  async function confirmarReprogramacion() {
    setErrorModal('');
    setOcupado(reprogramando.id);
    try {
      await reprogramarVisita(reprogramando.id, nuevoHorario);
      setReprogramando(null);
      setNuevoHorario(null);
      setExito('Propusiste un nuevo horario. El comprador debe aceptarlo.');
      await cargar();
    } catch (e) {
      setErrorModal(e.message);
    } finally {
      setOcupado(null);
    }
  }

  async function confirmarCancelacion() {
    const v = cancelando;
    setCancelando(null);
    await ejecutar(v, () => cancelarVisita(v.id), v.mi_rol === 'vendedor' && v.estado === 'solicitada' ? 'Solicitud rechazada.' : 'Visita cancelada.');
  }

  if (!visitas) return <p className="py-10 text-center text-sm text-slate-500">Cargando visitas…</p>;

  const requierenRespuesta = visitas
    .filter((v) => (rol === 'vendedor' ? v.estado === 'solicitada' : v.estado === 'reprogramada'))
    .sort(porFecha);
  const idsRespuesta = new Set(requierenRespuesta.map((v) => v.id));
  const proximas = visitas.filter((v) => !FINALES.includes(v.estado) && !idsRespuesta.has(v.id)).sort(porFecha);
  const historial = visitas.filter((v) => FINALES.includes(v.estado)).sort((a, b) => porFecha(b, a));

  function tarjeta(v) {
    const ocupada = ocupado === v.id;
    return (
      <li key={v.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={`/propiedades/${v.propiedad.id}`} className="font-semibold text-[#222A33] hover:text-[#1E4273] hover:underline">{v.propiedad.titulo}</Link>
            {rol === 'vendedor' && <p className="text-sm text-slate-600">Solicita: {v.comprador.nombre}</p>}
          </div>
          <Etiqueta visita={v} />
        </div>

        <p className="text-sm text-[#222A33]">
          <span className="capitalize">{formatoFechaHora(v.fecha_hora)}</span>
          {v.estado === 'reprogramada' && v.fecha_hora_solicitada && (
            <span className="text-slate-500"> (antes: {formatoFechaHora(v.fecha_hora_solicitada)})</span>
          )}
        </p>
        {v.nota_comprador && <p className="rounded-lg bg-slate-50 p-2.5 text-sm text-slate-600">“{v.nota_comprador}”</p>}

        <div className="flex flex-wrap gap-2">
          {rol === 'vendedor' && v.estado === 'solicitada' && (
            <Boton variante="exito" disabled={ocupada} onClick={() => ejecutar(v, () => confirmarVisita(v.id), 'Visita confirmada. El comprador fue notificado.')}>Confirmar</Boton>
          )}
          {rol === 'vendedor' && ['solicitada', 'confirmada', 'reprogramada'].includes(v.estado) && (
            <Boton disabled={ocupada} onClick={() => { setErrorModal(''); setNuevoHorario(null); setReprogramando(v); }}>Reprogramar</Boton>
          )}
          {rol === 'comprador' && v.estado === 'reprogramada' && (
            <Boton variante="exito" disabled={ocupada} onClick={() => ejecutar(v, () => aceptarReprogramacion(v.id), 'Aceptaste el nuevo horario. La visita quedó confirmada.')}>Aceptar nuevo horario</Boton>
          )}
          {!FINALES.includes(v.estado) && (
            <Boton variante="peligro" disabled={ocupada} onClick={() => setCancelando(v)}>
              {rol === 'vendedor' && v.estado === 'solicitada' ? 'Rechazar' : 'Cancelar'}
            </Boton>
          )}
        </div>
      </li>
    );
  }

  const seccion = (titulo, lista, vacio) => (
    <section key={titulo}>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{titulo} {lista.length > 0 && <span className="text-slate-400">({lista.length})</span>}</h2>
      {lista.length === 0 ? <p className="text-sm text-slate-500">{vacio}</p> : <ul className="space-y-3">{lista.map(tarjeta)}</ul>}
    </section>
  );

  return (
    <div className="space-y-6">
      {exito && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-[#2E9E6B]">{exito}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {seccion(
        rol === 'vendedor' ? 'Por responder' : 'Requieren tu respuesta',
        requierenRespuesta,
        rol === 'vendedor' ? 'No tienes solicitudes pendientes.' : 'Nada pendiente por ahora.',
      )}
      {seccion('Próximas y en curso', proximas, 'No hay visitas programadas.')}
      {historial.length > 0 && seccion('Historial', historial, '')}

      {reprogramando && (
        <Modal titulo="Proponer otro horario" onCerrar={() => setReprogramando(null)}>
          <p className="mb-3 text-sm text-slate-600">Elige un horario dentro de tu disponibilidad. El comprador deberá aceptarlo.</p>
          <SelectorHorario propiedadId={reprogramando.propiedad.id} valor={nuevoHorario} onChange={setNuevoHorario} />
          {errorModal && <p role="alert" className="mt-3 text-sm text-red-600">{errorModal}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Boton onClick={() => setReprogramando(null)}>Cancelar</Boton>
            <Boton variante="primario" disabled={!nuevoHorario || ocupado === reprogramando.id} onClick={confirmarReprogramacion}>Proponer horario</Boton>
          </div>
        </Modal>
      )}

      {cancelando && (
        <Modal titulo={cancelando.mi_rol === 'vendedor' && cancelando.estado === 'solicitada' ? 'Rechazar solicitud' : 'Cancelar visita'} onCerrar={() => setCancelando(null)}>
          <p className="text-sm text-slate-600">
            {cancelando.mi_rol === 'vendedor' ? `${cancelando.comprador.nombre} recibirá un aviso.` : 'El vendedor recibirá un aviso.'} Esta acción no se puede deshacer.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Boton onClick={() => setCancelando(null)}>Volver</Boton>
            <button type="button" onClick={confirmarCancelacion} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">Confirmar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}