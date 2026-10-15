import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { cambiarPassword } from '../services/authApi';
import { Alerta, AuthLayout, Boton, Campo, enlace } from '../components/AuthUI';

export default function NuevaPassword() {
  const [params] = useSearchParams();
  const token = params.get('token'); // viene en el link del correo
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (password !== confirmar) return setError('Las contraseñas no coinciden.');

    setCargando(true);
    try {
      await cambiarPassword(token, password);
      navigate('/login', { state: { aviso: 'Contraseña actualizada. Ya puedes iniciar sesión.' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout titulo="Link incompleto" pie={<Link to="/recuperar" className={enlace}>Pedir un link nuevo</Link>}>
        <Alerta>Este link no trae el código necesario. Pide uno nuevo.</Alerta>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout titulo="Crea una nueva contraseña" subtitulo="Elige una que no hayas usado antes.">
      <form onSubmit={enviar} className="space-y-5">
        <Campo etiqueta="Nueva contraseña" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Campo etiqueta="Repite la contraseña" type="password" autoComplete="new-password" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        <Alerta>{error}</Alerta>
        <Boton type="submit" cargando={cargando}>Guardar contraseña</Boton>
      </form>
    </AuthLayout>
  );
}