import { Link, useSearchParams } from 'react-router-dom';
import { Alerta, AuthLayout, enlace } from '../components/AuthUI';

export default function Verificado() {
  const [params] = useSearchParams();
  const ok = params.get('status') === 'ok';

  return (
    <AuthLayout
      titulo={ok ? 'Cuenta verificada' : 'No pudimos verificar tu cuenta'}
      pie={<Link to="/login" className={enlace}>Ir a iniciar sesión</Link>}
    >
      <Alerta tipo={ok ? 'ok' : 'error'}>
        {ok
          ? 'Tu correo quedó confirmado. Ya puedes entrar.'
          : 'El link es inválido o ya expiró. Regístrate de nuevo para recibir otro.'}
      </Alerta>
    </AuthLayout>
  );
}