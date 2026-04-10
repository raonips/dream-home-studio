import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCw, RotateCcw, Square, Circle, ZoomIn, Crop } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

async function getCroppedImg(imageSrc: string, crop: Area, rotation: number): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const rad = (rotation * Math.PI) / 180;

  // Calculate bounding box of rotated image
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const bBoxW = image.width * cos + image.height * sin;
  const bBoxH = image.width * sin + image.height * cos;

  // Set canvas to bounding box size, draw rotated image
  canvas.width = bBoxW;
  canvas.height = bBoxH;
  ctx.translate(bBoxW / 2, bBoxH / 2);
  ctx.rotate(rad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // Extract the cropped area
  const data = ctx.getImageData(crop.x, crop.y, crop.width, crop.height);
  canvas.width = crop.width;
  canvas.height = crop.height;
  ctx.putImageData(data, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas empty'))),
      'image/webp',
      0.85
    );
  });
}

const ImageCropperDialog = ({ open, onOpenChange, imageSrc, onCropComplete }: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [shape, setShape] = useState<'square' | 'circle'>('square');
  const [saving, setSaving] = useState(false);

  const onCropDone = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedArea) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedArea, rotation);
      onCropComplete(blob);
      onOpenChange(false);
    } catch {
      // fallback: do nothing
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Crop className="h-4 w-4" /> Recortar Logo
          </DialogTitle>
        </DialogHeader>

        {/* Crop area */}
        <div className="relative w-full h-[320px] bg-black/90">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape={shape === 'circle' ? 'round' : 'rect'}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropDone}
            showGrid={shape === 'square'}
          />
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4">
          {/* Shape selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">Formato:</span>
            <Button
              type="button"
              size="sm"
              variant={shape === 'square' ? 'default' : 'outline'}
              onClick={() => setShape('square')}
              className="h-8 text-xs gap-1.5"
            >
              <Square className="h-3.5 w-3.5" /> Quadrado
            </Button>
            <Button
              type="button"
              size="sm"
              variant={shape === 'circle' ? 'default' : 'outline'}
              onClick={() => setShape('circle')}
              className="h-8 text-xs gap-1.5"
            >
              <Circle className="h-3.5 w-3.5" /> Círculo
            </Button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-3">
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Rotation */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">Rotação:</span>
            <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => setRotation((r) => r - 90)}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => setRotation((r) => r + 90)}>
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground">{rotation}°</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Processando...' : 'Salvar Recorte'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropperDialog;
