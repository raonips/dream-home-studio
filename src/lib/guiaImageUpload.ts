import imageCompression from 'browser-image-compression';
import { createSafeStoragePath, uploadToStorageWithProgress } from '@/lib/storageUpload';
import { removeStorageFiles } from '@/lib/storageCleanup';
import { supabase } from '@/integrations/supabase/client';

/**
 * Standardized image processing for all Guia Local modules.
 * Converts to WebP, compresses at 80% quality, max 1400px width,
 * cleans filenames for SEO, and auto-deletes old files.
 */
export async function processAndUploadGuiaImage(opts: {
  file: File;
  bucket: string;
  folder: string;
  oldUrl?: string;
  onProgress?: (pct: number) => void;
}): Promise<string> {
  const { file, bucket, folder, oldUrl, onProgress } = opts;

  onProgress?.(5);

  // 1. Compress & convert to WebP (80% quality, max 1400px)
  let processedFile: File;
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1400,
      fileType: 'image/webp',
      useWebWorker: true,
      initialQuality: 0.8,
    });
    processedFile = new File(
      [compressed],
      file.name.replace(/\.[^.]+$/, '.webp'),
      { type: 'image/webp' }
    );
  } catch {
    // Fallback: upload original if compression fails
    processedFile = file;
  }

  onProgress?.(40);

  // 2. Upload to Storage with clean path
  const path = createSafeStoragePath({ folder, file: processedFile });

  await uploadToStorageWithProgress({
    bucket,
    path,
    file: processedFile,
    upsert: false,
    onProgress: (pct) => onProgress?.(40 + pct * 0.5),
  });

  onProgress?.(95);

  // 3. Get public URL
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

  // 4. Auto-delete old file (fire-and-forget)
  if (oldUrl) {
    removeStorageFiles([oldUrl]).catch(() => {});
  }

  onProgress?.(100);
  return publicUrl;
}

/**
 * Generates and uploads both desktop (1400px, 80% quality) and mobile (800px, 70% quality)
 * WebP versions of a featured image.
 */
export async function processAndUploadWithMobile(opts: {
  file: File;
  bucket: string;
  folder: string;
  oldDesktopUrl?: string;
  oldMobileUrl?: string;
  onProgress?: (pct: number) => void;
}): Promise<{ desktopUrl: string; mobileUrl: string }> {
  const { file, bucket, folder, oldDesktopUrl, oldMobileUrl, onProgress } = opts;

  onProgress?.(5);

  // Generate desktop version (1400px, 80% quality)
  let desktopFile: File;
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1400,
      fileType: 'image/webp',
      useWebWorker: true,
      initialQuality: 0.8,
    });
    desktopFile = new File(
      [compressed],
      file.name.replace(/\.[^.]+$/, '.webp'),
      { type: 'image/webp' }
    );
  } catch {
    desktopFile = file;
  }

  onProgress?.(20);

  // Generate mobile version (800px, 70% quality)
  let mobileFile: File;
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 800,
      fileType: 'image/webp',
      useWebWorker: true,
      initialQuality: 0.7,
    });
    mobileFile = new File(
      [compressed],
      file.name.replace(/\.[^.]+$/, '-mobile.webp'),
      { type: 'image/webp' }
    );
  } catch {
    mobileFile = desktopFile;
  }

  onProgress?.(40);

  // Upload desktop
  const desktopPath = createSafeStoragePath({ folder, file: desktopFile });
  await uploadToStorageWithProgress({
    bucket,
    path: desktopPath,
    file: desktopFile,
    upsert: false,
    onProgress: (pct) => onProgress?.(40 + pct * 0.25),
  });

  onProgress?.(65);

  // Upload mobile
  const mobilePath = createSafeStoragePath({ folder: `${folder}/mobile`, file: mobileFile });
  await uploadToStorageWithProgress({
    bucket,
    path: mobilePath,
    file: mobileFile,
    upsert: false,
    onProgress: (pct) => onProgress?.(65 + pct * 0.25),
  });

  onProgress?.(92);

  // Get public URLs
  const { data: { publicUrl: desktopUrl } } = supabase.storage.from(bucket).getPublicUrl(desktopPath);
  const { data: { publicUrl: mobileUrl } } = supabase.storage.from(bucket).getPublicUrl(mobilePath);

  // Auto-delete old files (fire-and-forget)
  const toDelete: string[] = [];
  if (oldDesktopUrl) toDelete.push(oldDesktopUrl);
  if (oldMobileUrl) toDelete.push(oldMobileUrl);
  if (toDelete.length) removeStorageFiles(toDelete).catch(() => {});

  onProgress?.(100);
  return { desktopUrl, mobileUrl };
}
