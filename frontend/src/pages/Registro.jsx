import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrar } from '../services/authApi';
import { Alerta, AuthLayout, Boton, Campo, enlace } from '../components/AuthUI';

export default function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', confirmar: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (form.password !== form.confirmar) return setError('Las contraseñas no coinciden.');

    setCargando(true);
    try {
      const { confirmar, ...datos } = form; 
      await registrar(datos);
      navigate('/login', {
        state: { aviso: 'Cuenta creada. Revisa tu correo y da clic en el link para activarla.' },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthLayout
      titulo="Crea tu cuenta"
      subtitulo="Te mandaremos un correo para activarla."
      pie={<>¿Ya tienes cuenta? <Link to="/login" className={enlace}>Inicia sesión</Link></>}
    >
      <form onSubmit={enviar} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Nombre" name="nombre" autoComplete="given-name" required value={form.nombre} onChange={cambiar} />
          <Campo etiqueta="Apellido" name="apellido" autoComplete="family-name" required value={form.apellido} onChange={cambiar} />
        </div>
        <Campo etiqueta="Correo electrónico" type="email" name="email" autoComplete="email" required value={form.email} onChange={cambiar} />
        <Campo etiqueta="Contraseña" type="password" name="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" required value={form.password} onChange={cambiar} />
        <Campo etiqueta="Repite la contraseña" type="password" name="confirmar" autoComplete="new-password" required value={form.confirmar} onChange={cambiar} />
        <Alerta>{error}</Alerta>
        <Boton type="submit" cargando={cargando}>Crear cuenta</Boton>
      </form>
    </AuthLayout>
  );
}