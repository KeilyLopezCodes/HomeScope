// Piezas reutilizables para todas las pantallas de auth.
// Paleta de colores HomeScope:  azul #1E4273 · verde #2E9E6B · oscuro #222A33 · blanco #FFFFFF
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

export function Campo({ etiqueta, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#222A33]">{etiqueta}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-[#222A33]/25 bg-white px-3.5 py-2.5 text-[#222A33] placeholder:text-[#222A33]/40 focus:border-[#1E4273] focus:outline-none focus:ring-2 focus:ring-[#1E4273]/25"
      />
    </label>
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