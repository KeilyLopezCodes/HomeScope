import { useEffect, useRef, useState } from 'react';
import { actualizarPrecio } from '../api/propertyApi';
import { formatearPrecio } from '../utils/formatoPrecio';

// Edición de precio para el vendedor: valida, pide confirmación explícita y solo
// entonces envía el cambio. Si falla, el precio mostrado sigue siendo el anterior.
export default function EditarPrecio({ propiedadId, precioActual, moneda, onGuardado }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');
  const [errorValidacion, setErrorValidacion] = useState('');
  const [errorGuardado, setErrorGuardado] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const abrirEdicion = () => {
    setValor(String(Number(precioActual)));
    setErrorValidacion('');
    setErrorGuardado('');
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setErrorValidacion('');
    setErrorGuardado('');
  };

  const nuevoPrecio = Math.round(Number(valor) * 100) / 100;

  const pedirConfirmacion = (e) => {
    e.preventDefault();
    setErrorGuardado('');
    if (valor.trim() === '' || isNaN(Number(valor))) {
      setErrorValidacion('Ingresa un precio válido.');
      return;
    }
    if (nuevoPrecio < 0) {
      setErrorValidacion('El precio no puede ser negativo.');
      return;
    }
    if (nuevoPrecio === Number(precioActual)) {
      setErrorValidacion('El nuevo precio es igual al actual.');
      return;
    }
    setErrorValidacion('');
    setConfirmando(true);
  };

  const confirmar = async () => {
    setGuardando(true);
    try {
      const actualizada = await actualizarPrecio(propiedadId, nuevoPrecio);
      setConfirmando(false);
      setEditando(false);
      onGuardado(actualizada);
    } catch (error) {
      // No se toca el precio de la ficha: se mantiene el anterior
      setConfirmando(false);
      setErrorGuardado(`${error.message} El precio sigue siendo ${formatearPrecio(precioActual, moneda)}.`);
    } finally {
      setGuardando(false);
    }
  };

  if (!editando) {
    return (
      <button
        type="button"
        onClick={abrirEdicion}
        className="rounded-lg border border-[#1E4273] px-3 py-1.5 text-sm font-medium text-[#1E4273] transition hover:bg-[#1E4273]/5"
      >
        Editar precio
      </button>
    );
  }

  return (
    <div className="w-full space-y-3">
      <form onSubmit={pedirConfirmacion} className="flex flex-wrap items-end gap-2" noValidate>
        <label className="block flex-1 min-w-40">
          <span className="mb-1.5 block text-sm font-medium text-[#222A33]">Nuevo precio ({moneda})</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            autoFocus
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            aria-invalid={!!errorValidacion}
            className="w-full rounded-lg border border-[#222A33]/25 bg-white px-3.5 py-2 text-[#222A33] focus:border-[#1E4273] focus:outline-none focus:ring-2 focus:ring-[#1E4273]/25"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-[#1E4273] px-4 py-2 font-medium text-white transition hover:bg-[#18355C]"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={cancelarEdicion}
          className="rounded-lg px-4 py-2 font-medium text-[#222A33]/70 hover:text-[#222A33]"
        >
          Cancelar
        </button>
      </form>

      {errorValidacion && <p className="text-sm text-red-700">{errorValidacion}</p>}
      {errorGuardado && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
          {errorGuardado}
        </div>
      )}

      {confirmando && (
        <DialogoConfirmacion
          precioAnterior={formatearPrecio(precioActual, moneda)}
          precioNuevo={formatearPrecio(nuevoPrecio, moneda)}
          guardando={guardando}
          onConfirmar={confirmar}
          onCancelar={() => setConfirmando(false)}
        />
      )}
    </div>
  );
}

function DialogoConfirmacion({ precioAnterior, precioNuevo, guardando, onConfirmar, onCancelar }) {
  const botonConfirmar = useRef(null);

  useEffect(() => {
    botonConfirmar.current?.focus();
  }, []);

  useEffect(() => {
    const alPresionar = (e) => { if (e.key === 'Escape' && !guardando) onCancelar(); };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [guardando, onCancelar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#222A33]/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-precio-titulo"
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id="confirmar-precio-titulo" className="text-lg font-semibold text-[#222A33]">
          ¿Confirmas el cambio de precio?
        </h2>
        <p className="mt-3 text-[#222A33]/80">
          <span className="line-through">{precioAnterior}</span>
          <span className="mx-2" aria-hidden="true">→</span>
          <span className="font-semibold text-[#222A33]">{precioNuevo}</span>
        </p>
        <p className="mt-2 text-sm text-[#222A33]/60">
          El cambio quedará registrado en el historial de precios y no se podrá borrar.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={guardando}
            className="rounded-lg px-4 py-2 font-medium text-[#222A33]/70 hover:text-[#222A33] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            ref={botonConfirmar}
            type="button"
            onClick={onConfirmar}
            disabled={guardando}
            className="rounded-lg bg-[#2E9E6B] px-4 py-2 font-medium text-white transition hover:bg-[#278A5D] disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Sí, cambiar precio'}
          </button>
        </div>
      </div>
    </div>
  );
}
