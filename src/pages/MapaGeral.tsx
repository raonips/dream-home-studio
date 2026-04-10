import { useState, useEffect, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, MapPin, Loader2, X, Filter,
  Store, UtensilsCrossed, Hotel, Home, Pill,
  Flame, SprayCan, Heart, Building2, ChevronLeft, ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SafeImage from "@/components/SafeImage";
import SmartMap from "@/components/SmartMap";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapLocal {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  categoria: string;
  imagem_destaque: string | null;
  logo_url: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  tipo: "local" | "condominio";
}

const CATEGORIA_LABELS: Record<string, string> = {
  condominio: "Condomínio",
  mercado: "Mercado",
  padaria: "Padaria",
  restaurante: "Restaurante",
  hospedagem: "Hospedagem",
  saude: "Saúde",
  gas: "Gás",
  limpeza: "Limpeza",
  farmacia: "Farmácia",
  utilidade: "Utilidade",
  gastronomia: "Gastronomia",
};

const CATEGORIA_ICONS: Record<string, React.ElementType> = {
  condominio: Home,
  mercado: Store,
  padaria: UtensilsCrossed,
  restaurante: UtensilsCrossed,
  hospedagem: Hotel,
  saude: Heart,
  gas: Flame,
  limpeza: SprayCan,
  farmacia: Pill,
  utilidade: Building2,
  gastronomia: UtensilsCrossed,
};

const CATEGORIA_COLORS: Record<string, string> = {
  condominio: "#2563eb",
  mercado: "#16a34a",
  padaria: "#ea580c",
  restaurante: "#dc2626",
  hospedagem: "#7c3aed",
  saude: "#ec4899",
  gas: "#f59e0b",
  limpeza: "#06b6d4",
  farmacia: "#10b981",
  utilidade: "#6b7280",
  gastronomia: "#f97316",
};

// Center of Barra do Jacuípe
const DEFAULT_CENTER: [number, number] = [-12.695, -38.14];
const DEFAULT_ZOOM = 13;

const MapaGeral = () => {
  const [allLocais, setAllLocais] = useState<MapLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [locaisRes, condominiosRes] = await Promise.all([
        supabase.from("locais").select("id,nome,slug,descricao,categoria,imagem_destaque,logo_url,endereco,latitude,longitude").eq("ativo", true),
        supabase.from("condominios").select("id,name,slug,description,featured_image,thumbnail_url,latitude,longitude"),
      ]);

      const locais: MapLocal[] = (locaisRes.data || []).map((l: any) => ({
        id: l.id, nome: l.nome, slug: l.slug, descricao: l.descricao,
        categoria: l.categoria, imagem_destaque: l.imagem_destaque,
        logo_url: l.logo_url, endereco: l.endereco,
        latitude: l.latitude, longitude: l.longitude, tipo: "local" as const,
      }));

      const condominios: MapLocal[] = (condominiosRes.data || []).map((c: any) => ({
        id: c.id, nome: c.name, slug: c.slug, descricao: c.description,
        categoria: "condominio", imagem_destaque: c.featured_image || c.thumbnail_url,
        logo_url: null, endereco: null,
        latitude: c.latitude, longitude: c.longitude, tipo: "condominio" as const,
      }));

      setAllLocais([...locais, ...condominios]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const categorias = useMemo(() => {
    const cats = new Set(allLocais.map(l => l.categoria));
    return Array.from(cats).sort();
  }, [allLocais]);

  const filtered = useMemo(() => {
    let items = allLocais;
    if (selectedCategoria) items = items.filter(l => l.categoria === selectedCategoria);
    if (search.trim()) {
      const s = search.toLowerCase();
      items = items.filter(l => l.nome.toLowerCase().includes(s) || l.endereco?.toLowerCase().includes(s));
    }
    return items;
  }, [allLocais, selectedCategoria, search]);

  const withCoords = useMemo(() => filtered.filter(l => l.latitude && l.longitude), [filtered]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when filtered changes
  useEffect(() => {
    if (!markersRef.current || !mapInstanceRef.current) return;
    markersRef.current.clearLayers();

    withCoords.forEach((local) => {
      const color = CATEGORIA_COLORS[local.categoria] || "#6b7280";
      const logoHtml = local.logo_url
        ? `<img src="${local.logo_url}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3);" />`
        : `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
           </div>`;

      const icon = L.divIcon({
        html: logoHtml,
        className: "custom-map-marker",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([local.latitude!, local.longitude!], { icon }).addTo(markersRef.current!);

      const linkPath = local.tipo === "condominio"
        ? `/imoveis/condominio/${local.slug}`
        : `/locais/${local.slug}`;

      marker.bindPopup(`
        <div style="min-width:180px;font-family:'Inter',sans-serif;">
          ${local.imagem_destaque ? `<img src="${local.imagem_destaque}" style="width:100%;height:100px;object-fit:cover;border-radius:8px 8px 0 0;margin-bottom:8px;" />` : ""}
          <div style="padding:0 4px 4px;">
            <strong style="font-size:14px;font-family:'Montserrat',sans-serif;">${local.nome}</strong>
            <p style="font-size:12px;color:#666;margin:4px 0;">${CATEGORIA_LABELS[local.categoria] || local.categoria}</p>
            <a href="${linkPath}" style="color:#2563eb;font-size:12px;text-decoration:none;">Ver detalhes →</a>
          </div>
        </div>
      `);
    });

    // Fit bounds if we have markers
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map(l => [l.latitude!, l.longitude!] as [number, number]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [withCoords]);

  return (
    <>
      <Helmet>
        <title>Mapa de Barra do Jacuípe — Todos os Locais</title>
        <meta name="description" content="Explore todos os locais de Barra do Jacuípe no mapa: condomínios, restaurantes, mercados, farmácias e mais." />
      </Helmet>

      <div className="pt-16 md:pt-20 h-screen flex flex-col bg-background">
        {/* Top bar */}
        <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar local..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter className="h-4 w-4 mr-1" /> Filtros
          </Button>

          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <Badge
              variant={!selectedCategoria ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => setSelectedCategoria(null)}
            >
              Todos ({allLocais.length})
            </Badge>
            {categorias.map((cat) => {
              const Icon = CATEGORIA_ICONS[cat] || MapPin;
              const count = allLocais.filter(l => l.categoria === cat).length;
              return (
                <Badge
                  key={cat}
                  variant={selectedCategoria === cat ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors gap-1"
                  onClick={() => setSelectedCategoria(selectedCategoria === cat ? null : cat)}
                >
                  <Icon className="h-3 w-3" />
                  {CATEGORIA_LABELS[cat] || cat} ({count})
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Mobile filters */}
        {showFilters && (
          <div className="md:hidden border-b border-border bg-card px-4 py-3 flex flex-wrap gap-2">
            <Badge
              variant={!selectedCategoria ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => { setSelectedCategoria(null); setShowFilters(false); }}
            >
              Todos
            </Badge>
            {categorias.map((cat) => {
              const Icon = CATEGORIA_ICONS[cat] || MapPin;
              return (
                <Badge
                  key={cat}
                  variant={selectedCategoria === cat ? "default" : "outline"}
                  className="cursor-pointer gap-1"
                  onClick={() => { setSelectedCategoria(selectedCategoria === cat ? null : cat); setShowFilters(false); }}
                >
                  <Icon className="h-3 w-3" />
                  {CATEGORIA_LABELS[cat] || cat}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Card list */}
          <div className="w-full md:w-[380px] lg:w-[420px] overflow-y-auto border-r border-border bg-background shrink-0">
            <div className="p-4 border-b border-border">
              <p className="text-sm text-muted-foreground font-medium">
                {filtered.length} {filtered.length === 1 ? "local encontrado" : "locais encontrados"}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum local encontrado.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((local) => {
                  const linkPath = local.tipo === "condominio"
                    ? `/imoveis/condominio/${local.slug}`
                    : `/locais/${local.slug}`;
                  const Icon = CATEGORIA_ICONS[local.categoria] || MapPin;
                  const color = CATEGORIA_COLORS[local.categoria] || "#6b7280";

                  return (
                    <Link
                      key={local.id}
                      to={linkPath}
                      className={`flex gap-3 p-4 hover:bg-muted/50 transition-colors ${hoveredId === local.id ? "bg-muted/50" : ""}`}
                      onMouseEnter={() => setHoveredId(local.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {/* Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative">
                        <SafeImage
                          src={local.imagem_destaque || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=60"}
                          alt={local.nome}
                          className="w-full h-full object-cover"
                        />
                        {local.logo_url && (
                          <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden">
                            <img src={local.logo_url} alt="" className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground line-clamp-1 font-display">{local.nome}</h3>
                        {local.endereco && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {local.endereco}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-2">
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium"
                            style={{ backgroundColor: color }}
                          >
                            <Icon className="h-3 w-3" />
                            {CATEGORIA_LABELS[local.categoria] || local.categoria}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Map */}
          <div className="hidden md:block flex-1 relative">
            <div ref={mapRef} className="w-full h-full" />
          </div>
        </div>
      </div>

      <style>{`
        .custom-map-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0;
        }
      `}</style>
    </>
  );
};

export default MapaGeral;
