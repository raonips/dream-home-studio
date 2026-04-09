import imageCompression from 'browser-image-compression';
import { createSafeStoragePath, uploadToStorageWithProgress } from '@/lib/storageUpload';
import { supabase } from '@/integrations/supabase/client';
import { applyWatermark, type WatermarkConfig } from '@/lib/watermark';

const STORAGE_BUCKET = 'property-images';

interface CompressAndUploadResult {
  mainUrl: string;
  thumbnailUrl: string;
}

/**
 * Compresses the cover image into two versions (main + thumbnail),
 * applies watermark if configured, uploads both to Storage, and returns the public URLs.
 */
export async function compressAndUploadCover(
  file: File,
  folder: string,
  watermarkConfig?: WatermarkConfig
): Promise<CompressAndUploadResult> {
  // Apply watermark BEFORE compression
  let processedFile = file;
  if (watermarkConfig?.watermark_url) {
    try {
      processedFile = await applyWatermark(file, watermarkConfig);
    } catch (wmErr) {
      console.warn('[compressAndUploadCover] Watermark failed, uploading without', wmErr);
    }
  }

  // Generate main version (max 200KB, 1200px)
  const mainFile = await imageCompression(processedFile, {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1200,
    fileType: 'image/webp',
    useWebWorker: true,
  });

  // Generate thumbnail version (max 50KB, 750px)
  const thumbFile = await imageCompression(processedFile, {
    maxSizeMB: 0.05,
    maxWidthOrHeight: 750,
    fileType: 'image/webp',
    useWebWorker: true,
  });

  // Create safe paths
  const mainPath = createSafeStoragePath({ folder, file: new File([mainFile], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }) });
  const thumbPath = createSafeStoragePath({ folder: `${folder}/thumbs`, file: new File([thumbFile], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }) });

  // Upload both in parallel
  await Promise.all([
    uploadToStorageWithProgress({ bucket: STORAGE_BUCKET, path: mainPath, file: mainFile as File, upsert: false }),
    uploadToStorageWithProgress({ bucket: STORAGE_BUCKET, path: thumbPath, file: thumbFile as File, upsert: false }),
  ]);

  const { data: { publicUrl: mainUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(mainPath);
  const { data: { publicUrl: thumbnailUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(thumbPath);

  return { mainUrl, thumbnailUrl };
}
