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
