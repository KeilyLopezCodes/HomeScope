import { Link, useSearchParams } from 'react-router-dom';
import PanelEstadisticas from '../components/PanelEstadisticas';
import ListaVisitas from '../components/ListaVisitas';
import EditorDisponibilidad from '../components/EditorDisponibilidad';
import MisPropiedades from './MisPropiedades';

const PESTANAS = [
  { id: 'resumen', texto: 'Resumen' },
  { id: 'propiedades', texto: 'Mis propiedades' },
  { id: 'visitas', texto: 'Visitas recibidas' },
  { id: 'mis-visitas', texto: 'Mis visitas' },
  { id: 'disponibilidad', texto: 'Disponibilidad' },
];

// Panel del vendedor: estadísticas e interés, solicitudes de visita y horarios de atención
export default function PanelVendedor() {
  const [params] = useSearchParams();
  const pedida = params.get('tab');
  const tab = PESTANAS.some((p) => p.id === pedida) ? pedida : 'resumen';

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-[#222A33]">Mi panel</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">Cómo van tus publicaciones, tus visitas y tus horarios.</p>

      <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-slate-200/60 p-1">
        {PESTANAS.map((p) => (
          <Link
            key={p.id}
            to={`/panel?tab=${p.id}`}
            role="tab"
            aria-selected={tab === p.id}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${tab === p.id ? 'bg-white text-[#1E4273] shadow-sm' : 'text-slate-600 hover:text-[#222A33]'}`}
          >
            {p.texto}
          </Link>
        ))}
      </div>

      {tab === 'resumen' && <PanelEstadisticas />}
      {tab === 'propiedades' && <MisPropiedades incrustado />}
      {tab === 'visitas' && <ListaVisitas rol="vendedor" />}
      {tab === 'mis-visitas' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Las visitas que pediste a propiedades de otros vendedores.</p>
          <ListaVisitas rol="comprador" />
        </div>
      )}
      {tab === 'disponibilidad' && <EditorDisponibilidad />}
    </div>
  );
}