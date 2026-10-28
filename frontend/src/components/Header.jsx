import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useFavoritos } from "../hooks/useFavoritos";
import { useComparador } from "../hooks/useComparador";

// Para agregar una pestaña nueva: una línea aquí + su <Route> en App.jsx.
//  - soloAutenticado: solo se muestra con la sesión iniciada
//  - contador: muestra un numerito (favoritos | comparar | mensajes)
const ENLACES = [
  { to: "/", texto: "Inicio", fin: true },
  { to: "/favoritos", texto: "Favoritos", contador: "favoritos" },
  { to: "/comparador", texto: "Comparar", contador: "comparar" },
  { to: "/mensajes", texto: "Mensajes", contador: "mensajes", soloAutenticado: true },
  { to: "/publicar", texto: "Publicar", soloAutenticado: true },
  { to: "/notificaciones", texto: "Notificaciones", contador: "notificaciones", soloAutenticado: true },
  { to: "/visitas", texto: "Visitas", soloAutenticado: true },
  { to: "/panel", texto: "Mi panel", soloAutenticado: true },
  { to: "/mis-propiedades", texto: "Mis propiedades", soloAutenticado: true },
  // { to: "/admin", texto: "Administración", soloAutenticado: true },
];

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
    notificaciones: chat?.notifNoLeidas || 0,
  };

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