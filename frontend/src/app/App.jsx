import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import RutaProtegida from '../components/RutaProtegida';
import Layout from "../components/Layout";

import Login from '../pages/Login';
import Registro from '../pages/Registro';
import Recuperacion from '../pages/Recuperacion';
import NuevaPassword from '../pages/NuevaPassword';
import Verificado from '../pages/Verificado';
import FormularioPublicacion from '../components/FormularioPublicacion';
import FichaPropiedad from '../pages/FichaPropiedad';
import Catalogo from "../pages/Catalogo";
import Favoritos from "../pages/Favoritos";
import Comparador from "../pages/Comparador";
import Mensajes from '../pages/Mensajes';
import Notificaciones from "../pages/Notificaciones";
import MisVisitas from "../pages/MisVisitas";
import PanelVendedor from "../pages/PanelVendedor";

// ── Panel administrativo ──
import RutaAdmin from '../components/RutaAdmin';
import AdminLayout from '../components/admin/AdminLayout';
import AdminResumen from '../pages/admin/AdminResumen';
import AdminReportes from '../pages/admin/AdminReportes';
import AdminReporteDetalle from '../pages/admin/AdminReporteDetalle';
import AdminUsuarios from '../pages/admin/AdminUsuarios';
import AdminAuditoria from '../pages/admin/AdminAuditoria';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <Routes>
            {/* Pantallas de acceso: sin menú */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar" element={<Recuperacion />} />
            <Route path="/nueva-password" element={<NuevaPassword />} />
            <Route path="/verificado" element={<Verificado />} />

            {/* Pantallas con menú. Para agregar una: <Route> aquí + enlace en Header.jsx (ENLACES) */}
            <Route element={<Layout />}>
              <Route path="/" element={<Catalogo />} />
              <Route path="/catalogo" element={<Navigate to="/" replace />} />
              <Route path="/favoritos" element={<Favoritos />} />
              <Route path="/comparador" element={<Comparador />} />
              <Route path="/propiedades/:id" element={<FichaPropiedad />} />
              <Route path="/publicar" element={<RutaProtegida><FormularioPublicacion /></RutaProtegida>} />
              <Route path="/mensajes" element={<RutaProtegida><Mensajes /></RutaProtegida>} />
              <Route path="/mensajes/:id" element={<RutaProtegida><Mensajes /></RutaProtegida>} />
              <Route path="/notificaciones" element={<RutaProtegida><Notificaciones /></RutaProtegida>} />
              <Route path="/visitas" element={<RutaProtegida><MisVisitas /></RutaProtegida>} />
              <Route path="/panel" element={<RutaProtegida><PanelVendedor /></RutaProtegida>} />
            </Route>

            {/* ── Panel administrativo (sesión + rol administrador), con su propio layout ── */}
            <Route path="/admin" element={<RutaAdmin><AdminLayout /></RutaAdmin>}>
              <Route index element={<AdminResumen />} />
              <Route path="reportes" element={<AdminReportes />} />
              <Route path="reportes/:id" element={<AdminReporteDetalle />} />
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="auditoria" element={<AdminAuditoria />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}