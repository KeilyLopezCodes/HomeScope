import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import RutaProtegida from '../components/RutaProtegida';
import Login from '../pages/Login';
import Registro from '../pages/Registro';
import Recuperacion from '../pages/Recuperacion';
import NuevaPassword from '../pages/NuevaPassword';
import Verificado from '../pages/Verificado';
import FormularioPublicacion from '../components/FormularioPublicacion';
import FichaPropiedad from '../pages/FichaPropiedad';

// ── Panel administrativo ──
import RutaAdmin from '../components/RutaAdmin';
import AdminLayout from '../components/admin/AdminLayout';
import AdminResumen from '../pages/admin/AdminResumen';
import AdminReportes from '../pages/admin/AdminReportes';
import AdminReporteDetalle from '../pages/admin/AdminReporteDetalle';
import AdminUsuarios from '../pages/admin/AdminUsuarios';
import AdminAuditoria from '../pages/admin/AdminAuditoria';

// Pantalla temporal para probar que el login funciona. Reemplázala por tu home real.
function Inicio() {
  const { user, logout } = useAuth();
  return (
    <div className="p-10">
      <h1 className="text-2xl font-semibold">Hola, {user?.nombre}</h1>
      <button onClick={logout} className="mt-4 rounded-lg bg-[#1E4273] px-4 py-2 text-white">
        Cerrar sesión
      </button>
    </div>
  );
}
 
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RutaProtegida><Inicio /></RutaProtegida>} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar" element={<Recuperacion />} />
          <Route path="/nueva-password" element={<NuevaPassword />} />
          <Route path="/verificado" element={<Verificado />} />
          <Route path="/publicar" element={<RutaProtegida><FormularioPublicacion /></RutaProtegida>} />
          <Route path="/propiedades/:id" element={<FichaPropiedad />} />

          {/* ── Panel administrativo (sesión + rol administrador) ── */}
          <Route path="/admin" element={<RutaAdmin><AdminLayout /></RutaAdmin>}>
            <Route index element={<AdminResumen />} />
            <Route path="reportes" element={<AdminReportes />} />
            <Route path="reportes/:id" element={<AdminReporteDetalle />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="auditoria" element={<AdminAuditoria />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}