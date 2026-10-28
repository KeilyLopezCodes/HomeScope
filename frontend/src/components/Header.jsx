import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useFavoritos } from "../hooks/useFavoritos";
import { useComparador } from "../hooks/useComparador";

// Para agregar una pestaña nueva: una línea aquí + su <Route> en App.jsx.
// Visitas y Mis propiedades están dentro de "Mi panel" (pestañas); las notificaciones son la campana.
//  - soloAutenticado: solo se muestra con la sesión iniciada
//  - contador: muestra un numerito (favoritos | comparar | mensajes)
const ENLACES = [
  { to: "/", texto: "Inicio", fin: true },
  { to: "/favoritos", texto: "Favoritos", contador: "favoritos" },
  { to: "/comparador", texto: "Comparar", contador: "comparar" },
  { to: "/mensajes", texto: "Mensajes", contador: "mensajes", soloAutenticado: true },
  { to: "/publicar", texto: "Publicar", soloAutenticado: true },
  { to: "/panel", texto: "Mi panel", soloAutenticado: true },
  // { to: "/admin", texto: "Administración", soloAutenticado: true },
];

const IconoCampana = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M6 9a6 6 0 1112 0c0 5 2 6.5 2 6.5H4S6 14 6 9zM10 19a2 2 0 004 0" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Header() {
  const { user, estaAutenticado, logout } = useAuth();
  const chat = useChat();
  const { favoritos } = useFavoritos();
  const { seleccionados } = useComparador();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const contadores = {
    favoritos: favoritos.length,
    comparar: seleccionados.length,
    mensajes: chat?.noLeidos || 0,
  };
  const notificacionesSinLeer = chat?.notifNoLeidas || 0;

  const enlaces = ENLACES.filter((e) => !e.soloAutenticado || estaAutenticado);

  const salir = () => {
    setMenuAbierto(false);
    logout();
    navigate("/");
  };

  const claseEnlace = ({ isActive }) =>
    `inline-flex items-center gap-1 py-1 hover:text-[#1E4273] ${
      isActive ? "text-[#1E4273] border-b-2 border-[#1E4273]" : "text-[#222A33]"
    }`;

  const Enlaces = ({ clase }) => (
    <>
      {enlaces.map((e) => (
        <NavLink key={e.to} to={e.to} end={e.fin} className={clase || claseEnlace} onClick={() => setMenuAbierto(false)}>
          {e.texto}
          {e.contador && contadores[e.contador] > 0 && (
            <span className="rounded-full bg-[#1E4273] px-1.5 text-[10px] leading-4 text-white">
              {contadores[e.contador]}
            </span>
          )}
        </NavLink>
      ))}
    </>
  );

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="" className="h-8 w-8" />
          <span className="text-lg font-bold text-[#1E4273]">HomeScope</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium" aria-label="Principal">
          <Enlaces />
        </nav>

        <div className="hidden md:flex items-center gap-3 text-sm">
          {estaAutenticado ? (
            <>
              <NavLink
                to="/notificaciones"
                aria-label={notificacionesSinLeer > 0 ? `Notificaciones (${notificacionesSinLeer} sin leer)` : "Notificaciones"}
                title="Notificaciones"
                className={({ isActive }) =>
                  `relative rounded-full p-2 hover:bg-gray-100 hover:text-[#1E4273] ${isActive ? "bg-[#1E4273]/10 text-[#1E4273]" : "text-[#222A33]"}`
                }
              >
                <IconoCampana />
                {notificacionesSinLeer > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-semibold leading-4 text-white">
                    {notificacionesSinLeer > 9 ? "9+" : notificacionesSinLeer}
                  </span>
                )}
              </NavLink>
              <span className="text-[#222A33]">Hola, {user?.nombre}</span>
              <button type="button" onClick={salir}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-[#222A33] hover:bg-gray-50">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-medium text-[#1E4273] hover:underline">Iniciar sesión</Link>
              <Link to="/registro" className="rounded-lg bg-[#1E4273] px-3 py-1.5 font-medium text-white hover:opacity-90">
                Registrarse
              </Link>
            </>
          )}
        </div>

        <button type="button" className="md:hidden rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          aria-expanded={menuAbierto} aria-label="Abrir menú" onClick={() => setMenuAbierto((v) => !v)}>
          {menuAbierto ? "✕" : "☰"}
        </button>
      </div>

      {menuAbierto && (
        <nav className="md:hidden border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-3 text-sm font-medium" aria-label="Principal">
          <Enlaces clase={({ isActive }) => `flex items-center gap-2 ${isActive ? "text-[#1E4273]" : "text-[#222A33]"}`} />
          {estaAutenticado && (
            <NavLink to="/notificaciones" onClick={() => setMenuAbierto(false)}
              className={({ isActive }) => `flex items-center gap-2 ${isActive ? "text-[#1E4273]" : "text-[#222A33]"}`}>
              <IconoCampana /> Notificaciones
              {notificacionesSinLeer > 0 && (
                <span className="rounded-full bg-rose-600 px-1.5 text-[10px] leading-4 text-white">{notificacionesSinLeer}</span>
              )}
            </NavLink>
          )}
          <hr className="border-gray-200" />
          {estaAutenticado ? (
            <button type="button" onClick={salir} className="text-left text-[#222A33]">
              Salir ({user?.nombre})
            </button>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuAbierto(false)} className="text-[#1E4273]">Iniciar sesión</Link>
              <Link to="/registro" onClick={() => setMenuAbierto(false)} className="text-[#1E4273]">Registrarse</Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}