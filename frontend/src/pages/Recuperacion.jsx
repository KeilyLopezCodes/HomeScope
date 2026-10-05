import { useState } from 'react';
import { Link } from 'react-router-dom';
import { pedirRecuperacion } from '../services/authApi';
import { Alerta, AuthLayout, Boton, Campo, enlace } from '../components/AuthUI';

export default function Recuperacion() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await pedirRecuperacion(email);
      setEnviado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthLayout
      titulo="Recupera tu contraseña"
      subtitulo="Escribe tu correo y te mandamos un link para crear una nueva."
      pie={<Link to="/login" className={enlace}>Volver a iniciar sesión</Link>}
    >
      {enviado ? (
        <Alerta tipo="ok">
          Si ese correo está registrado, te enviamos un link. Es válido por 15 minutos.
        </Alerta>
      ) : (
        <form onSubmit={enviar} className="space-y-5">
          <Campo etiqueta="Correo electrónico" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Alerta>{error}</Alerta>
          <Boton type="submit" cargando={cargando}>Enviar link</Boton>
        </form>
      )}
    </AuthLayout>
  );
}