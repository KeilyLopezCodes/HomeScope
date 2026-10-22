import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { EVENTOS } from '../api/chatSocket';
import { enviarMensaje, listarConversaciones, listarMensajes } from '../api/chatApi';

const MAX = 2000;
const hora = (f) => new Date(f).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });

export default function Mensajes() {
  const { id } = useParams();
  const { suscribir, refrescarNoLeidos, usuarioId } = useChat();
  const [conversaciones, setConversaciones] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState('');

  const cargarLista = useCallback(async () => {
    try {
      setConversaciones(await listarConversaciones());
      setErrorLista('');
    } catch (e) {
      setErrorLista(e.message);
    } finally {
      setCargandoLista(false);
    }
  }, []);

  useEffect(() => { cargarLista(); }, [cargarLista]);

  // Un mensaje nuevo reordena la lista y actualiza su vista previa sin recargar
  useEffect(() => suscribir((evento) => {
    if (evento === EVENTOS.NUEVO || evento === EVENTOS.ENVIADO) cargarLista();
  }), [suscribir, cargarLista]);

  const activa = conversaciones.find((c) => String(c.id) === id);

  return (
    <div className="mx-auto grid min-h-[80vh] max-w-5xl gap-4 p-4 md:grid-cols-[18rem_1fr]">
      <aside className={`${id ? 'hidden md:block' : ''} rounded-xl border border-[#222A33]/10`} aria-label="Conversaciones">
        <h1 className="border-b border-[#222A33]/10 px-4 py-3 text-lg font-semibold">Mensajes</h1>
        {cargandoLista && <p className="p-4 text-sm text-[#222A33]/60">Cargando…</p>}
        {errorLista && <p role="alert" className="p-4 text-sm text-red-600">{errorLista}</p>}
        {!cargandoLista && !errorLista && conversaciones.length === 0 && (
          <p className="p-4 text-sm text-[#222A33]/60">Aún no tienes conversaciones. Escríbele a un vendedor desde la ficha de una propiedad.</p>
        )}
        <ul className="divide-y divide-[#222A33]/10">
          {conversaciones.map((c) => (
            <li key={c.id}>
              <Link to={`/mensajes/${c.id}`}
                className={`block px-4 py-3 hover:bg-[#1E4273]/5 ${String(c.id) === id ? 'bg-[#1E4273]/10' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{c.otro_usuario.nombre}</span>
                  {c.no_leidos > 0 && (
                    <span className="rounded-full bg-[#1E4273] px-2 text-xs text-white" aria-label={`${c.no_leidos} sin leer`}>
                      {c.no_leidos}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-[#1E4273]">{c.propiedad.titulo}</p>
                <p className="truncate text-sm text-[#222A33]/60">{c.ultimo_mensaje?.contenido || 'Sin mensajes aún'}</p>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <section className={`${id ? '' : 'hidden md:flex'} flex-col rounded-xl border border-[#222A33]/10`}>
        {id ? (
          <Chat key={id} conversacionId={id} cabecera={activa} usuarioId={usuarioId}
            suscribir={suscribir} onLeido={() => { refrescarNoLeidos(); cargarLista(); }} />
        ) : (
          <p className="m-auto p-6 text-[#222A33]/60">Selecciona una conversación.</p>
        )}
      </section>
    </div>
  );
}

function Chat({ conversacionId, cabecera, usuarioId, suscribir, onLeido }) {
  const navigate = useNavigate();
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [texto, setTexto] = useState('');
  const fin = useRef(null);

  const agregar = useCallback((m) => {
    setMensajes((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  // Carga inicial (el backend marca como leídos los del otro)
  useEffect(() => {
    let vivo = true;
    listarMensajes(conversacionId)
      .then((r) => { if (vivo) { setMensajes(r.mensajes); onLeido(); } })
      .catch((e) => vivo && setError(e.message))
      .finally(() => vivo && setCargando(false));
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversacionId]);

  // Mensajes en vivo, sin recargar
  useEffect(() => suscribir((evento, payload) => {
    if (evento === EVENTOS.NUEVO && payload.mensaje.conversacion_id === Number(conversacionId)) {
      agregar(payload.mensaje);
      listarMensajes(conversacionId, { limite: 1 }).then(onLeido).catch(() => {}); // marca leído
    }
    if (evento === EVENTOS.ENVIADO && payload.mensaje.conversacion_id === Number(conversacionId)) {
      agregar(payload.mensaje); // enviado desde otra pestaña mía
    }
    if (evento === EVENTOS.LEIDOS && payload.conversacion_id === Number(conversacionId)) {
      setMensajes((prev) => prev.map((m) => (m.remitente_id === usuarioId && !m.leido_en ? { ...m, leido_en: new Date().toISOString() } : m)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [conversacionId, usuarioId, suscribir, agregar]);

  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensajes]);

  // Envío optimista: aparece al instante (<1 s) y se confirma con la respuesta del servidor
  const enviar = async (contenido, idTemporal) => {
    const tmp = idTemporal || `tmp-${Date.now()}`;
    if (!idTemporal) {
      setMensajes((prev) => [...prev, {
        id: tmp, conversacion_id: Number(conversacionId), remitente_id: usuarioId,
        contenido, fecha_envio: new Date().toISOString(), leido_en: null, estadoLocal: 'enviando',
      }]);
    } else {
      setMensajes((prev) => prev.map((m) => (m.id === tmp ? { ...m, estadoLocal: 'enviando' } : m)));
    }
    try {
      const real = await enviarMensaje(conversacionId, contenido);
      setMensajes((prev) => {
        // si el evento por socket llegó antes que la respuesta, se descarta el duplicado
        const sinTmp = prev.filter((m) => m.id !== tmp);
        return sinTmp.some((m) => m.id === real.id) ? sinTmp : [...sinTmp, real];
      });
      onLeido();
    } catch (e) {
      setMensajes((prev) => prev.map((m) => (m.id === tmp ? { ...m, estadoLocal: 'error', errorMsg: e.message } : m)));
    }
  };

  const alEnviar = (ev) => {
    ev.preventDefault();
    const limpio = texto.trim();
    if (!limpio || limpio.length > MAX) return;
    setTexto('');
    enviar(limpio);
  };

  return (
    <>
      <header className="flex items-center gap-3 border-b border-[#222A33]/10 px-4 py-3">
        <button type="button" onClick={() => navigate('/mensajes')} className="md:hidden" aria-label="Volver a la lista">←</button>
        <div className="min-w-0">
          <p className="truncate font-semibold">{cabecera?.otro_usuario.nombre || 'Conversación'}</p>
          {cabecera && (
            <Link to={`/propiedades/${cabecera.propiedad.id}`} className="truncate text-sm text-[#1E4273] underline">
              {cabecera.propiedad.titulo}
            </Link>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: '60vh' }} aria-live="polite">
        {cargando && <p className="text-sm text-[#222A33]/60">Cargando mensajes…</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {!cargando && !error && mensajes.length === 0 && (
          <p className="text-sm text-[#222A33]/60">Escribe el primer mensaje. Por seguridad, no compartas teléfonos ni correos aquí.</p>
        )}
        {mensajes.map((m) => {
          const mio = m.remitente_id === usuarioId;
          return (
            <div key={m.id} className={`flex ${mio ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mio ? 'bg-[#1E4273] text-white' : 'bg-[#222A33]/5'}`}>
                <p className="whitespace-pre-wrap break-words">{m.contenido}</p>
                <p className={`mt-1 text-[10px] ${mio ? 'text-white/70' : 'text-[#222A33]/50'}`}>
                  {hora(m.fecha_envio)}
                  {mio && m.estadoLocal === 'enviando' && ' · Enviando…'}
                  {mio && !m.estadoLocal && (m.leido_en ? ' · Leído' : ' · Enviado')}
                </p>
                {m.estadoLocal === 'error' && (
                  <p className="mt-1 text-xs text-red-200">
                    {m.errorMsg}{' '}
                    <button type="button" className="underline" onClick={() => enviar(m.contenido, m.id)}>Reintentar</button>
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={fin} />
      </div>

      <form onSubmit={alEnviar} className="border-t border-[#222A33]/10 p-3">
        <div className="flex gap-2">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={1} maxLength={MAX}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); alEnviar(e); } }}
            placeholder="Escribe un mensaje…" aria-label="Mensaje"
            className="flex-1 resize-none rounded-lg border border-[#222A33]/20 px-3 py-2 text-sm" />
          <button type="submit" disabled={!texto.trim()}
            className="rounded-lg bg-[#1E4273] px-4 py-2 text-sm text-white disabled:opacity-50">Enviar</button>
        </div>
        <p className="mt-1 text-right text-[10px] text-[#222A33]/50">{texto.length}/{MAX}</p>
      </form>
    </>
  );
}