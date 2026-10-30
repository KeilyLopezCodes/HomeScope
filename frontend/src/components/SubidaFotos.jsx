import { useState } from 'react';

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;
const MAX_FOTOS = 10;

const Icono = ({ d, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ICONOS = {
  izquierda: 'M15 19l-7-7 7-7',
  derecha: 'M9 5l7 7-7 7',
  estrella: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z',
  basura: 'M4 7h16M10 11v6m4-6v6M6 7l1 12a1 1 0 001 1h8a1 1 0 001-1l1-12M9 7V4h6v3',
  subir: 'M12 16V4m0 0l-4 4m4-4l4 4M5 20h14',
};

const botonIcono =
  'flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#222A33] shadow transition-colors hover:bg-white hover:text-[#1E4273] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4273] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-[#222A33]';

export default function SubidaFotos({ value = [], onChange, max = MAX_FOTOS, conPortadaVisible = true }) {
  const [errores, setErrores] = useState([]);
  const [arrastrando, setArrastrando] = useState(null);
  const [sobre, setSobre] = useState(null);

  const conPortada = (lista) =>
    lista.length && !lista.some((f) => f.esPortada)
      ? lista.map((f, i) => (i === 0 ? { ...f, esPortada: true } : f))
      : lista;

  const agregar = (e) => {
    const nuevas = [];
    const mensajes = [];
    for (const file of Array.from(e.target.files)) {
      if (!TIPOS.includes(file.type)) mensajes.push(`"${file.name}": solo se aceptan jpg, png o webp.`);
      else if (file.size > MAX_MB * 1024 * 1024) mensajes.push(`"${file.name}": supera los ${MAX_MB} MB.`);
      else if (value.length + nuevas.length >= max) mensajes.push(`"${file.name}": máximo ${max} fotos.`);
      else nuevas.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file, 
        previewUrl: URL.createObjectURL(file),
        esPortada: false, });
    }
    onChange(conPortada([...value, ...nuevas]));
    setErrores(mensajes);
    e.target.value = '';
  };

  const quitar = (id) => {
    const foto = value.find((f) => f.id === id);
    if (foto) URL.revokeObjectURL(foto.previewUrl);
    onChange(conPortada(value.filter((f) => f.id !== id)));
  };

  const hacerPortada = (id) => onChange(value.map((f) => ({ ...f, esPortada: f.id === id })));

  const mover = (desde, hasta) => {
    if (desde === null || hasta < 0 || hasta >= value.length) return;
    const lista = [...value];
    const [item] = lista.splice(desde, 1);
    lista.splice(hasta, 0, item);
    onChange(lista);
  };

  const lleno = value.length >= max;

  return (
    <div className="space-y-4">
      <label
        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          lleno
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
            : 'cursor-pointer border-[#1E4273]/40 bg-[#1E4273]/[0.03] text-[#222A33] hover:border-[#1E4273] hover:bg-[#1E4273]/[0.06]'
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={agregar}
          disabled={lleno}
        />
        <Icono d={ICONOS.subir} className="h-7 w-7 text-[#1E4273]" />
        <span className="text-sm font-semibold">{lleno ? 'Llegaste al máximo de fotos' : 'Elige tus fotos'}</span>
        <span className="text-xs text-[#222A33]/60">jpg, png o webp · máx. {MAX_MB} MB cada una · hasta {max}</span>
      </label>

      {errores.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errores.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}

      {value.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#222A33]/70">
            <span className="font-medium">{value.length} de {max} fotos</span>
            <span>{conPortadaVisible ? 'Arrastra para cambiar el orden. La foto con la etiqueta “Portada” es la que se ve primero.' : 'Arrastra para cambiar el orden.'}</span>
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {value.map((foto, i) => (
              <li
                key={foto.id}
                draggable
                onDragStart={() => setArrastrando(i)}
                onDragEnd={() => { setArrastrando(null); setSobre(null); }}
                onDragOver={(e) => { e.preventDefault(); setSobre(i); }}
                onDrop={() => { mover(arrastrando, i); setArrastrando(null); setSobre(null); }}
                className={`group relative overflow-hidden rounded-xl border-2 bg-white transition ${
                  foto.esPortada ? conPortadaVisible && 'border-[#2E9E6B]' : 'border-[#222A33]/15' 
                } ${arrastrando === i ? 'opacity-40' : ''} ${
                  sobre === i && arrastrando !== null && arrastrando !== i ? 'ring-2 ring-[#1E4273]' : ''
                } cursor-grab active:cursor-grabbing`}
              >
                <img src={foto.previewUrl} alt={`Foto ${i + 1}`} className="aspect-[4/3] w-full object-cover" draggable={false} />

                <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-black/60 px-1.5 text-xs font-medium text-white">
                  {i + 1}
                </span>

                {foto.esPortada && conPortadaVisible && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#2E9E6B] px-2 py-0.5 text-xs font-semibold text-white shadow">
                    <Icono d={ICONOS.estrella} className="h-3 w-3" />
                    Portada
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => mover(i, i - 1)} disabled={i === 0}
                      className={botonIcono} aria-label="Mover a la izquierda" title="Mover a la izquierda">
                      <Icono d={ICONOS.izquierda} />
                    </button>
                    <button type="button" onClick={() => mover(i, i + 1)} disabled={i === value.length - 1}
                      className={botonIcono} aria-label="Mover a la derecha" title="Mover a la derecha">
                      <Icono d={ICONOS.derecha} />
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    {!foto.esPortada && conPortadaVisible &&(
                      <button type="button" onClick={() => hacerPortada(foto.id)}
                        className={botonIcono} aria-label="Hacer portada" title="Hacer portada">
                        <Icono d={ICONOS.estrella} />
                      </button>
                    )}
                    <button type="button" onClick={() => quitar(foto.id)}
                      className={`${botonIcono} hover:!text-rose-600`} aria-label="Quitar foto" title="Quitar foto">
                      <Icono d={ICONOS.basura} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}