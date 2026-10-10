import { useState } from 'react';

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;
const MAX_FOTOS = 10;

export default function SubidaFotos({ value = [], onChange }) {
  const [errores, setErrores] = useState([]);
  const [arrastrando, setArrastrando] = useState(null);

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
      else if (value.length + nuevas.length >= MAX_FOTOS) mensajes.push(`"${file.name}": máximo ${MAX_FOTOS} fotos.`);
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

  return (
    <div className="space-y-4">
      <label className="block cursor-pointer rounded-lg border-2 border-dashed border-[#1E4273]/40 p-6 text-center text-[#222A33]">
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={agregar}
        />
        Elige tus fotos (jpg, png o webp · máx. {MAX_MB} MB · hasta {MAX_FOTOS})
      </label>

      {errores.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errores.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {value.map((foto, i) => (
          <li
            key={foto.id}
            draggable
            onDragStart={() => setArrastrando(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { mover(arrastrando, i); setArrastrando(null); }}
            className="relative overflow-hidden rounded-lg border border-[#222A33]/20 bg-white"
          >
            <img src={foto.previewUrl} alt={`Foto ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
            {foto.esPortada && (
              <span className="absolute left-2 top-2 rounded bg-[#2E9E6B] px-2 py-0.5 text-xs font-medium text-white">
                Portada
              </span>
            )}
            <div className="flex items-center justify-between gap-2 p-2 text-xs">
              <div className="flex gap-2">
                <button type="button" onClick={() => mover(i, i - 1)} disabled={i === 0} aria-label="Mover a la izquierda">◀</button>
                <button type="button" onClick={() => mover(i, i + 1)} disabled={i === value.length - 1} aria-label="Mover a la derecha">▶</button>
              </div>
              {!foto.esPortada && (
                <button type="button" onClick={() => hacerPortada(foto.id)} className="font-medium text-[#1E4273] underline">
                  Hacer portada
                </button>
              )}
              <button type="button" onClick={() => quitar(foto.id)} className="text-red-700">Quitar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}