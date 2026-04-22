import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useMemo, useState, FormEvent } from "react";
import { Search, Home, MapPin, Waves } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const buildSearchTerm = (pathname: string): string => {
  const cleaned = pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .pop() || "";
  if (!cleaned) return "";
  return cleaned
    .replace(/[-_]+/g, " ")
    .replace(/\.[a-z0-9]+$/i, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchTerm = useMemo(() => buildSearchTerm(location.pathname), [location.pathname]);
  const [query, setQuery] = useState(searchTerm);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    setQuery(searchTerm);
  }, [searchTerm]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/busca?q=${encodeURIComponent(q)}`);
  };

  const destinations = [
    { to: "/imoveis", label: "Ver Imóveis à Venda", icon: Home, emoji: "🏠" },
    { to: "/guia", label: "Explorar o Guia Local", icon: MapPin, emoji: "📍" },
    { to: "/tabua-de-mares", label: "Tábua de Marés", icon: Waves, emoji: "🌊" },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl md:text-4xl font-serif font-semibold text-ocean-deep leading-tight mb-4">
          Ops! Parece que o vento mudou de direção...
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          A página que você tentou acessar não está mais aqui.
        </p>
        {searchTerm && (
          <p className="text-base text-foreground/80 mb-8">
            Você estava procurando por <span className="font-semibold text-primary">{searchTerm}</span>?
          </p>
        )}
        {!searchTerm && <div className="mb-8" />}

        <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquise no site..."
            autoFocus
            className="h-14 pl-12 pr-28 text-base rounded-full shadow-md border-border bg-card focus-visible:ring-primary"
          />
          <Button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-full px-5"
          >
            Buscar
          </Button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Ou explore nossos destinos principais
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {destinations.map(({ to, label, icon: Icon, emoji }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <span aria-hidden>{emoji}</span>
                <Icon className="hidden" />
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
