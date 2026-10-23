import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/catalogo" className="flex items-center gap-2">
          <img src={logo} alt="HomeScope" className="h-8 w-8" />
          <span className="text-lg font-bold text-[#1E4273]">HomeScope</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#222A33]">
          <Link to="/" className="hover:text-[#1E4273]">Inicio</Link>
          <Link to="/catalogo" className="hover:text-[#1E4273]">Catálogo</Link>
          <Link to="/favoritos" className="hover:text-[#1E4273]">Favoritos</Link>
          <Link to="/publicar" className="hover:text-[#1E4273]">Publicar</Link>
        </nav>

        <Link
          to="/publicar"
          className="bg-[#2E9E6B] text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90"
        >
          Publicar propiedad
        </Link>
      </div>
    </header>
  );
}