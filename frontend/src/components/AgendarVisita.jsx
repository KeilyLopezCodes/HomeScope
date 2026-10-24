import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { misVisitas, solicitarVisita } from '../api/agendaApi';
import { formatoFechaHora } from '../utils/fechas';
import SelectorHorario from './agenda/SelectorHorario';

const ESTADOS_ACTIVOS = ['solicitada', 'confirmada', 'reprogramada'];
const TEXTO_ESTADO = {
  solicitada: 'Esperando que el vendedor la confirme',
  confirmada: 'Confirmada',
  reprogramada: 'El vendedor propuso un nuevo horario: acéptalo o cancela',
};

// Solicitud de visita desde la ficha de una propiedad (la ve el comprador, no el dueño)
export default function AgendarVisita({ propiedad }) {
  const { user, estaAutenticado } = useAuth();
  const [activa, setActiva] = useState(undefined); // visita activa de este comprador en esta propiedad
  const [horario, setHorario] = useState(null);
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [recarga, setRecarga] = useState(0);

  const vendedorId = propiedad.vendedor_id ?? propiedad.usuario?.id;
  const esDueno = estaAutenticado && user && Number(user.id) === Number(vendedorId);

  useEffect(() => {
    if (!estaAutenticado || esDueno) return undefined;
    let activo = true;
    misVisitas()
      .then((lista) => {
        if (!activo) return;
        setActiva(lista.find((v) => v.mi_rol === 'comprador' && v.propiedad.id === propiedad.id && ESTADOS_ACTIVOS.includes(v.estado)) || null);
      })
      .catch(() => activo && setActiva(null));
    return () => { activo = false; };
  }, [estaAutenticado, esDueno, propiedad.id, recarga]);

  if (esDueno) return null;

  const cuadro = 'space-y-4 rounded-xl border border-slate-200 bg-white p-5';

  if (!estaAutenticado) {
    return (
      <section className={cuadro}>
        <h2 className="text-lg font-semibold text-[#222A33]">Agendar una visita</h2>
        <p className="text-sm text-slate-600">
          <Link to="/login" className="font-medium text-[#1E4273] underline">Inicia sesión</Link> para elegir una fecha y hora.
        </p>
      </section>
    );
  }

  if (activa === undefined) return null;

  if (activa) {
    return (
      <section className={cuadro}>
        <h2 className="text-lg font-semibold text-[#222A33]">Tu visita</h2>
        <p className="text-sm text-slate-700">
          <strong className="capitalize">{formatoFechaHora(activa.fecha_hora)}</strong> · {TEXTO_ESTADO[activa.estado]}
        </p>
        <Link to="/visitas" className="inline-block rounded-lg border border-[#1E4273] px-4 py-2 text-sm font-semibold text-[#1E4273] hover:bg-blue-50">
          Ver mis visitas
        </Link>
      </section>
    );
  }

  async function enviar() {
    setEnviando(true);
    setError('');
    try {
      await solicitarVisita(propiedad.id, horario, nota);
      setExito(true);
      setHorario(null);
      setNota('');
      setRecarga((n) => n + 1); // muestra la visita recién creada
    } catch (e) {
      setError(e.message);
      setRecarga((n) => n + 1); // por si el horario se ocupó o ya existía una visita
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className={cuadro}>
      <h2 className="text-lg font-semibold text-[#222A33]">Agendar una visita</h2>
      {exito && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-[#2E9E6B]">Solicitud enviada. El vendedor la confirmará y te avisaremos.</p>}

      <SelectorHorario key={recarga} propiedadId={propiedad.id} valor={horario} onChange={setHorario} />

      {horario && (
        <>
          <label className="block text-sm font-medium text-[#222A33]">
            Nota para el vendedor (opcional)
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="Ej.: voy con mi familia, somos 3 personas"
              className="mt-1 w-full resize-none rounded-lg border border-slate-300 p-2.5 text-sm font-normal"
            />
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={enviar}
            disabled={enviando}
            className="rounded-lg bg-[#1E4273] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163357] disabled:opacity-50"
          >
            {enviando ? 'Enviando…' : 'Solicitar visita'}
          </button>
        </>
      )}
      {!horario && error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </section>
  );
}