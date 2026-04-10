import { supabase } from '@/integrations/supabase/client';

/**
 * Extracts the bucket name and storage path from a full Supabase public URL.
 */
export function extractStorageInfo(publicUrl: string): { bucket: string; path: string } | null {
  if (!publicUrl) return null;
  try {
    const marker = '/object/public/';
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    const rest = decodeURIComponent(publicUrl.substring(idx + marker.length));
    const slashIdx = rest.indexOf('/');
    if (slashIdx === -1) return null;
    return { bucket: rest.substring(0, slashIdx), path: rest.substring(slashIdx + 1) };
  } catch {
    return null;
  }
}

/**
 * Legacy helper — extracts path assuming default bucket.
 */
export function extractStoragePath(publicUrl: string): string | null {
  const info = extractStorageInfo(publicUrl);
  return info?.path ?? null;
}

/**
 * Removes one or more files from Storage given their public URLs.
 * Automatically detects the correct bucket from each URL.
 */
export async function removeStorageFiles(publicUrls: string[]): Promise<void> {
  const byBucket = new Map<string, string[]>();
  for (const url of publicUrls) {
    const info = extractStorageInfo(url);
    if (!info) continue;
    const list = byBucket.get(info.bucket) || [];
    list.push(info.path);
    byBucket.set(info.bucket, list);
  }

  const tasks: Promise<void>[] = [];
  for (const [bucket, paths] of byBucket) {
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100);
      tasks.push(
        supabase.storage.from(bucket).remove(chunk).then(({ error }) => {
          if (error) console.warn('[StorageCleanup] remove error:', bucket, error.message);
        })
      );
    }
  }

  await Promise.all(tasks);
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
