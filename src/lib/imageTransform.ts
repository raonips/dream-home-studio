/**
 * Image helpers — convert Supabase Storage public URLs to the on-the-fly
 * render endpoint with width/quality params for smaller payloads.
 *
 * Falls back to the original URL when not a Supabase Storage public URL.
 */

const STORAGE_PUBLIC = "/storage/v1/object/public/";
const STORAGE_RENDER = "/storage/v1/render/image/public/";

function transform(
  url: string | undefined | null,
  width: number,
  quality = 70
): string {
  if (!url) return "/placeholder.svg";
  // Only Supabase Storage public URLs are transformable
  if (!url.includes(STORAGE_PUBLIC)) return url;
  try {
    const rendered = url.replace(STORAGE_PUBLIC, STORAGE_RENDER);
    const sep = rendered.includes("?") ? "&" : "?";
    return `${rendered}${sep}width=${width}&quality=${quality}&resize=cover`;
  } catch {
    return url;
  }
}

export function optimizeImage(
  url: string | undefined | null,
  options?: { width?: number; quality?: number }
): string {
  return transform(url, options?.width ?? 1200, options?.quality ?? 75);
}

/** Card thumbnails — small, mobile-first */
export const cardImage = (url: string | undefined | null) => transform(url, 600, 70);

/** Detail / gallery — larger */
export const detailImage = (url: string | undefined | null) => transform(url, 1400, 78);

/** Hero images — full-bleed */
export const heroImage = (url: string | undefined | null) => transform(url, 1920, 75);
