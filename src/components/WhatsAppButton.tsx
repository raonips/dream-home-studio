import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const WhatsAppButton = () => {
  const location = useLocation();
  const { whatsapp_number } = useSiteSettings();
  const phone = whatsapp_number || '5571991089039';
  const message = location.pathname.startsWith("/condominio/")
    ? "Olá, gostaria de saber mais sobre os imóveis neste condomínio."
    : "Olá! Vi um imóvel no site e gostaria de mais informações.";

  return (
    <a
      href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:scale-110 transition-transform animate-pulse-whatsapp"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
};

export default WhatsAppButton;
