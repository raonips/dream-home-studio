/**
 * Image helper – returns the original Supabase public URL without
 * any render/transform parameters (free-tier safe).
 */
export function optimizeImage(
  url: string | undefined | null,
  _options?: { width?: number; quality?: number }
): string {
  return url || '/placeholder.svg';
}

export const cardImage = (url: string | undefined | null) => optimizeImage(url);
export const detailImage = (url: string | undefined | null) => optimizeImage(url);
export const heroImage = (url: string | undefined | null) => optimizeImage(url);
