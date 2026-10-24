import { useEffect, useState } from 'react';

export const MOTIVO_MAX = 300; 

/* ───────────── Etiquetas ───────────── */

export const ETIQUETA_ESTADO = {
  // reportes
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  resuelto: 'Resuelto',
  descartado: 'Descartado',
  // usuarios
  activo: 'Activo',
  suspendido: 'Suspendido',
  inhabilitado: 'Inhabilitado',
  // propiedades
  publicado: 'Publicada',
  pausado: 'Pausada',
  no_disponible: 'Eliminada',
  borrador: 'Borrador',
};

export const ETIQUETA_TIPO = {
  propiedad: 'Propiedad',
  usuario: 'Usuario',
  comentario: 'Comentario',
};

export const ETIQUETA_ACCION = {
  pausar: 'Pausar propiedad',
  aprobar: 'Aprobar propiedad',
  eliminar: 'Eliminar propiedad',
  suspender: 'Suspender usuario',
  reactivar: 'Reactivar usuario',
  revisar: 'Reporte en revisión',
  resolver: 'Resolver reporte',
  descartar: 'Descartar reporte',
};

const COLOR_ESTADO = {
  pendiente: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  en_revision: 'bg-blue-50 text-[#1E4273] ring-[#1E4273]/20',
  resuelto: 'bg-emerald-50 text-[#2E9E6B] ring-[#2E9E6B]/20',
  descartado: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  activo: 'bg-emerald-50 text-[#2E9E6B] ring-[#2E9E6B]/20',
  suspendido: 'bg-red-50 text-red-700 ring-red-600/20',
  inhabilitado: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  publicado: 'bg-emerald-50 text-[#2E9E6B] ring-[#2E9E6B]/20',
  pausado: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  no_disponible: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

const COLOR_ACCION = {
  pausar: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  aprobar: 'bg-emerald-50 text-[#2E9E6B] ring-[#2E9E6B]/20',
  eliminar: 'bg-red-50 text-red-700 ring-red-600/20',
  suspender: 'bg-red-50 text-red-700 ring-red-600/20',
  reactivar: 'bg-emerald-50 text-[#2E9E6B] ring-[#2E9E6B]/20',
  revisar: 'bg-blue-50 text-[#1E4273] ring-[#1E4273]/20',
  resolver: 'bg-emerald-50 text-[#2E9E6B] ring-[#2E9E6B]/20',
  descartar: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

/* ───────────── Utilidades ───────────── */

export function formatearFecha(valor, conHora = true) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export const nombreCompleto = (p) =>
  p ? [p.nombre, p.apellido].filter(Boolean).join(' ') || `Usuario #${p.id}` : '—';

// Texto corto que identifica a qué apunta un reporte
export function describirObjetivo(r) {
  if (r.tipo_objetivo === 'propiedad') return r.propiedad?.titulo || `Propiedad #${r.propiedad?.id ?? '—'}`;
  if (r.tipo_objetivo === 'usuario') return nombreCompleto(r.usuario_reportado);
  if (r.tipo_objetivo === 'comentario') return r.comentario?.comentario ? `“${r.comentario.comentario}”` : 'Comentario';
  return '—';
}

/* ───────────── Etiquetas visuales ───────────── */

export function EstadoBadge({ estado }) {
  if (!estado) return null;
  const color = COLOR_ESTADO[estado] || 'bg-slate-100 text-slate-600 ring-slate-500/20';
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${color}`}>
      {ETIQUETA_ESTADO[estado] || estado}
    </span>
  );
}

export function AccionBadge({ accion }) {
  const color = COLOR_ACCION[accion] || 'bg-slate-100 text-slate-600 ring-slate-500/20';
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${color}`}>
      {ETIQUETA_ACCION[accion] || accion}
    </span>
  );
}

export function TipoBadge({ tipo }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      {ETIQUETA_TIPO[tipo] || tipo}
    </span>
  );
}

/* ───────────── Estructura ───────────── */

export function EncabezadoPagina({ titulo, descripcion, children }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[#222A33]">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Tarjeta({ titulo, accion, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {titulo && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-[#222A33]">{titulo}</h2>
          {accion}
        </header>
      )}
      {children}
    </section>
  );
}

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#1E4273]" />
      {texto}
    </div>
  );
}

export function Vacio({ titulo = 'Sin resultados', texto }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-medium text-[#222A33]">{titulo}</p>
      {texto && <p className="mt-1 text-sm text-slate-500">{texto}</p>}
    </div>
  );
}

/* ───────────── Alertas y botones ───────────── */

const ESTILO_ALERTA = {
  error: 'border-red-200 bg-red-50 text-red-700',
  exito: 'border-[#2E9E6B]/30 bg-emerald-50 text-[#2E9E6B]',
  info: 'border-[#1E4273]/20 bg-blue-50 text-[#1E4273]',
};

export function Alerta({ tipo = 'info', children, onCerrar }) {
  if (!children) return null;
  return (
    <div role="alert" className={`mb-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${ESTILO_ALERTA[tipo]}`}>
      <span>{children}</span>
      {onCerrar && (
        <button type="button" onClick={onCerrar} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Cerrar">
          ✕
        </button>
      )}
    </div>
  );
}

const VARIANTE_BOTON = {
  primario: 'bg-[#1E4273] text-white hover:bg-[#163357] focus-visible:outline-[#1E4273]',
  exito: 'bg-[#2E9E6B] text-white hover:bg-[#25835a] focus-visible:outline-[#2E9E6B]',
  peligro: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  advertencia: 'bg-amber-500 text-white hover:bg-amber-600 focus-visible:outline-amber-500',
  secundario: 'border border-slate-300 bg-white text-[#222A33] hover:bg-slate-50 focus-visible:outline-[#1E4273]',
};

export function Boton({ variante = 'primario', tamano = 'md', className = '', children, ...props }) {
  const tam = tamano === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${tam} ${VARIANTE_BOTON[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ───────────── Formularios ───────────── */

export function Selector({ etiqueta, value, onChange, opciones, className = '' }) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-slate-600 ${className}`}>
      {etiqueta}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#222A33] focus:border-[#1E4273] focus:outline-none focus:ring-2 focus:ring-[#1E4273]/20"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>{o.texto}</option>
        ))}
      </select>
    </label>
  );
}

export function CampoTexto({ etiqueta, className = '', ...props }) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-slate-600 ${className}`}>
      {etiqueta}
      <input
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#222A33] placeholder:text-slate-400 focus:border-[#1E4273] focus:outline-none focus:ring-2 focus:ring-[#1E4273]/20"
        {...props}
      />
    </label>
  );
}

/* ───────────── Paginación ───────────── */

export function Paginacion({ pagination, onCambiar }) {
  if (!pagination || pagination.totalPages <= 1) {
    return pagination ? (
      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        {pagination.totalItems} resultado{pagination.totalItems === 1 ? '' : 's'}
      </p>
    ) : null;
  }
  const { currentPage, totalPages, totalItems } = pagination;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
      <p className="text-xs text-slate-500">
        Página {currentPage} de {totalPages} · {totalItems} resultados
      </p>
      <div className="flex gap-2">
        <Boton variante="secundario" tamano="sm" disabled={currentPage <= 1} onClick={() => onCambiar(currentPage - 1)}>
          ← Anterior
        </Boton>
        <Boton variante="secundario" tamano="sm" disabled={currentPage >= totalPages} onClick={() => onCambiar(currentPage + 1)}>
          Siguiente →
        </Boton>
      </div>
    </div>
  );
}

/* ───────────── Modal de acción con motivo ───────────── */

/**
 * Toda acción de moderación exige un motivo (queda en la auditoría).
 * onConfirmar(motivo) debe devolver una promesa; si falla, el error se muestra dentro del modal.
 * `children` permite añadir opciones extra (por ejemplo, vincular el reporte).
 */
export function ModalMotivo({
  abierto, titulo, descripcion, textoConfirmar = 'Confirmar', variante = 'primario',
  onConfirmar, onCerrar, children,
}) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (abierto) {
      setMotivo('');
      setError('');
      setEnviando(false);
    }
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (e) => { if (e.key === 'Escape' && !enviando) onCerrar(); };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [abierto, enviando, onCerrar]);

  if (!abierto) return null;

  const motivoLimpio = motivo.trim();

  async function enviar(e) {
    e.preventDefault();
    if (!motivoLimpio) {
      setError('El motivo es obligatorio: toda acción de moderación queda registrada.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await onConfirmar(motivoLimpio);
    } catch (err) {
      setError(err.message || 'No se pudo completar la acción');
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#222A33]/50 p-4 sm:items-center" role="dialog" aria-modal="true">
      <form onSubmit={enviar} className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="px-6 pt-5">
          <h3 className="text-lg font-semibold text-[#222A33]">{titulo}</h3>
          {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
        </div>

        <div className="space-y-4 px-6 py-5">
          {error && <Alerta tipo="error">{error}</Alerta>}

          <label className="block text-sm font-medium text-[#222A33]">
            Motivo <span className="text-red-600">*</span>
            <textarea
              autoFocus
              rows={4}
              maxLength={MOTIVO_MAX}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explica por qué se aplica esta acción…"
              className="mt-1.5 block w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-[#222A33] placeholder:text-slate-400 focus:border-[#1E4273] focus:outline-none focus:ring-2 focus:ring-[#1E4273]/20"
            />
          </label>
          <p className="-mt-2 text-right text-xs text-slate-400">{motivo.length}/{MOTIVO_MAX}</p>

          {children}
        </div>

        <div className="flex justify-end gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-6 py-3">
          <Boton variante="secundario" onClick={onCerrar} disabled={enviando}>Cancelar</Boton>
          <Boton type="submit" variante={variante} disabled={enviando || !motivoLimpio}>
            {enviando ? 'Procesando…' : textoConfirmar}
          </Boton>
        </div>
      </form>
    </div>
  );
}