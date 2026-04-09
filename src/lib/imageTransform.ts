/**
 * Image helper – returns the original Supabase public URL without
 * any render/transform parameters (avoids breakage on free-tier).
 */
export function optimizeImage(
  url: string | undefined | null,
  _options?: { width?: number; quality?: number }
): string {
  return url || '/placeholder.svg';
}

/** Card thumbnails – passthrough */
export const cardImage = (url: string | undefined | null) => optimizeImage(url);

/** Detail / gallery – passthrough */
export const detailImage = (url: string | undefined | null) => optimizeImage(url);

/** Hero images – passthrough */
export const heroImage = (url: string | undefined | null) => optimizeImage(url);
