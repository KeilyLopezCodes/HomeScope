import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { EVENTOS } from "../api/chatSocket";
import { listarNotificaciones, marcarLeida, marcarTodasLeidas } from "../api/notificacionApi";

// A dónde lleva cada tipo de notificación (agrega aquí los nuevos tipos)
function rutaDe(n) {
  if (n.referencia_tipo === "visita") return "/visitas";
  if (n.referencia_tipo === "conversacion") return `/mensajes/${n.referencia_id}`;
  if (n.referencia_tipo === "propiedad") return `/propiedades/${n.referencia_id}`;
  return null;
}

export default function Notificaciones() {
  const navigate = useNavigate();
  const chat = useChat();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      const { notificaciones } = await listarNotificaciones();
      setLista(notificaciones);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Si llega una nueva mientras tienes la página abierta, se recarga la lista
  useEffect(() => chat?.suscribir((evento) => { if (evento === EVENTOS.NOTIFICACION) cargar(); }), [chat, cargar]);

  async function abrir(n) {
    if (!n.leida) {
      await marcarLeida(n.id).catch(() => {});
      setLista((l) => l.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
      chat?.refrescarNotificaciones?.();
    }
    const ruta = rutaDe(n);
    if (ruta) navigate(ruta);
  }

  async function leerTodas() {
    await marcarTodasLeidas().catch(() => {});
    setLista((l) => l.map((x) => ({ ...x, leida: true })));
    chat?.refrescarNotificaciones?.();
  }

  const hayNoLeidas = lista.some((n) => !n.leida);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-[#222A33]">Notificaciones</h1>
        {hayNoLeidas && (
          <button type="button" onClick={leerTodas} className="text-xs font-medium text-[#1E4273] underline">
            Marcar todas como leídas
          </button>
        )}
      </div>

      {cargando && <p className="py-16 text-center text-sm text-gray-500">Cargando...</p>}
      {error && <p className="py-16 text-center text-sm text-red-500">{error}</p>}
      {!cargando && !error && lista.length === 0 && (
        <p className="py-16 text-center text-sm text-gray-500">No tienes notificaciones.</p>
      )}

      <ul className="flex flex-col gap-2">
        {lista.map((n) => (
          <li key={n.id}>
            <button type="button" onClick={() => abrir(n)}
              className={`w-full rounded-xl border p-4 text-left hover:shadow-sm ${
                n.leida ? "bg-white border-gray-200" : "bg-blue-50 border-[#1E4273]/30"
              }`}>
              <div className="flex items-start justify-between gap-3">
                <p className={`text-sm ${n.leida ? "text-[#222A33]" : "font-semibold text-[#1E4273]"}`}>{n.titulo}</p>
                <time className="shrink-0 text-xs text-gray-400">
                  {new Date(n.fecha_creacion).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" })}
                </time>
              </div>
              <p className="mt-1 text-sm text-gray-600">{n.contenido}</p>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}