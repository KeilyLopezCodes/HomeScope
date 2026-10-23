import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from '../context/AuthContext';
import RutaProtegida from '../components/RutaProtegida';
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
import { ChatProvider } from '../context/ChatContext';
import Mensajes from '../pages/Mensajes';
import Layout from "../components/Layout";
import Notificaciones from "../pages/Notificaciones";

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
        <ChatProvider>
                  <Routes>
            {/* Pantallas de acceso: sin menú */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperacion" element={<Recuperacion />} />
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
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}