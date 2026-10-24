import { Link } from 'react-router-dom';
import ListaVisitas from '../components/ListaVisitas';

// Visitas que el usuario pidió como comprador
export default function MisVisitas() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold text-[#222A33]">Mis visitas</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        Las visitas que pediste a otras propiedades. ¿Eres vendedor? Responde las solicitudes en{' '}
        <Link to="/panel?tab=visitas" className="font-medium text-[#1E4273] underline">Mi panel</Link>.
      </p>
      <ListaVisitas rol="comprador" />
    </div>
  );
}