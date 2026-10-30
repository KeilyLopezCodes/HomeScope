import { useEffect, useState } from 'react';
import { subirFotos } from '../api/fotoApi';
import { actualizarPropiedad, eliminarFoto, reordenarFotos } from '../api/misPropiedadesApi';
import SubidaFotos from './SubidaFotos';

const MAX_FOTOS = 10;

const campo = 'mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4273]';
const etiqueta = 'block text-sm font-medium text-[#222A33]';
const botonFoto =
  'flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#222A33] shadow transition-colors hover:bg-white hover:text-[#1E4273] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4273] disabled:cursor-not-allowed disabled:opacity-40';

const Icono = ({ d, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const D = {
  izq: 'M15 19l-7-7 7-7',
  der: 'M9 5l7 7-7 7',
  estrella: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z',
  basura: 'M4 7h16M10 11v6m4-6v6M6 7l1 12a1 1 0 001 1h8a1 1 0 001-1l1-12M9 7V4h6v3',
};

const textoInicial = (p) => ({
  titulo: p.titulo ?? '',
  descripcion: p.descripcion ?? '',
  modalidad: p.modalidad ?? 'VENTA',
  tipo_propiedad_id: String(p.tipo_propiedad_id ?? 1),
  moneda: p.moneda ?? 'GTQ',
  precio: String(Number(p.precio ?? 0)),
  area_m2: String(Number(p.area_m2 ?? 0)),
  habitaciones: String(p.habitaciones ?? 0),
  banos: String(Number(p.banos ?? 0)),
  parqueos: String(p.parqueos ?? 0),
  direccion: p.direccion ?? '',
  zona: p.zona ?? '',
  municipio: p.municipio ?? '',
  departamento: p.departamento ?? '',
});

const ordenarFotos = (fotos = []) =>
  [...fotos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).map((f) => ({ ...f }));

// Ventana para corregir los datos y las fotos de una publicación propia
export default function EditarPropiedad({ propiedad, onCerrar, onGuardado }) {
  const [datos, setDatos] = useState(() => textoInicial(propiedad));
  const [existentes, setExistentes] = useState(() => ordenarFotos(propiedad.foto_propiedad));
  const [portadaId, setPortadaId] = useState(
    () => (propiedad.foto_propiedad?.find((f) => f.es_portada) ?? ordenarFotos(propiedad.foto_propiedad)[0])?.id ?? null
  );
  const [quitadas, setQuitadas] = useState([]);
  const [nuevas, setNuevas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [progreso, setProgreso] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const alTeclear = (e) => { if (e.key === 'Escape' && !guardando) onCerrar(); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [guardando, onCerrar]);

  const esTerreno = datos.tipo_propiedad_id === '3';
  const cambiar = (nombre) => (e) => setDatos((d) => ({ ...d, [nombre]: e.target.value }));

  const mover = (desde, hasta) => {
    if (hasta < 0 || hasta >= existentes.length) return;
    const lista = [...existentes];
    const [item] = lista.splice(desde, 1);
    lista.splice(hasta, 0, item);
    setExistentes(lista);
  };
  const quitar = (foto) => {
    const resto = existentes.filter((f) => f.id !== foto.id);
    setExistentes(resto);
    setQuitadas((q) => [...q, foto.id]);
    if (portadaId === foto.id) setPortadaId(resto[0]?.id ?? null);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    if (!datos.titulo.trim()) return setError('El título es obligatorio.');
    if (!datos.descripcion.trim()) return setError('La descripción es obligatoria.');
    if (!(Number(datos.precio) > 0)) return setError('Escribe un precio mayor que cero.');
    if (!(Number(datos.area_m2) > 0)) return setError('Escribe el área en m².');
    if (!datos.direccion.trim()) return setError('La dirección es obligatoria.');
    if (existentes.length + nuevas.length > MAX_FOTOS) {
      return setError(`Máximo ${MAX_FOTOS} fotos por propiedad (tienes ${existentes.length + nuevas.length}).`);
    }

    setGuardando(true);
    try {
      // 1. Datos de la propiedad
      const actualizada = await actualizarPropiedad(propiedad.id, {
        titulo: datos.titulo.trim(),
        descripcion: datos.descripcion.trim(),
        modalidad: datos.modalidad,
        tipo_propiedad_id: Number(datos.tipo_propiedad_id),
        moneda: datos.moneda,
        precio: Number(datos.precio),
        area_m2: Number(datos.area_m2),
        habitaciones: esTerreno ? 0 : Number(datos.habitaciones || 0),
        banos: esTerreno ? 0 : Number(datos.banos || 0),
        parqueos: esTerreno ? 0 : Number(datos.parqueos || 0),
        direccion: datos.direccion.trim(),
        zona: String(datos.zona).trim(),
        municipio: datos.municipio.trim(),
        departamento: datos.departamento.trim(),
      });

      // 2. Fotos: quitar, subir las nuevas y dejar el orden final
      let fotosFinales = existentes;
      let portadaFinal = portadaId;
      if (quitadas.length > 0 || nuevas.length > 0 || existentes.some((f, i) => f.id !== ordenarFotos(propiedad.foto_propiedad)[i]?.id)) {
        for (const id of quitadas) await eliminarFoto(propiedad.id, id);

        let subidas = [];
        if (nuevas.length > 0) {
          setProgreso(0);
          const respuesta = await subirFotos(propiedad.id, nuevas, { onProgress: setProgreso });
          subidas = Array.isArray(respuesta.data) ? respuesta.data : [];
        }

        const ids = [...existentes.map((f) => f.id), ...subidas.map((f) => f.id)];
        if (ids.length > 0) {
          portadaFinal = ids.includes(portadaId) ? portadaId : ids[0];
          const ordenadas = await reordenarFotos(propiedad.id, ids, portadaFinal);
          fotosFinales = Array.isArray(ordenadas) ? ordenadas : [];
        } else {
          fotosFinales = [];
        }
      }

      onGuardado({ ...propiedad, ...actualizada, foto_propiedad: fotosFinales });
    } catch (err) {
      setError(err.message || 'No se pudieron guardar los cambios.');
    } finally {
      setGuardando(false);
      setProgreso(null);
    }
  };

  const cupoNuevas = MAX_FOTOS - existentes.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-editar"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !guardando) onCerrar(); }}
    >
      <form onSubmit={guardar} className="w-full max-w-3xl space-y-6 rounded-2xl bg-white p-5 shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <h2 id="titulo-editar" className="text-xl font-semibold text-[#222A33]">Editar publicación</h2>
          <button type="button" onClick={onCerrar} disabled={guardando} aria-label="Cerrar"
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
            <Icono d="M6 6l12 12M18 6L6 18" className="h-5 w-5" />
          </button>
        </div>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#222A33]/60">Datos generales</h3>
          <div>
            <label className={etiqueta} htmlFor="ep-titulo">Título</label>
            <input id="ep-titulo" className={campo} value={datos.titulo} onChange={cambiar('titulo')} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={etiqueta} htmlFor="ep-mod">Modalidad</label>
              <select id="ep-mod" className={campo} value={datos.modalidad} onChange={cambiar('modalidad')}>
                <option value="VENTA">Venta</option>
                <option value="ALQUILER">Alquiler</option>
                <option value="OPCION_COMPRA">Alquiler con opción a compra</option>
                <option value="CESION_DERECHOS">Cesión de derechos</option>
                <option value="SUBARRIENDO">Subarriendo</option>
              </select>
            </div>
            <div>
              <label className={etiqueta} htmlFor="ep-tipo">Tipo</label>
              <select id="ep-tipo" className={campo} value={datos.tipo_propiedad_id} onChange={cambiar('tipo_propiedad_id')}>
                <option value="1">Casa</option>
                <option value="2">Apartamento</option>
                <option value="3">Terreno / Lote</option>
              </select>
            </div>
            <div>
              <label className={etiqueta} htmlFor="ep-mon">Moneda</label>
              <select id="ep-mon" className={campo} value={datos.moneda} onChange={cambiar('moneda')}>
                <option value="GTQ">GTQ (Q)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={etiqueta} htmlFor="ep-precio">Precio</label>
              <input id="ep-precio" type="number" min="0" className={campo} value={datos.precio} onChange={cambiar('precio')} />
              <p className="mt-1 text-xs text-gray-500">Si cambias el precio, queda registrado en el historial.</p>
            </div>
            <div>
              <label className={etiqueta} htmlFor="ep-area">Área (m²)</label>
              <input id="ep-area" type="number" min="0" step="0.01" className={campo} value={datos.area_m2} onChange={cambiar('area_m2')} />
            </div>
          </div>
          {!esTerreno && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={etiqueta} htmlFor="ep-hab">Habitaciones</label>
                <input id="ep-hab" type="number" min="0" className={campo} value={datos.habitaciones} onChange={cambiar('habitaciones')} />
              </div>
              <div>
                <label className={etiqueta} htmlFor="ep-banos">Baños</label>
                <input id="ep-banos" type="number" min="0" step="0.5" className={campo} value={datos.banos} onChange={cambiar('banos')} />
              </div>
              <div>
                <label className={etiqueta} htmlFor="ep-parq">Parqueos</label>
                <input id="ep-parq" type="number" min="0" className={campo} value={datos.parqueos} onChange={cambiar('parqueos')} />
              </div>
            </div>
          )}
          <div>
            <label className={etiqueta} htmlFor="ep-desc">Descripción</label>
            <textarea id="ep-desc" rows="4" className={campo} value={datos.descripcion} onChange={cambiar('descripcion')} />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#222A33]/60">Ubicación</h3>
          <div>
            <label className={etiqueta} htmlFor="ep-dir">Dirección</label>
            <input id="ep-dir" className={campo} value={datos.direccion} onChange={cambiar('direccion')} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={etiqueta} htmlFor="ep-zona">Zona / sector</label>
              <input id="ep-zona" className={campo} value={datos.zona} onChange={cambiar('zona')} />
            </div>
            <div>
              <label className={etiqueta} htmlFor="ep-muni">Municipio</label>
              <input id="ep-muni" className={campo} value={datos.municipio} onChange={cambiar('municipio')} />
            </div>
            <div>
              <label className={etiqueta} htmlFor="ep-depto">Departamento</label>
              <input id="ep-depto" className={campo} value={datos.departamento} onChange={cambiar('departamento')} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#222A33]/60">Fotografías</h3>
            <span className="text-xs text-[#222A33]/70">{existentes.length + nuevas.length} de {MAX_FOTOS}</span>
          </div>

          {existentes.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">Esta publicación no tiene fotos guardadas.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {existentes.map((foto, i) => (
                <li key={foto.id}
                  className={`relative overflow-hidden rounded-xl border-2 bg-white ${foto.id === portadaId ? 'border-[#2E9E6B]' : 'border-[#222A33]/15'}`}>
                  <img src={foto.url} alt={`Foto ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                  <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-black/60 px-1.5 text-xs font-medium text-white">{i + 1}</span>
                  {foto.id === portadaId && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#2E9E6B] px-2 py-0.5 text-xs font-semibold text-white shadow">
                      <Icono d={D.estrella} className="h-3 w-3" /> Portada
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <div className="flex gap-1.5">
                      <button type="button" className={botonFoto} onClick={() => mover(i, i - 1)} disabled={i === 0} aria-label="Mover a la izquierda" title="Mover a la izquierda"><Icono d={D.izq} /></button>
                      <button type="button" className={botonFoto} onClick={() => mover(i, i + 1)} disabled={i === existentes.length - 1} aria-label="Mover a la derecha" title="Mover a la derecha"><Icono d={D.der} /></button>
                    </div>
                    <div className="flex gap-1.5">
                      {foto.id !== portadaId && (
                        <button type="button" className={botonFoto} onClick={() => setPortadaId(foto.id)} aria-label="Hacer portada" title="Hacer portada"><Icono d={D.estrella} /></button>
                      )}
                      <button type="button" className={`${botonFoto} hover:!text-rose-600`} onClick={() => quitar(foto)} aria-label="Quitar foto" title="Quitar foto"><Icono d={D.basura} /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {cupoNuevas > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-[#222A33]">Agregar fotos nuevas (caben {cupoNuevas} más)</p>
              <SubidaFotos value={nuevas} onChange={setNuevas} max={cupoNuevas} conPortadaVisible={false} />
            </div>
          ) : (
            <p className="text-xs text-gray-500">Llegaste al máximo. Quita una foto para poder agregar otra.</p>
          )}
          {quitadas.length > 0 && (
            <p className="text-xs text-gray-500">Las fotos que quitaste se borran al guardar los cambios.</p>
          )}
        </section>

        {progreso !== null && (
          <div>
            <p className="mb-1 text-sm text-[#222A33]">{progreso < 100 ? `Subiendo fotografías... ${progreso}%` : 'Procesando imágenes...'}</p>
            <div className="h-2 w-full rounded-full bg-gray-100" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-2 rounded-full bg-[#2E9E6B] transition-all" style={{ width: `${progreso}%` }} />
            </div>
          </div>
        )}

        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCerrar} disabled={guardando}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={guardando}
            className="rounded-lg bg-[#1E4273] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#163156] disabled:cursor-not-allowed disabled:bg-gray-300">
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}