import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import logoDefault from "@/assets/site-logo-imoveis-barra-do-jacuipe.webp";
import SmartSearch from "@/components/SmartSearch";

interface NavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

const guiaNavItems: NavItem[] = [
  { label: "Início", href: "/" },
  {
    label: "O Destino",
    children: [
      { label: "Praias", href: "/guia/praias" },
      { label: "Rio Jacuípe", href: "/guia/rio-jacuipe" },
      { label: "História", href: "/guia/historia" },
    ],
  },
  {
    label: "Serviços",
    children: [
      { label: "Gastronomia", href: "/locais/gastronomia" },
      { label: "Hospedagem", href: "/locais/hospedagem" },
      { label: "Utilidades", href: "/locais/utilidades" },
    ],
  },
  { label: "Condomínios", href: "/locais/condominios" },
  { label: "Tábua de Marés", href: "/tabua-de-mares/barra-do-jacuipe" },
  { label: "Imóveis", href: "/imoveis" },
  // { label: "Blog", href: "/guia" }, // temporariamente oculto
];

const imoveisNavItems: NavItem[] = [
  { label: "Início", href: "/imoveis" },
  { label: "Imóveis à Venda", href: "/imoveis/vendas" },
  { label: "Temporada", href: "/imoveis/temporada" },
  { label: "Condomínios", href: "/imoveis/condominios" },
  { label: "Tábua de Marés", href: "/tabua-de-mares/barra-do-jacuipe" },
  { label: "Contato", href: "/imoveis/contato" },
  { label: "Portal Barra", href: "/" },
];

const DropdownMenu = ({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isChildActive = item.children?.some((c) => pathname === c.href);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors",
          isChildActive
            ? "text-primary"
            : "text-muted-foreground hover:text-primary"
        )}
      >
        {item.label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[180px] rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-lg py-1.5 z-50">
          {item.children!.map((child) => (
            <Link
              key={child.href}
              to={child.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-2.5 text-sm font-medium transition-colors rounded-lg mx-1",
                pathname === child.href
                  ? "text-primary bg-accent/10"
                  : "text-muted-foreground hover:text-primary hover:bg-accent/5"
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const SiteHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDropdowns, setMobileDropdowns] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const { logo_url, header_logo_url } = useSiteSettings();
  const displayLogo = header_logo_url || logo_url || logoDefault;

  const isImoveisSection = location.pathname.startsWith("/imoveis");
  const navItems = isImoveisSection ? imoveisNavItems : guiaNavItems;

  const toggleMobileDropdown = (label: string) => {
    setMobileDropdowns((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link to={isImoveisSection ? "/imoveis" : "/"} className="flex items-center m-0 p-0">
          <img
            src={displayLogo}
            alt="Barra do Jacuípe"
            className="h-14 md:h-[4.5rem] max-w-[250px] object-contain"
            width={250}
            height={72}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {navItems.map((item) =>
            item.children ? (
              <DropdownMenu
                key={item.label}
                item={item}
                pathname={location.pathname}
              />
            ) : (
              <Link
                key={item.label}
                to={item.href!}
                className={cn(
                  "text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                {item.label}
              </Link>
            )
          )}
          {/* Search icon in header */}
          <SmartSearch variant="header" />
        </nav>

        {/* Mobile: search + menu toggle */}
        <div className="flex items-center gap-1 md:hidden">
          <SmartSearch variant="header" />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-foreground"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <nav className="container flex flex-col py-4 gap-1">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMobileDropdown(item.label)}
                    className={cn(
                      "w-full flex items-center justify-between text-base font-medium transition-colors py-2.5",
                      item.children.some((c) => location.pathname === c.href)
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        mobileDropdowns[item.label] && "rotate-180"
                      )}
                    />
                  </button>
                  {mobileDropdowns[item.label] && (
                    <div className="pl-4 flex flex-col gap-0.5 pb-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "text-sm font-medium py-2 transition-colors",
                            location.pathname === child.href
                              ? "text-primary"
                              : "text-muted-foreground hover:text-primary"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.label}
                  to={item.href!}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "text-base font-medium transition-colors py-2.5",
                    location.pathname === item.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {item.label}
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
