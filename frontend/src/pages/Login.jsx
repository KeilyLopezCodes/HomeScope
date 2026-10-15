import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alerta, AuthLayout, Boton, Campo, enlace } from '../components/AuthUI';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthLayout
      titulo="Inicia sesión"
      subtitulo="Entra a tu cuenta de HomeScope."
      pie={<>¿No tienes cuenta? <Link to="/registro" className={enlace}>Crea una</Link></>}
    >
      <Alerta tipo="ok">{location.state?.aviso}</Alerta>
      <form onSubmit={enviar} className="space-y-5">
        <Campo etiqueta="Correo electrónico" type="email" name="email" autoComplete="email" required value={form.email} onChange={cambiar} />
        <Campo etiqueta="Contraseña" type="password" name="password" autoComplete="current-password" required value={form.password} onChange={cambiar} />
        <Alerta>{error}</Alerta>
        <Boton type="submit" cargando={cargando}>Iniciar sesión</Boton>
      </form>
      <Link to="/recuperar" className={`${enlace} block text-sm`}>¿Olvidaste tu contraseña?</Link>
    </AuthLayout>
  );
}