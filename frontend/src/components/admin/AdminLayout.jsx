import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

const Icono = ({ d }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const NAVEGACION = [
  { to: '/admin', texto: 'Resumen', end: true, icono: 'M3 12 12 3l9 9M5 10v10h5v-6h4v6h5V10' },
  { to: '/admin/reportes', texto: 'Reportes', icono: 'M4 21V4m0 0h11l-1.5 4L15 12H4' },
  { to: '/admin/usuarios', texto: 'Usuarios', icono: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1m14-9a3 3 0 1 0 0-6m6 15v-1a4 4 0 0 0-3-3.9M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' },
  { to: '/admin/auditoria', texto: 'Auditoría', icono: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarSesion = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const iniciales = (user?.nombre || 'A').trim().charAt(0).toUpperCase();

  const Sidebar = (
    <div className="flex h-full flex-col bg-[#1E4273] text-white">
      <Link to="/admin" className="flex items-center gap-3 px-5 py-5" onClick={() => setMenuAbierto(false)}>
        <img src={logo} alt="" className="h-9 w-9 rounded-lg bg-white object-contain p-1" />
        <div className="leading-tight">
          <p className="font-bold">HomeScope</p>
          <p className="text-xs text-white/60">Panel administrativo</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAVEGACION.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMenuAbierto(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-white text-[#1E4273] shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icono d={item.icono} />
            {item.texto}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
          <Icono d="M10 19 3 12m0 0 7-7m-7 7h18" />
          Ir al sitio
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-[#222A33]">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{Sidebar}</aside>

      {/* Sidebar móvil */}
      {menuAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-[#222A33]/50" onClick={() => setMenuAbierto(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-xl">{Sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-[#222A33] hover:bg-slate-100 lg:hidden"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            <Icono d="M4 6h16M4 12h16M4 18h16" />
          </button>
          <span className="hidden text-sm text-slate-500 lg:block">Moderación y control de la plataforma</span>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user?.nombre || 'Administrador'}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2E9E6B] text-sm font-semibold text-white">
              {iniciales}
            </span>
            <button
              type="button"
              onClick={cerrarSesion}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-[#222A33]"
            >
              Salir
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}