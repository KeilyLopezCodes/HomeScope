import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarReportes } from '../api/adminApi';

export default function RutaAdmin({ children }) {
  const { token, estaAutenticado, logout } = useAuth();
  const location = useLocation();
  const [estado, setEstado] = useState('verificando'); // verificando | permitido | denegado | error
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!estaAutenticado) return undefined;
    let activo = true;
    setEstado('verificando');

    listarReportes(token, { limit: 1 })
      .then(() => activo && setEstado('permitido'))
      .catch((error) => {
        if (!activo) return;
        if (error.status === 401) {
          logout();
        } else if (error.status === 403) {
          setEstado('denegado');
        } else {
          setMensaje(error.message);
          setEstado('error');
        }
      });

    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, estaAutenticado]);

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (estado === 'verificando') {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-slate-50 text-sm text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#1E4273]" />
        Verificando permisos…
      </div>
    );
  }

  if (estado === 'denegado' || estado === 'error') {
    const denegado = estado === 'denegado';
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${denegado ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-[#222A33]">
            {denegado ? 'Acceso restringido' : 'No se pudo verificar el acceso'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {denegado
              ? 'Esta sección es solo para administradores de HomeScope.'
              : mensaje || 'Intenta de nuevo en unos momentos.'}
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-lg bg-[#1E4273] px-4 py-2 text-sm font-medium text-white hover:bg-[#163357]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return children;
}