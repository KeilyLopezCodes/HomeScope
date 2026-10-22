import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { iniciarConversacion } from '../api/chatApi';

// Botón para la ficha de propiedad: abre (o retoma) el chat con el vendedor de ESA propiedad.
export default function BotonContactar({ propiedadId }) {
  const { estaAutenticado } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const abrir = async () => {
    if (!estaAutenticado) return navigate('/login');
    setCargando(true);
    setError('');
    try {
      const { conversacion_id } = await iniciarConversacion(propiedadId);
      navigate(`/mensajes/${conversacion_id}`);
    } catch (e) {
      setError(e.message);
      setCargando(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={abrir} disabled={cargando}
        className="rounded-lg bg-[#1E4273] px-4 py-2 text-white disabled:opacity-60">
        {cargando ? 'Abriendo chat…' : 'Enviar mensaje al vendedor'}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}