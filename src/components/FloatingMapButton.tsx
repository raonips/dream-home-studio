import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Map } from "lucide-react";

/**
 * Maps the current route context to a query param for /mapa pre-filtering.
 */
const getMapQuery = (pathname: string): string => {
  // Category listing pages → filter by mapped categories
  if (pathname === "/locais/gastronomia") return "?categoria=gastronomia";
  if (pathname === "/locais/hospedagem") return "?categoria=hospedagem";
  if (pathname === "/locais/utilidades") return "?categoria=utilidade";
  if (pathname === "/locais/condominios") return "?categoria=condominio";

  // Guia categoria pages
  const guiaMatch = pathname.match(/^\/guia\/categoria\/(.+)/);
  if (guiaMatch) return `?categoria=${guiaMatch[1]}`;

  // Condomínio detail page → filter by that condomínio
  const condoMatch = pathname.match(/^\/imoveis\/condominio\/(.+)/);
  if (condoMatch) return `?condominio=${condoMatch[1]}`;

  return "";
};

const FloatingMapButton = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isMapPage = location.pathname === "/mapa";
  const isAdminPage = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (isMapPage || isAdminPage) return;
    const handleScroll = () => setVisible(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMapPage, isAdminPage]);

  if (isMapPage || isAdminPage || !visible) return null;

  const query = getMapQuery(location.pathname);

  return (
    <button
      onClick={() => navigate(`/mapa${query}`)}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-[hsl(220,60%,15%)] text-white shadow-lg hover:bg-[hsl(220,60%,20%)] transition-all animate-fade-in"
      aria-label="Ver Mapa"
    >
      <Map className="h-5 w-5" />
      <span className="text-sm font-medium">Ver Mapa</span>
    </button>
  );
};

export default FloatingMapButton;
