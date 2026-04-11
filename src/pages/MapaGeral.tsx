import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { normalizeText, fuzzyMatch, expandQuery, parseSearchIntent } from "@/lib/utils";
import {
  Search, MapPin, Loader2, X, Filter,
  Store, UtensilsCrossed, Hotel, Home, Pill,
  Flame, SprayCan, Heart, Building2, KeyRound, DollarSign
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SafeImage from "@/components/SafeImage";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ────────── Types ────────── */

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

interface MapProperty {
  id: string;
  title: string | null;
  slug: string | null;
  transaction_type: string | null;
  featured_image: string | null;
  thumbnail_url: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  price_formatted: string | null;
  condominio_slug: string | null;
  location: string | null;
}

/* ────────── Constants ────────── */

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

const DEFAULT_CENTER: [number, number] = [-12.695, -38.14];
const DEFAULT_ZOOM = 13;

const CATEGORIA_GROUP_MAP: Record<string, string[]> = {
  gastronomia: ["restaurante", "padaria", "gastronomia"],
  hospedagem: ["hospedagem"],
  utilidade: ["utilidade", "gas", "limpeza", "farmacia", "saude", "mercado"],
  condominio: ["condominio"],
};

/* ────────── Component ────────── */

const MapaGeral = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCategoria = searchParams.get("categoria");
  const condominioFilter = searchParams.get("condominio");
  const localFilter = searchParams.get("local");

  const [allLocais, setAllLocais] = useState<MapLocal[]>([]);
  const [allProperties, setAllProperties] = useState<MapProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(initialCategoria);
  const [showVenda, setShowVenda] = useState(false);
  const [showTemporada, setShowTemporada] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [condoPropertyFilter, setCondoPropertyFilter] = useState<{ slug: string; type: "venda" | "temporada" } | null>(null);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  // Track whether user has interacted with the map (pan/zoom)
  const userInteractedRef = useRef(false);
  // Track whether this is the initial load (auto-fit only once)
  const initialFitDoneRef = useRef(false);
  // Track whether we should force fit (e.g. text search)
  const forceFitRef = useRef(false);
  // Track whether there are off-screen results to show the "Centralizar" button
  const [hasOffScreenResults, setHasOffScreenResults] = useState(false);

  const singleSlugFilter = condominioFilter || localFilter;
  const hasUrlFilter = !!singleSlugFilter || !!initialCategoria;

  /* ── Fetch data ── */
  const [condominioNames, setCondominioNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAll = async () => {
      const [locaisRes, propertiesRes, condominiosRes] = await Promise.all([
        supabase.from("locais").select("id,nome,slug,descricao,categoria,imagem_destaque,logo_url,endereco,latitude,longitude").eq("ativo", true),
        supabase.from("properties").select("id,title,slug,transaction_type,featured_image,thumbnail_url,latitude,longitude,bedrooms,bathrooms,price,price_formatted,condominio_slug,location").eq("status", "active"),
        supabase.from("condominios").select("slug,name"),
      ]);

      const locais: MapLocal[] = (locaisRes.data || []).map((l: any) => ({
        id: l.id, nome: l.nome, slug: l.slug, descricao: l.descricao,
        categoria: l.categoria, imagem_destaque: l.imagem_destaque,
        logo_url: l.logo_url, endereco: l.endereco,
        latitude: l.latitude, longitude: l.longitude, tipo: "local" as const,
      }));

      // Build slug→name map from condominios table (used for property search matching)
      const condoMap: Record<string, string> = {};
      (condominiosRes.data || []).forEach((c: any) => {
        if (c.slug && c.name) condoMap[c.slug] = c.name;
      });
      setCondominioNames(condoMap);

      setAllLocais(locais);
      setAllProperties(propertiesRes.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  /* ── Intent detection from search ── */
  const searchIntent = useMemo(() => parseSearchIntent(search), [search]);

  /* ── Smart search: auto-enable property filters when searching property-like terms ── */
  const isPropertySearch = useMemo(() => {
    if (!search.trim()) return false;
    // If intent detected, it's a property search
    if (searchIntent.transactionType) return true;
    const s = normalizeText(search);
    const propertyTerms = ["casa", "terreno", "apartamento", "apto", "quarto", "quartos", "suite", "suit", "imovel", "imov"];
    return propertyTerms.some(t => s.includes(t));
  }, [search, searchIntent]);

  /* ── Detect if search matches a condomínio name (using cleaned query without intent keywords) ── */
  const searchMatchedCondoSlugs = useMemo(() => {
    const term = searchIntent.cleanQuery || search;
    if (!term.trim()) return new Set<string>();
    const slugs = new Set<string>();
    allLocais.forEach(l => {
      if (l.categoria === "condominio" && fuzzyMatch(l.nome, term).match && l.slug) {
        slugs.add(l.slug);
      }
    });
    Object.entries(condominioNames).forEach(([slug, name]) => {
      if (fuzzyMatch(name, term).match) {
        slugs.add(slug);
      }
    });
    return slugs;
  }, [allLocais, search, searchIntent, condominioNames]);

  const isCondoSearch = searchMatchedCondoSlugs.size > 0;

  /* ── Guia categories (excluding property types) ── */
  const categorias = useMemo(() => {
    const cats = new Set(allLocais.map(l => l.categoria));
    return Array.from(cats).sort();
  }, [allLocais]);

  /* ── Filtered Guia items ── */
  const filteredLocais = useMemo(() => {
    let items = allLocais;

    // If condoPropertyFilter is active, hide guia items
    if (condoPropertyFilter) return [];

    // If smart search activated properties, hide guia
    if (isPropertySearch) return [];

    if (localFilter) {
      items = items.filter(l => l.slug === localFilter);
    } else if (condominioFilter) {
      items = items.filter(l => l.slug === condominioFilter);
    } else if (selectedCategoria) {
      const groupCats = CATEGORIA_GROUP_MAP[selectedCategoria];
      if (groupCats) {
        items = items.filter(l => groupCats.includes(l.categoria));
      } else {
        items = items.filter(l => l.categoria === selectedCategoria);
      }
    }

    if (search.trim() && !isPropertySearch) {
      items = items.filter(l => fuzzyMatch(l.nome, search).match || (l.endereco && fuzzyMatch(l.endereco, search).match));
    }
    return items;
  }, [allLocais, selectedCategoria, search, condominioFilter, localFilter, isPropertySearch, condoPropertyFilter]);

  /* ── Collect condominio slugs from Guia to eliminate duplicates ── */
  const guiaCondoSlugs = useMemo(() => {
    const slugs = new Set<string>();
    allLocais.forEach(l => {
      if (l.tipo === "condominio" && l.slug) slugs.add(l.slug);
    });
    // Also add locais with categoria "condominio"
    allLocais.forEach(l => {
      if (l.categoria === "condominio" && l.slug) slugs.add(l.slug);
    });
    return slugs;
  }, [allLocais]);

  /* ── Filtered Properties (with bounds filtering & no condo duplicates) ── */
  const filteredProperties = useMemo(() => {
    // Helper: filter out properties whose condominio_slug matches a Guia condomínio
    // This prevents duplicate condo markers from the properties table
    const removeDuplicateCondos = (props: MapProperty[]) =>
      props.filter(p => !p.condominio_slug || !guiaCondoSlugs.has(p.condominio_slug) || p.transaction_type);

    // Helper: filter by visible map bounds
    const filterByBounds = (props: MapProperty[]) => {
      if (!mapBounds) return props;
      return props.filter(p =>
        p.latitude && p.longitude &&
        mapBounds.contains([p.latitude, p.longitude])
      );
    };

    // Condo popup → show properties of that condo with matching type (no bounds filter here)
    if (condoPropertyFilter) {
      const txType = condoPropertyFilter.type === "venda" ? "venda" : "temporada";
      return allProperties.filter(p =>
        p.condominio_slug === condoPropertyFilter.slug &&
        p.transaction_type === txType &&
        p.latitude && p.longitude
      );
    }

    // Search matches a condomínio → show its properties (filtered by intent if present)
    if (isCondoSearch) {
      let condoProps = allProperties.filter(p =>
        p.condominio_slug && searchMatchedCondoSlugs.has(p.condominio_slug) &&
        p.latitude && p.longitude
      );
      // Filter by intent transaction type
      if (searchIntent.transactionType) {
        condoProps = condoProps.filter(p => p.transaction_type === searchIntent.transactionType);
      }
      // Also include manually toggled properties
      let manualProps: MapProperty[] = [];
      if (showVenda) {
        manualProps = [...manualProps, ...allProperties.filter(p => p.transaction_type === "venda" && p.latitude && p.longitude && !condoProps.some(cp => cp.id === p.id))];
      }
      if (showTemporada) {
        manualProps = [...manualProps, ...allProperties.filter(p => p.transaction_type === "temporada" && p.latitude && p.longitude && !condoProps.some(cp => cp.id === p.id))];
      }
      return [...condoProps, ...filterByBounds(manualProps)];
    }

    // Smart search → show matching properties (filtered by intent)
    if (isPropertySearch) {
      const searchTerm = searchIntent.cleanQuery || search;
      let props = allProperties.filter(p =>
        p.latitude && p.longitude &&
        (fuzzyMatch(p.title || "", searchTerm).match ||
         fuzzyMatch(p.location || "", searchTerm).match)
      );
      if (searchIntent.transactionType) {
        props = props.filter(p => p.transaction_type === searchIntent.transactionType);
      }
      return props;
    }

    // Manual toggles — filter by current visible bounds
    let props: MapProperty[] = [];
    if (showVenda) {
      props = [...props, ...allProperties.filter(p => p.transaction_type === "venda" && p.latitude && p.longitude)];
    }
    if (showTemporada) {
      props = [...props, ...allProperties.filter(p => p.transaction_type === "temporada" && p.latitude && p.longitude)];
    }

    // Apply bounds filter for manual toggles
    props = filterByBounds(props);

    // Text filter on properties
    if (search.trim() && props.length > 0) {
      props = props.filter(p => fuzzyMatch(p.title || "", search).match || fuzzyMatch(p.location || "", search).match);
    }

    return props;
  }, [allProperties, showVenda, showTemporada, search, isPropertySearch, isCondoSearch, searchMatchedCondoSlugs, condoPropertyFilter, mapBounds, guiaCondoSlugs]);

  /* ── Combined items for sidebar list ── */
  const allFiltered = useMemo(() => {
    const locaisItems = filteredLocais.map(l => ({ ...l, itemType: "local" as const }));
    const propItems = filteredProperties.map(p => ({
      id: p.id,
      nome: p.title || "Imóvel",
      slug: p.slug || "",
      descricao: p.location,
      categoria: p.transaction_type === "venda" ? "__venda" : "__temporada",
      imagem_destaque: p.featured_image || p.thumbnail_url,
      logo_url: null,
      endereco: p.location,
      latitude: p.latitude,
      longitude: p.longitude,
      tipo: "local" as const,
      itemType: "property" as const,
    }));
    return [...locaisItems, ...propItems];
  }, [filteredLocais, filteredProperties]);

  /* ── Coords for bounds ── */
  const withCoords = useMemo(() => allFiltered.filter(l => l.latitude && l.longitude), [allFiltered]);

  /* ── Count properties by type for badges ── */
  const vendaCount = useMemo(() => allProperties.filter(p => p.transaction_type === "venda").length, [allProperties]);
  const temporadaCount = useMemo(() => allProperties.filter(p => p.transaction_type === "temporada").length, [allProperties]);

  /* ── Count properties per condo for popups ── */
  const condoPropertyCounts = useMemo(() => {
    const counts: Record<string, { venda: number; temporada: number }> = {};
    allProperties.forEach(p => {
      if (!p.condominio_slug) return;
      if (!counts[p.condominio_slug]) counts[p.condominio_slug] = { venda: 0, temporada: 0 };
      if (p.transaction_type === "venda") counts[p.condominio_slug].venda++;
      else if (p.transaction_type === "temporada") counts[p.condominio_slug].temporada++;
    });
    return counts;
  }, [allProperties]);

  /* ── Init map ── */
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

    // Track map bounds for property visibility filtering
    const updateBounds = () => setMapBounds(map.getBounds());
    map.on("moveend", updateBounds);
    map.on("zoomend", updateBounds);
    // Track user interaction (pan/zoom) to block auto-fit
    map.on("dragstart", () => { userInteractedRef.current = true; });
    map.on("zoomstart", () => { userInteractedRef.current = true; });
    // Set initial bounds
    updateBounds();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  /* ── Handle condo popup button clicks via event delegation ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest("[data-condo-filter]") as HTMLElement | null;
      if (!btn) return;
      const slug = btn.dataset.condoFilter!;
      const type = btn.dataset.condoType as "venda" | "temporada";
      setCondoPropertyFilter({ slug, type });
      setShowVenda(false);
      setShowTemporada(false);
      setSelectedCategoria(null);
      mapInstanceRef.current?.closePopup();
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  /* ── Active filter label ── */
  const activeFilterLabel = useMemo(() => {
    if (condoPropertyFilter) {
      const condo = allLocais.find(l => l.slug === condoPropertyFilter.slug);
      const typeLabel = condoPropertyFilter.type === "venda" ? "À Venda" : "Temporada";
      return `Imóveis ${typeLabel} em ${condo?.nome || condoPropertyFilter.slug}`;
    }
    if (singleSlugFilter) {
      const match = allFiltered.find(l => l.slug === singleSlugFilter);
      return match?.nome || singleSlugFilter;
    }
    if (initialCategoria) {
      return CATEGORIA_LABELS[initialCategoria] || initialCategoria;
    }
    return null;
  }, [singleSlugFilter, initialCategoria, allFiltered, condoPropertyFilter, allLocais]);

  const clearUrlFilters = () => {
    setSearchParams({});
    setSelectedCategoria(null);
    setCondoPropertyFilter(null);
  };

  /* ── Update markers ── */
  useEffect(() => {
    if (!markersRef.current || !mapInstanceRef.current) return;
    markersRef.current.clearLayers();

    const isFiltered = !!selectedCategoria || !!singleSlugFilter || !!condoPropertyFilter;
    const isSingleFocus = !!singleSlugFilter;

    // Add Guia markers
    filteredLocais.filter(l => l.latitude && l.longitude).forEach((local) => {
      const color = CATEGORIA_COLORS[local.categoria] || "#6b7280";
      const svgPaths = CATEGORIA_SVG_PATHS[local.categoria] || '<circle cx="12" cy="12" r="3"/>';

      let markerHtml: string;

      if ((isFiltered || isSingleFocus) && local.logo_url) {
        const shortName = local.nome.length > 18 ? local.nome.substring(0, 16) + "…" : local.nome;
        const size = isSingleFocus ? 56 : 44;
        markerHtml = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
            <div style="width:${size}px;height:${size}px;border-radius:50%;background:white;box-shadow:0 2px 8px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;overflow:hidden;">
              <img src="${local.logo_url}" style="width:${size}px;height:${size}px;object-fit:cover;" />
            </div>
            <span style="font-family:'Inter',sans-serif;font-size:${isSingleFocus ? '12' : '10'}px;font-weight:600;color:#1a1a1a;background:rgba(255,255,255,.92);padding:1px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.12);max-width:150px;text-overflow:ellipsis;overflow:hidden;">${shortName}</span>
          </div>`;
      } else if ((isFiltered || isSingleFocus) && !local.logo_url) {
        const shortName = local.nome.length > 18 ? local.nome.substring(0, 16) + "…" : local.nome;
        const size = isSingleFocus ? 48 : 40;
        markerHtml = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
            <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPaths}</svg>
            </div>
            <span style="font-family:'Inter',sans-serif;font-size:${isSingleFocus ? '12' : '10'}px;font-weight:600;color:#1a1a1a;background:rgba(255,255,255,.92);padding:1px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.12);max-width:150px;text-overflow:ellipsis;overflow:hidden;">${shortName}</span>
          </div>`;
      } else {
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

      // Condo popup with property buttons
      const counts = local.tipo === "condominio" && local.slug ? condoPropertyCounts[local.slug] : null;
      const condoButtons = counts && (counts.venda > 0 || counts.temporada > 0) ? `
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">
          <p style="font-size:11px;color:#666;margin-bottom:6px;font-weight:600;">Imóveis disponíveis neste condomínio:</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${counts.venda > 0 ? `<button data-condo-filter="${local.slug}" data-condo-type="venda" style="background:#2563eb;color:white;border:none;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-weight:500;">🏠 Ver ${counts.venda} à Venda</button>` : ""}
            ${counts.temporada > 0 ? `<button data-condo-filter="${local.slug}" data-condo-type="temporada" style="background:#7c3aed;color:white;border:none;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-weight:500;">🔑 Ver ${counts.temporada} Temporada</button>` : ""}
          </div>
        </div>
      ` : "";

      marker.bindPopup(`
        <div style="min-width:180px;font-family:'Inter',sans-serif;">
          ${local.imagem_destaque ? `<img src="${local.imagem_destaque}" style="width:100%;height:100px;object-fit:cover;border-radius:8px 8px 0 0;margin-bottom:8px;" />` : ""}
          <div style="padding:0 4px 4px;">
            <strong style="font-size:14px;font-family:'Montserrat',sans-serif;">${local.nome}</strong>
            <p style="font-size:12px;color:#666;margin:4px 0;">${CATEGORIA_LABELS[local.categoria] || local.categoria}</p>
            <a href="${linkPath}" style="color:#2563eb;font-size:12px;text-decoration:none;">Ver detalhes →</a>
            ${condoButtons}
          </div>
        </div>
      `);
    });

    // Add Property markers (secondary, smaller z-index via pane order)
    filteredProperties.forEach((prop) => {
      if (!prop.latitude || !prop.longitude) return;
      const isVenda = prop.transaction_type === "venda";
      const color = isVenda ? "#2563eb" : "#7c3aed";
      const emoji = isVenda ? "🏠" : "🔑";
      const shortTitle = (prop.title || "Imóvel").length > 16
        ? (prop.title || "Imóvel").substring(0, 14) + "…"
        : (prop.title || "Imóvel");

      const markerHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <div style="width:32px;height:32px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;font-size:14px;opacity:0.85;">
            ${emoji}
          </div>
          <span style="font-family:'Inter',sans-serif;font-size:9px;font-weight:600;color:#1a1a1a;background:rgba(255,255,255,.85);padding:1px 5px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.12);max-width:130px;text-overflow:ellipsis;overflow:hidden;">${shortTitle}</span>
        </div>`;

      const icon = L.divIcon({
        html: markerHtml,
        className: "custom-map-marker",
        iconSize: [32, 44],
        iconAnchor: [16, 22],
      });

      const marker = L.marker([prop.latitude, prop.longitude], { icon, zIndexOffset: -100 }).addTo(markersRef.current!);

      const priceText = prop.price_formatted || (prop.price ? `R$ ${prop.price.toLocaleString("pt-BR")}` : "");

      marker.bindPopup(`
        <div style="min-width:180px;font-family:'Inter',sans-serif;">
          ${prop.featured_image || prop.thumbnail_url ? `<img src="${prop.featured_image || prop.thumbnail_url}" style="width:100%;height:100px;object-fit:cover;border-radius:8px 8px 0 0;margin-bottom:8px;" />` : ""}
          <div style="padding:0 4px 4px;">
            <strong style="font-size:14px;font-family:'Montserrat',sans-serif;">${prop.title || "Imóvel"}</strong>
            ${priceText ? `<p style="font-size:13px;color:${color};font-weight:600;margin:4px 0;">${priceText}</p>` : ""}
            ${prop.location ? `<p style="font-size:12px;color:#666;margin:2px 0;">${prop.location}</p>` : ""}
            <a href="/imoveis/${prop.slug}" style="color:#2563eb;font-size:12px;text-decoration:none;">Ver detalhes →</a>
          </div>
        </div>
      `);
    });

    // Fit bounds logic:
    // Auto-fit ONLY on: initial load (once), single slug focus, condo property filter, or forced (text search)
    // NEVER auto-fit when user has interacted and is just switching categories

    const allCoordsItems = [
      ...filteredLocais.filter(l => l.latitude && l.longitude).map(l => [l.latitude!, l.longitude!] as [number, number]),
      ...filteredProperties.filter(p => p.latitude && p.longitude).map(p => [p.latitude!, p.longitude!] as [number, number]),
    ];

    const isInitialLoad = !initialFitDoneRef.current && allCoordsItems.length > 0;
    const isSingleFocusNav = !!singleSlugFilter || !!condoPropertyFilter;
    const isForced = forceFitRef.current;

    if (isInitialLoad || isSingleFocusNav || isForced) {
      if (isForced) forceFitRef.current = false;
      initialFitDoneRef.current = true;
      // Temporarily disable user interaction tracking during programmatic zoom
      userInteractedRef.current = false;

      if (allCoordsItems.length === 1 && isSingleFocusNav) {
        mapInstanceRef.current.setView(allCoordsItems[0], 17);
      } else if (allCoordsItems.length > 0) {
        const bounds = L.latLngBounds(allCoordsItems);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    } else if (isInitialLoad) {
      initialFitDoneRef.current = true;
    }

    // Check if there are off-screen results for the "Centralizar" button
    if (mapInstanceRef.current && allCoordsItems.length > 0 && !isSingleFocusNav) {
      const currentBounds = mapInstanceRef.current.getBounds();
      const someOffScreen = allCoordsItems.some(c => !currentBounds.contains(c as L.LatLngExpression));
      setHasOffScreenResults(someOffScreen);
    } else {
      setHasOffScreenResults(false);
    }
  }, [filteredLocais, filteredProperties, selectedCategoria, condominioFilter, localFilter, singleSlugFilter, condoPropertyFilter, condoPropertyCounts, isPropertySearch]);

  /* ── Sidebar item count ── */
  const totalCount = allFiltered.length;

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
              placeholder="Buscar local ou imóvel..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (e.target.value.trim()) forceFitRef.current = true; }}
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
              variant={!selectedCategoria && !showVenda && !showTemporada ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => { setSelectedCategoria(null); setShowVenda(false); setShowTemporada(false); setCondoPropertyFilter(null); }}
            >
              Guia ({allLocais.length})
            </Badge>

            {/* Category filters */}
            {categorias.map((cat) => {
              const Icon = CATEGORIA_ICONS[cat] || MapPin;
              const count = allLocais.filter(l => l.categoria === cat).length;
              return (
                <Badge
                  key={cat}
                  variant={selectedCategoria === cat ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors gap-1"
                  onClick={() => { setSelectedCategoria(selectedCategoria === cat ? null : cat); setCondoPropertyFilter(null); }}
                >
                  <Icon className="h-3 w-3" />
                  {CATEGORIA_LABELS[cat] || cat} ({count})
                </Badge>
              );
            })}

            {/* Separator */}
            <div className="w-px h-5 bg-border mx-1" />

            {/* Property toggles */}
            <Badge
              variant={showVenda ? "default" : "outline"}
              className={`cursor-pointer gap-1 transition-colors ${showVenda ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50 border-blue-300 text-blue-700"}`}
              onClick={() => { setShowVenda(!showVenda); setCondoPropertyFilter(null); }}
            >
              <DollarSign className="h-3 w-3" />
              🏠 À Venda ({vendaCount})
            </Badge>
            <Badge
              variant={showTemporada ? "default" : "outline"}
              className={`cursor-pointer gap-1 transition-colors ${showTemporada ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-purple-50 border-purple-300 text-purple-700"}`}
              onClick={() => { setShowTemporada(!showTemporada); setCondoPropertyFilter(null); }}
            >
              <KeyRound className="h-3 w-3" />
              🔑 Temporada ({temporadaCount})
            </Badge>
          </div>
        </div>

        {/* Active URL filter / condo property filter banner */}
        {(hasUrlFilter || condoPropertyFilter || isPropertySearch) && activeFilterLabel && (
          <div className="border-b border-border bg-primary/5 px-4 py-2 flex items-center justify-between shrink-0">
            <p className="text-sm text-foreground flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              <span>
                Exibindo apenas <strong>{activeFilterLabel}</strong>
              </span>
            </p>
            <Button variant="ghost" size="sm" onClick={clearUrlFilters} className="text-xs gap-1">
              <X className="h-3.5 w-3.5" />
              Ver todos os locais
            </Button>
          </div>
        )}

        {isPropertySearch && !condoPropertyFilter && !hasUrlFilter && (
          <div className="border-b border-border bg-blue-50 dark:bg-blue-950/30 px-4 py-2 flex items-center justify-between shrink-0">
            <p className="text-sm text-foreground flex items-center gap-1.5">
              <Search className="h-4 w-4 text-blue-600" />
              <span>Buscando imóveis: <strong>{search}</strong> ({filteredProperties.length} resultados)</span>
            </p>
            <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="text-xs gap-1">
              <X className="h-3.5 w-3.5" />
              Limpar busca
            </Button>
          </div>
        )}

        {/* Mobile filters */}
        {showFilters && (
          <div className="md:hidden border-b border-border bg-card px-4 py-3 flex flex-wrap gap-2">
            <Badge
              variant={!selectedCategoria && !showVenda && !showTemporada ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => { setSelectedCategoria(null); setShowVenda(false); setShowTemporada(false); setCondoPropertyFilter(null); setShowFilters(false); }}
            >
              Guia
            </Badge>
            {categorias.map((cat) => {
              const Icon = CATEGORIA_ICONS[cat] || MapPin;
              return (
                <Badge
                  key={cat}
                  variant={selectedCategoria === cat ? "default" : "outline"}
                  className="cursor-pointer gap-1"
                  onClick={() => { setSelectedCategoria(selectedCategoria === cat ? null : cat); setCondoPropertyFilter(null); setShowFilters(false); }}
                >
                  <Icon className="h-3 w-3" />
                  {CATEGORIA_LABELS[cat] || cat}
                </Badge>
              );
            })}
            <div className="w-full border-t border-border my-1" />
            <Badge
              variant={showVenda ? "default" : "outline"}
              className={`cursor-pointer gap-1 ${showVenda ? "bg-blue-600" : "border-blue-300 text-blue-700"}`}
              onClick={() => { setShowVenda(!showVenda); setCondoPropertyFilter(null); setShowFilters(false); }}
            >
              🏠 À Venda ({vendaCount})
            </Badge>
            <Badge
              variant={showTemporada ? "default" : "outline"}
              className={`cursor-pointer gap-1 ${showTemporada ? "bg-purple-600" : "border-purple-300 text-purple-700"}`}
              onClick={() => { setShowTemporada(!showTemporada); setCondoPropertyFilter(null); setShowFilters(false); }}
            >
              🔑 Temporada ({temporadaCount})
            </Badge>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Card list */}
          <div className="w-full md:w-[380px] lg:w-[420px] overflow-y-auto border-r border-border bg-background shrink-0">
            <div className="p-4 border-b border-border">
              <p className="text-sm text-muted-foreground font-medium">
                {totalCount} {totalCount === 1 ? "local encontrado" : "locais encontrados"}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : totalCount === 0 ? (
              <div className="text-center py-16 px-4">
                <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum local encontrado.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {allFiltered.map((item) => {
                  const isProperty = item.categoria === "__venda" || item.categoria === "__temporada";
                  const linkPath = isProperty
                    ? `/imoveis/${item.slug}`
                    : item.tipo === "condominio"
                      ? `/imoveis/condominio/${item.slug}`
                      : `/locais/${item.slug}`;
                  const Icon = isProperty
                    ? (item.categoria === "__venda" ? DollarSign : KeyRound)
                    : (CATEGORIA_ICONS[item.categoria] || MapPin);
                  const color = isProperty
                    ? (item.categoria === "__venda" ? "#2563eb" : "#7c3aed")
                    : (CATEGORIA_COLORS[item.categoria] || "#6b7280");
                  const catLabel = isProperty
                    ? (item.categoria === "__venda" ? "À Venda" : "Temporada")
                    : (CATEGORIA_LABELS[item.categoria] || item.categoria);

                  return (
                    <Link
                      key={item.id}
                      to={linkPath}
                      className={`flex gap-3 p-4 hover:bg-muted/50 transition-colors ${hoveredId === item.id ? "bg-muted/50" : ""}`}
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative">
                        <SafeImage
                          src={item.imagem_destaque || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=60"}
                          alt={item.nome}
                          className="w-full h-full object-cover"
                        />
                        {item.logo_url && (
                          <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full overflow-hidden shadow-sm">
                            <img src={item.logo_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground line-clamp-1 font-display">{item.nome}</h3>
                        {item.endereco && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {item.endereco}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-2">
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium"
                            style={{ backgroundColor: color }}
                          >
                            <Icon className="h-3 w-3" />
                            {catLabel}
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
            {hasOffScreenResults && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] shadow-lg gap-1.5"
                onClick={() => {
                  const allCoordsItems = [
                    ...filteredLocais.filter(l => l.latitude && l.longitude).map(l => [l.latitude!, l.longitude!] as [number, number]),
                    ...filteredProperties.filter(p => p.latitude && p.longitude).map(p => [p.latitude!, p.longitude!] as [number, number]),
                  ];
                  if (allCoordsItems.length > 0 && mapInstanceRef.current) {
                    userInteractedRef.current = false;
                    const bounds = L.latLngBounds(allCoordsItems);
                    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
                    setHasOffScreenResults(false);
                  }
                }}
              >
                🔍 Ver todos os resultados no mapa
              </Button>
            )}
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
