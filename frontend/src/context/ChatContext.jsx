import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { conectar, desconectar, EVENTOS } from '../api/chatSocket';
import { listarConversaciones } from '../api/chatApi';

const ChatContext = createContext(null);

// Debe ir DENTRO de <BrowserRouter> y de <AuthProvider>
export function ChatProvider({ children }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [estado, setEstado] = useState('desconectado');
  const [noLeidos, setNoLeidos] = useState(0);
  const [toast, setToast] = useState(null);
  const suscriptores = useRef(new Set());
  const ubicacion = useRef(location.pathname);
  const temporizador = useRef(null);

  useEffect(() => { ubicacion.current = location.pathname; }, [location.pathname]);

  // Las pantallas de chat se suscriben para recibir mensajes en vivo
  const suscribir = useCallback((fn) => {
    suscriptores.current.add(fn);
    return () => suscriptores.current.delete(fn);
  }, []);

  const refrescarNoLeidos = useCallback(async () => {
    try {
      const convs = await listarConversaciones();
      setNoLeidos(convs.reduce((acc, c) => acc + c.no_leidos, 0));
    } catch { /* el contador es secundario: si falla no se molesta al usuario */ }
  }, []);

  useEffect(() => {
    if (!token) {
      desconectar();
      setEstado('desconectado');
      setNoLeidos(0);
      return undefined;
    }
    refrescarNoLeidos();
    conectar(token, {
      onEstado: (nuevo) => {
        setEstado(nuevo);
        // Al volver la conexión se recupera lo que llegó mientras estuvo caída
        if (nuevo === 'conectado') refrescarNoLeidos();
      },
      onEvento: (evento, payload) => {
        suscriptores.current.forEach((fn) => fn(evento, payload));
        if (evento === EVENTOS.NUEVO) {
          const abierta = ubicacion.current === `/mensajes/${payload.conversacion.id}`;
          if (!abierta) {
            setNoLeidos((n) => n + 1);
            setToast({
              conversacionId: payload.conversacion.id,
              titulo: `Nuevo mensaje de ${payload.conversacion.de}`,
              detalle: payload.mensaje.contenido,
              propiedad: payload.conversacion.propiedad.titulo,
            });
            clearTimeout(temporizador.current);
            temporizador.current = setTimeout(() => setToast(null), 6000);
          }
        }
        if (evento === EVENTOS.LEIDOS) refrescarNoLeidos();
      },
    });
    return () => { clearTimeout(temporizador.current); desconectar(); };
  }, [token, refrescarNoLeidos]);

  const valor = { estado, noLeidos, suscribir, refrescarNoLeidos, usuarioId: user?.id };

  return (
    <ChatContext.Provider value={valor}>
      {children}

      {token && estado !== 'conectado' && (
        <div role="status" aria-live="polite"
          className="fixed inset-x-0 top-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
          {estado === 'reconectando'
            ? 'Conexión perdida. Reconectando el chat…'
            : 'El chat está desconectado. Vuelve a iniciar sesión.'}
        </div>
      )}

      {toast && (
        <button type="button"
          onClick={() => { setToast(null); navigate(`/mensajes/${toast.conversacionId}`); }}
          className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-[#222A33]/10 bg-white p-4 text-left shadow-lg"
          aria-live="assertive">
          <p className="text-sm font-semibold text-[#1E4273]">{toast.titulo}</p>
          <p className="text-xs text-[#222A33]/60">{toast.propiedad}</p>
          <p className="mt-1 line-clamp-2 text-sm text-[#222A33]">{toast.detalle}</p>
        </button>
      )}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);