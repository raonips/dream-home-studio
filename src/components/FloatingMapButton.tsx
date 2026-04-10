import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Map } from "lucide-react";

const FloatingMapButton = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on the map page itself
  const isMapPage = location.pathname === "/mapa";

  useEffect(() => {
    if (isMapPage) return;
    const handleScroll = () => setVisible(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMapPage]);

  if (isMapPage || !visible) return null;

  return (
    <button
      onClick={() => navigate("/mapa")}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-[hsl(220,60%,15%)] text-white shadow-lg hover:bg-[hsl(220,60%,20%)] transition-all animate-fade-in"
      aria-label="Ver Mapa"
    >
      <Map className="h-5 w-5" />
      <span className="text-sm font-medium">Ver Mapa</span>
    </button>
  );
};

export default FloatingMapButton;
