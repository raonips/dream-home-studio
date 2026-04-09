import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, Trash2, Star, Loader2, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { createSafeStoragePath, uploadToStorageWithProgress } from '@/lib/storageUpload';
import { removeStorageFiles } from '@/lib/storageCleanup';
import imageCompression from 'browser-image-compression';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { applyWatermark } from '@/lib/watermark';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  folder?: string;
  maxImages?: number;
}

interface UploadProgress {
  name: string;
  progress: number;
}

function SortableImage({
  url,
  index,
  onRemove,
}: {
  url: string;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted',
        isDragging && 'opacity-50 z-50 ring-2 ring-primary'
      )}
      {...attributes}
      {...listeners}
    >
      <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
      {index === 0 && (
        <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Star className="h-3 w-3" /> Capa
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

const STORAGE_BUCKET = 'property-images' as const;
const STUCK_TIMEOUT_MS = 15_000; // 15s stuck = auto-reset

const ImageGalleryUpload = React.forwardRef<HTMLDivElement, Props>(function ImageGalleryUpload(
  { images, onChange, folder = 'properties', maxImages = 80 },
  ref
) {
  const { toast } = useToast();
  const siteSettings = useSiteSettings();
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [stuck, setStuck] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const stuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!uploading && images.length === 0) {
      setUploads([]);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [images.length, uploading]);

  const hardReset = useCallback(() => {
    setUploading(false);
    setUploads([]);
    setStuck(false);
    abortRef.current = false;
    if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  // Auto-reset if stuck for too long
  const startStuckTimer = useCallback(() => {
    if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    stuckTimerRef.current = setTimeout(() => {
      console.warn('[ImageGalleryUpload] Upload stuck, auto-resetting');
      setStuck(true);
    }, STUCK_TIMEOUT_MS);
  }, []);

  const clearStuckTimer = useCallback(() => {
    if (stuckTimerRef.current) {
      clearTimeout(stuckTimerRef.current);
      stuckTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    };
  }, []);

  const handleForceReset = useCallback(() => {
    abortRef.current = true;
    hardReset();
    toast({ title: 'Upload resetado. Tente novamente.' });
  }, [hardReset, toast]);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      if (uploading) {
        toast({ title: 'Aguarde o upload atual terminar' });
        return;
      }

      const remaining = maxImages - images.length;
      if (remaining <= 0) {
        toast({ variant: 'destructive', title: `Máximo de ${maxImages} imagens atingido` });
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remaining);
      abortRef.current = false;
      setUploading(true);
      setStuck(false);
      setUploads(filesToUpload.map((f) => ({ name: f.name, progress: 0 })));
      startStuckTimer();

      const newUrls: string[] = [];

      try {
        for (let i = 0; i < filesToUpload.length; i++) {
          // Check if user forced reset
          if (abortRef.current) break;

          const file = filesToUpload[i];

          if (file.size > 10 * 1024 * 1024) {
            toast({
              variant: 'destructive',
              title: `Arquivo muito grande: ${file.name}`,
              description: 'Máximo permitido: 10MB por imagem.',
            });
            setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, progress: -1 } : u)));
            continue;
          }

          // Apply watermark if configured
          let fileForProcessing: File = file;
          if (siteSettings.watermark_url) {
            try {
              fileForProcessing = await applyWatermark(file, {
                watermark_url: siteSettings.watermark_url,
                watermark_position: siteSettings.watermark_position,
                watermark_opacity: siteSettings.watermark_opacity,
                watermark_scale: siteSettings.watermark_scale,
              });
            } catch (wmErr) {
              console.warn('[ImageGalleryUpload] Watermark failed, uploading without', wmErr);
            }
          }

          // Compress image to WebP before upload
          let fileToUpload: File = fileForProcessing;
          try {
            const compressed = await imageCompression(fileForProcessing, {
              maxSizeMB: 0.2,
              maxWidthOrHeight: 1200,
              fileType: 'image/webp',
              useWebWorker: true,
            });
            fileToUpload = new File(
              [compressed],
              file.name.replace(/\.[^.]+$/, '.webp'),
              { type: 'image/webp' }
            );
          } catch (compErr) {
            console.warn('[ImageGalleryUpload] Compression failed, uploading original', compErr);
          }

          const path = createSafeStoragePath({ folder, file: fileToUpload });
          const sizeMb = Math.max(1, Math.ceil(fileToUpload.size / (1024 * 1024)));
          const timeoutMs = Math.min(180_000, Math.max(60_000, 45_000 + sizeMb * 15_000));

          setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, progress: 1 } : u)));

          try {
            await uploadToStorageWithProgress({
              bucket: STORAGE_BUCKET,
              path,
              file: fileToUpload,
              upsert: false,
              timeoutMs,
              onProgress: (pct) => {
                // Reset stuck timer on progress
                startStuckTimer();
                setUploads((prev) =>
                  prev.map((u, idx) => {
                    if (idx !== i) return u;
                    const next = Math.max(u.progress, pct);
                    return { ...u, progress: Math.min(next, 99) };
                  })
                );
              },
            });

            const {
              data: { publicUrl },
            } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

            if (!publicUrl) throw new Error('URL pública não gerada.');

            newUrls.push(publicUrl);
            setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, progress: 100 } : u)));
            // Reset stuck timer after each successful upload
            startStuckTimer();
          } catch (err: any) {
            console.error('[ImageGalleryUpload] Upload failed', { file: file.name, err: err?.message });
            const msg = String(err?.message || '').toLowerCase();
            const description =
              msg.includes('permiss') || msg.includes('policy') || msg.includes('security')
                ? 'Erro de permissão no Storage.'
                : msg.includes('expirou') || msg.includes('abort')
                ? 'Upload expirou. Tente com uma imagem menor.'
                : err?.message || 'Falha na conexão.';

            toast({ variant: 'destructive', title: `Falha: ${file.name}`, description });
            setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, progress: -1 } : u)));
          }
        }

        if (newUrls.length > 0) {
          onChange([...images, ...newUrls]);
        }
      } finally {
        clearStuckTimer();
        hardReset();
      }
    },
    [images, onChange, folder, maxImages, toast, uploading, hardReset, startStuckTimer, clearStuckTimer]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over.id as string);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const removeImage = (index: number) => {
    const removedUrl = images[index];
    onChange(images.filter((_, i) => i !== index));
    // Clean up the file from Storage in the background
    if (removedUrl) {
      removeStorageFiles([removedUrl]).catch(() => {});
    }
  };

  return (
    <div className="space-y-3" ref={ref}>
      {/* Stuck warning */}
      {stuck && uploading && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive flex-1">
            O upload parece travado. Clique para resetar e tentar novamente.
          </p>
          <Button type="button" size="sm" variant="destructive" onClick={handleForceReset}>
            Resetar
          </Button>
        </div>
      )}

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-input rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleUpload(e.dataTransfer.files);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 mx-auto text-primary animate-spin mb-2" />
        ) : (
          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        )}
        <p className="text-sm text-muted-foreground">
          {uploading ? 'Enviando...' : `Arraste imagens ou clique para enviar (máx. ${maxImages})`}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {images.length}/{maxImages} fotos • A primeira será a capa
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
          disabled={uploading}
        />
      </div>

      {/* Progress indicators */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u, i) => (
            <div key={`${u.name}-${i}`} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">{u.name}</span>
              <Progress value={u.progress < 0 ? 0 : u.progress} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground w-8 text-right">
                {u.progress < 0 ? '❌' : `${u.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Sortable grid */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {images.map((url, index) => (
                <SortableImage key={url} url={url} index={index} onRemove={() => removeImage(index)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
});

export default ImageGalleryUpload;
