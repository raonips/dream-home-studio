import { useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlacaQrCodeProps {
  url: string;
  idPlaca: string;
  logoUrl?: string | null;
  size?: number;
  showDownload?: boolean;
}

const PlacaQrCode = ({ url, idPlaca, logoUrl, size = 80, showDownload = false }: PlacaQrCodeProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDownload = useCallback(() => {
    // Create a high-res offscreen canvas QR
    const hiResSize = 2000;
    const offscreen = document.createElement('div');
    offscreen.style.position = 'absolute';
    offscreen.style.left = '-9999px';
    document.body.appendChild(offscreen);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = hiResSize;
    tempCanvas.height = hiResSize;

    // We need to render a temporary QRCodeCanvas at high res
    // Instead, let's grab the existing canvas and scale it
    const existingCanvas = canvasRef.current?.querySelector('canvas');
    if (!existingCanvas) {
      toast({ variant: 'destructive', title: 'Erro ao gerar imagem' });
      document.body.removeChild(offscreen);
      return;
    }

    const ctx = tempCanvas.getContext('2d');
    if (!ctx) {
      document.body.removeChild(offscreen);
      return;
    }

    // Draw white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, hiResSize, hiResSize);

    // Draw existing canvas scaled up (with image smoothing off for crisp QR)
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(existingCanvas, 0, 0, hiResSize, hiResSize);

    // Download
    const link = document.createElement('a');
    link.download = `qr-placa-${idPlaca}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();

    document.body.removeChild(offscreen);
    toast({ title: `QR Code da placa ${idPlaca} baixado em alta resolução` });
  }, [idPlaca, toast]);

  const imageSettings = logoUrl ? {
    src: logoUrl,
    height: Math.round(size * 0.2),
    width: Math.round(size * 0.2),
    excavate: true,
  } : undefined;

  return (
    <div className="flex items-center gap-2">
      <div ref={canvasRef} className="inline-flex">
        <QRCodeCanvas
          value={url}
          size={size}
          level="H"
          marginSize={1}
          imageSettings={imageSettings}
        />
      </div>
      {showDownload && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          title="Baixar QR Code (Alta Resolução)"
          className="text-muted-foreground hover:text-primary"
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default PlacaQrCode;
