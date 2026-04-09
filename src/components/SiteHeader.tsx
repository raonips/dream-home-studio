import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import logoDefault from "@/assets/site-logo-imoveis-barra-do-jacuipe.webp";

const navLinks = [
  { label: "Guia Local", href: "/", external: false },
  { label: "Imóveis", href: "/imoveis", external: false },
  { label: "Imóveis à Venda", href: "/imoveis/vendas", external: false },
  { label: "Temporada", href: "/imoveis/temporada", external: false },
  { label: "Condomínios", href: "/imoveis/condominios", external: false },
  { label: "Contato", href: "/imoveis/contato", external: false },
  { label: "Portal Barra", href: "https://www.barradojacuipe.com.br/", external: true },
];

const SiteHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { logo_url } = useSiteSettings();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center m-0 p-0">
          <img src={logo_url || logoDefault} alt="Imóveis Barra do Jacuípe" className="h-14 md:h-[4.5rem] max-w-[250px] object-contain" width={250} height={72} />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                {link.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-foreground"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <nav className="container flex flex-col py-4 gap-3">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2 flex items-center gap-1"
                >
                  {link.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "text-base font-medium transition-colors py-2",
                    location.pathname === link.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
