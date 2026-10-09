import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import RutaProtegida from '../components/RutaProtegida';
import Login from '../pages/Login';
import Registro from '../pages/Registro';
import Recuperacion from '../pages/Recuperacion';
import NuevaPassword from '../pages/NuevaPassword';
import Verificado from '../pages/Verificado';
import FormularioPublicacion from '../components/FormularioPublicacion';

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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}