import { useState, useRef, useCallback } from 'react';
import { Upload, Link2, X, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { processAndUploadGuiaImage } from '@/lib/guiaImageUpload';
import { removeStorageFiles } from '@/lib/storageCleanup';

interface Props {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  aspectHint?: string;
}

/**
 * Reusable image upload field for all Guia Local admin modules.
 * Supports drag-and-drop, file selection, and URL fallback.
 * Auto-converts to WebP, shows progress, and cleans up old files.
 */
const GuiaImageUploadField = ({
  label = 'Imagem',
  value,
  onChange,
  bucket = 'categorias',
  folder = 'uploads',
  maxSizeMB = 5,
  aspectHint,
}: Props) => {
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Selecione uma imagem válida' });
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({ variant: 'destructive', title: `Imagem muito grande (máx ${maxSizeMB}MB)` });
      return;
    }

    setUploading(true);
    setProgress(5);

    try {
      const publicUrl = await processAndUploadGuiaImage({
        file,
        bucket,
        folder,
        oldUrl: value || undefined,
        onProgress: setProgress,
      });
      onChange(publicUrl);
      toast({ title: 'Imagem otimizada e enviada!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: err.message });
    } finally {
      setTimeout(() => { setUploading(false); setProgress(0); }, 300);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onChange, value, bucket, folder, maxSizeMB, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const removeImage = useCallback(() => {
    if (value) {
      removeStorageFiles([value]).catch(() => {});
    }
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  }, [onChange, value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`text-xs px-2 py-1 rounded ${mode === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            <Upload className="h-3 w-3 inline mr-1" />Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('link')}
            className={`text-xs px-2 py-1 rounded ${mode === 'link' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            <Link2 className="h-3 w-3 inline mr-1" />Link
          </button>
        </div>
      </div>

      {/* Preview */}
      {value && (
        <div className="relative rounded-lg overflow-hidden border border-border aspect-video max-w-[220px]">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {mode === 'link' ? (
        <Input
          placeholder="https://exemplo.com/imagem.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <>
          <div
            className="border-2 border-dashed border-input rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 mx-auto text-primary animate-spin mb-1" />
                <p className="text-xs text-primary font-medium">Otimizando e enviando imagem...</p>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Clique ou arraste uma imagem</p>
                {aspectHint && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{aspectHint}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">Convertida automaticamente para WebP otimizado</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
          {uploading && <Progress value={progress} className="h-1.5" />}
        </>
      )}
    </div>
  );
};

export default GuiaImageUploadField;
