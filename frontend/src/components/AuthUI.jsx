// Piezas reutilizables para todas las pantallas de auth.
// Paleta de colores HomeScope:  azul #1E4273 · verde #2E9E6B · oscuro #222A33 · blanco #FFFFFF
import { useId, useState } from 'react';
import logo from '../assets/logo.png';

const ENCENDIDAS = new Set([2, 7, 9, 14, 19, 22, 26, 31, 34]);

function Fachada() {
  return (
    <div className="grid w-full max-w-xs grid-cols-6 gap-3" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <div
          key={i}
          className={`aspect-[3/4] rounded-sm ${ENCENDIDAS.has(i) ? 'bg-[#2E9E6B]' : 'bg-white/10'}`}
        />
      ))}
    </div>
  );
}

export function AuthLayout({ titulo, subtitulo, children, pie }) {
  return (
    <div className="grid min-h-screen bg-white md:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-[#1E4273] p-12 text-white md:flex">
        <span className="text-xl font-semibold tracking-tight">HomeScope</span>
        <div className="space-y-10">
          <Fachada />
          <p className="max-w-sm text-3xl font-semibold leading-tight tracking-tight">
            Encuentra el lugar donde quieres vivir.
          </p>
        </div>
        <span className="text-sm text-white/70">Tu próxima dirección empieza aquí.</span>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <img src={logo} alt="HomeScope" className="mb-8 h-24 w-auto" />
          <h1 className="text-3xl font-semibold tracking-tight text-[#222A33]">{titulo}</h1>
          {subtitulo && <p className="mt-2 text-[#222A33]/70">{subtitulo}</p>}
          <div className="mt-8 space-y-5">{children}</div>
          {pie && <p className="mt-8 text-sm text-[#222A33]/70">{pie}</p>}
        </div>
      </main>
    </div>
  );
}

// Los campos de tipo "password" llevan un botón (ojo) para ver lo que se escribe.
export function Campo({ etiqueta, id, ...props }) {
  const idAuto = useId();
  const idCampo = id ?? idAuto;
  const [visible, setVisible] = useState(false);
  const esPassword = props.type === 'password';

  return (
    <div className="block">
      <label htmlFor={idCampo} className="mb-1.5 block text-sm font-medium text-[#222A33]">{etiqueta}</label>
      <div className="relative">
        <input
          {...props}
          id={idCampo}
          type={esPassword && visible ? 'text' : props.type}
          className={`w-full rounded-lg border border-[#222A33]/25 bg-white px-3.5 py-2.5 text-[#222A33] placeholder:text-[#222A33]/40 focus:border-[#1E4273] focus:outline-none focus:ring-2 focus:ring-[#1E4273]/25 ${esPassword ? 'pr-11' : ''}`}
        />
        {esPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-[#222A33]/55 hover:text-[#1E4273] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4273]"
          >
            {visible ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.6 6.6C4.4 8 2.7 10.2 2 12c1 2.5 5 7 10 7 1.5 0 2.9-.4 4.1-1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function Alerta({ tipo = 'error', children }) {
  if (!children) return null;
  const estilos =
    tipo === 'ok'
      ? 'border-[#2E9E6B]/40 bg-[#2E9E6B]/10 text-[#222A33]'
      : 'border-red-200 bg-red-50 text-red-800';
  return (
    <div role="alert" className={`rounded-lg border px-3.5 py-2.5 text-sm ${estilos}`}>
      {children}
    </div>
  );
}

export function Boton({ cargando, children, ...props }) {
  return (
    <button
      {...props}
      disabled={cargando || props.disabled}
      className="w-full rounded-lg bg-[#1E4273] px-4 py-2.5 font-medium text-white transition hover:bg-[#18355C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4273] focus-visible:ring-offset-2 disabled:opacity-60"
    >
      {cargando ? 'Un momento…' : children}
    </button>
  );
}

export const enlace = 'font-medium text-[#1E4273] underline underline-offset-2 hover:text-[#18355C]';