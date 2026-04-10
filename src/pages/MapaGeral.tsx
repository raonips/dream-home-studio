import { useState, useEffect, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
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

// SVG paths for map markers (Lucide-style, 24x24 viewBox)
const CATEGORIA_SVG_PATHS: Record<string, string> = {
  condominio: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  mercado: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
  padaria: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  restaurante: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  hospedagem: '<path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/><path d="m9 16 .348-.24c1.465-1.013 3.84-1.013 5.304 0L15 16"/><path d="M8 7h.01"/><path d="M16 7h.01"/><path d="M12 7h.01"/><path d="M12 11h.01"/><path d="M16 11h.01"/><path d="M8 11h.01"/>',
  saude: '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/>',
  gas: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  limpeza: '<path d="M10 2v2.343"/><path d="M14 2v6.343"/><path d="M8.667 8 3 14.667"/><path d="m6 12 4.667 4.667"/><path d="M14 2a2 2 0 0 1 2 2v6.333"/><path d="M10 2a2 2 0 0 0-2 2v2.333"/>',
  farmacia: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
  utilidade: '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
  gastronomia: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
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

// Maps URL category groups to individual DB categories
const CATEGORIA_GROUP_MAP: Record<string, string[]> = {
  gastronomia: ["restaurante", "padaria", "gastronomia"],
  hospedagem: ["hospedagem"],
  utilidade: ["utilidade", "gas", "limpeza", "farmacia", "saude", "mercado"],
  condominio: ["condominio"],
};

const MapaGeral = () => {
  const [searchParams] = useSearchParams();
  const initialCategoria = searchParams.get("categoria");
  const condominioFilter = searchParams.get("condominio");

  const [allLocais, setAllLocais] = useState<MapLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(initialCategoria);
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

    // Condomínio filter from URL takes priority
    if (condominioFilter) {
      items = items.filter(l => l.slug === condominioFilter);
    } else if (selectedCategoria) {
      // Check if this is a category group (e.g. "gastronomia" → ["restaurante","padaria","gastronomia"])
      const groupCats = CATEGORIA_GROUP_MAP[selectedCategoria];
      if (groupCats) {
        items = items.filter(l => groupCats.includes(l.categoria));
      } else {
        items = items.filter(l => l.categoria === selectedCategoria);
      }
    }

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

    const isFiltered = !!selectedCategoria;

    withCoords.forEach((local) => {
      const color = CATEGORIA_COLORS[local.categoria] || "#6b7280";
      const svgPaths = CATEGORIA_SVG_PATHS[local.categoria] || '<circle cx="12" cy="12" r="3"/>';

      let markerHtml: string;

      if (isFiltered && local.logo_url) {
        // Filtered mode with logo: show logo + name label
        const shortName = local.nome.length > 18 ? local.nome.substring(0, 16) + "…" : local.nome;
        markerHtml = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
            <div style="width:44px;height:44px;border-radius:50%;background:white;box-shadow:0 2px 8px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;overflow:hidden;">
              <img src="${local.logo_url}" style="width:44px;height:44px;object-fit:cover;" />
            </div>
            <span style="font-family:'Inter',sans-serif;font-size:10px;font-weight:600;color:#1a1a1a;background:rgba(255,255,255,.92);padding:1px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.12);max-width:120px;text-overflow:ellipsis;overflow:hidden;">${shortName}</span>
          </div>`;
      } else if (isFiltered && !local.logo_url) {
        // Filtered mode without logo: colored icon + name label
        const shortName = local.nome.length > 18 ? local.nome.substring(0, 16) + "…" : local.nome;
        markerHtml = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
            <div style="width:40px;height:40px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPaths}</svg>
            </div>
            <span style="font-family:'Inter',sans-serif;font-size:10px;font-weight:600;color:#1a1a1a;background:rgba(255,255,255,.92);padding:1px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.12);max-width:120px;text-overflow:ellipsis;overflow:hidden;">${shortName}</span>
          </div>`;
      } else {
        // "Todos" mode: generic category icon, no label
        markerHtml = `
          <div style="width:36px;height:36px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPaths}</svg>
          </div>`;
      }

      const iconSize: [number, number] = isFiltered ? [44, 56] : [36, 36];
      const iconAnchor: [number, number] = isFiltered ? [22, 28] : [18, 18];

      const icon = L.divIcon({
        html: markerHtml,
        className: "custom-map-marker",
        iconSize,
        iconAnchor,
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
  }, [withCoords, selectedCategoria]);

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
                          <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full overflow-hidden shadow-sm">
                            <img src={local.logo_url} alt="" className="w-full h-full object-cover" />
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
