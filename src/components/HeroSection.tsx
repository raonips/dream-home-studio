import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const HeroSection = () => {
  const {
    hero_bg_desktop, hero_bg_mobile, hero_image_url,
    hero_title, hero_subtitle, condominios_list,
  } = useSiteSettings();
  const navigate = useNavigate();

  const desktop = hero_bg_desktop || hero_image_url || '';
  const mobile = hero_bg_mobile || desktop;

  const [tipo, setTipo] = useState("Todos");
  const [localizacao, setLocalizacao] = useState("Todos");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (tipo !== "Todos") params.set("tipo", tipo);
    const qs = params.toString();

    if (localizacao !== "Todos") {
      navigate(`/condominio/${localizacao}${qs ? `?${qs}` : ""}`);
    } else {
      navigate(`/imoveis${qs ? `?${qs}` : ""}`);
    }
  };

  const titleParts = hero_title.split('\n');

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center pt-20 bg-muted">
      <picture>
        {mobile && mobile !== desktop && (
          <source media="(max-width: 768px)" srcSet={mobile} />
        )}
        {desktop && (
          <source media="(min-width: 769px)" srcSet={desktop} />
        )}
        <img
          src={desktop || mobile}
          alt="Litoral de Barra do Jacuípe"
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
          decoding="sync"
          loading="eager"
        />
      </picture>

      <div className="relative container text-center px-4" style={{ zIndex: 3 }}>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-4 md:mb-6 drop-shadow-lg">
          {titleParts[0]}
          {titleParts.length > 1 && (
            <>
              <br />
              <span className="text-ocean-light">{titleParts[1]}</span>
            </>
          )}
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-primary-foreground/85 max-w-2xl mx-auto mb-8 md:mb-12 drop-shadow">
          {hero_subtitle}
        </p>

        <div className="bg-background/95 backdrop-blur-sm rounded-xl shadow-hero p-4 md:p-6 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label htmlFor="hero-tipo" className="block text-xs font-semibold text-muted-foreground mb-1.5 text-left">
                Tipo de Imóvel
              </label>
              <select
                id="hero-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                aria-label="Filtrar por tipo de imóvel"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option>Todos</option>
                <option>Casa</option>
                <option>Sítio</option>
                <option>Terreno</option>
                <option>Apartamento</option>
              </select>
            </div>
            <div>
              <label htmlFor="hero-localizacao" className="block text-xs font-semibold text-muted-foreground mb-1.5 text-left">
                Condomínio / Localização
              </label>
              <select
                id="hero-localizacao"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                aria-label="Filtrar por condomínio ou localização"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="Todos">Todos</option>
                {condominios_list.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold rounded-lg px-6 py-2.5 hover:bg-primary/90 transition-colors text-sm"
              >
                <Search className="h-4 w-4" />
                Buscar Imóveis
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
