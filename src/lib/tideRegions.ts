// Supported tide regions (Litoral Norte da Bahia).
// Adding a region: append here, no other client changes needed.
export interface TideRegion {
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

export const TIDE_REGIONS: TideRegion[] = [
  { slug: "barra-do-jacuipe", name: "Barra do Jacuípe", lat: -12.694, lng: -38.087 },
  { slug: "guarajuba", name: "Guarajuba", lat: -12.651, lng: -38.064 },
  { slug: "arembepe", name: "Arembepe", lat: -12.756, lng: -38.169 },
  { slug: "itacimirim", name: "Itacimirim", lat: -12.618, lng: -38.046 },
  { slug: "praia-do-forte", name: "Praia do Forte", lat: -12.578, lng: -38.001 },
  { slug: "imbassai", name: "Imbassaí", lat: -12.493, lng: -37.954 },
];

export const DEFAULT_TIDE_REGION_SLUG = "barra-do-jacuipe";

export function getTideRegion(slug?: string | null): TideRegion {
  if (!slug) return TIDE_REGIONS[0];
  return TIDE_REGIONS.find((r) => r.slug === slug) ?? TIDE_REGIONS[0];
}

export function isValidTideRegion(slug?: string | null): boolean {
  if (!slug) return false;
  return TIDE_REGIONS.some((r) => r.slug === slug);
}
