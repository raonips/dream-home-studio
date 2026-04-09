import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'property-images';

/**
 * Extracts the storage path from a full Supabase public URL.
 * Returns null if the URL doesn't belong to our bucket.
 */
export function extractStoragePath(publicUrl: string): string | null {
  if (!publicUrl) return null;
  try {
    const marker = `/object/public/${BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(publicUrl.substring(idx + marker.length));
  } catch {
    return null;
  }
}

/**
 * Removes one or more files from Storage given their public URLs.
 * Silently ignores invalid URLs or already-deleted files.
 */
export async function removeStorageFiles(publicUrls: string[]): Promise<void> {
  const paths = publicUrls
    .map(extractStoragePath)
    .filter((p): p is string => p !== null);

  if (paths.length === 0) return;

  // Storage remove accepts max 100 paths at a time
  const chunks: string[][] = [];
  for (let i = 0; i < paths.length; i += 100) {
    chunks.push(paths.slice(i, i + 100));
  }

  await Promise.all(
    chunks.map((chunk) =>
      supabase.storage.from(BUCKET).remove(chunk).then(({ error }) => {
        if (error) console.warn('[StorageCleanup] remove error:', error.message);
      })
    )
  );
}

/**
 * Collects all image URLs from a property row for cleanup.
 */
export function collectPropertyImageUrls(property: {
  image_url?: string;
  featured_image?: string;
  thumbnail_url?: string;
  images?: string[] | null;
}): string[] {
  const urls: string[] = [];
  if (property.image_url) urls.push(property.image_url);
  if (property.featured_image) urls.push(property.featured_image);
  if (property.thumbnail_url) urls.push(property.thumbnail_url);
  if (property.images) urls.push(...property.images);
  return urls;
}

/**
 * Collects all image URLs from a condominio row for cleanup.
 */
export function collectCondominioImageUrls(condo: {
  hero_image?: string;
  featured_image?: string;
  thumbnail_url?: string;
  images?: string[] | null;
}): string[] {
  const urls: string[] = [];
  if (condo.hero_image) urls.push(condo.hero_image);
  if (condo.featured_image) urls.push(condo.featured_image);
  if (condo.thumbnail_url) urls.push(condo.thumbnail_url);
  if (condo.images) urls.push(...condo.images);
  return urls;
}
