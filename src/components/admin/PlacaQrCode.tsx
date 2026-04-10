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

/**
 * Load an image as a blob and return a local object URL to avoid CORS/tainted canvas.
 */
const loadImageAsObjectUrl = async (src: string): Promise<string> => {
  const res = await fetch(src);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

const PlacaQrCode = ({ url, idPlaca, logoUrl, size = 80, showDownload = false }: PlacaQrCodeProps) => {
  const hiResRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDownload = useCallback(async () => {
    try {
      // We render a hidden high-res QR, wait for it, then export.
      // To avoid tainted canvas with the logo, we load it as a blob first.
      const hiResSize = 2000;
      const logoSize = Math.round(hiResSize * 0.2);

      // Create offscreen container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-99999px';
      document.body.appendChild(container);

      // Draw QR without logo first using a temporary canvas
      const { createRoot } = await import('react-dom/client');
      const { createElement } = await import('react');

      const canvas = document.createElement('canvas');
      canvas.width = hiResSize;
      canvas.height = hiResSize;

      // Use the qrcode.react internal rendering by mounting a hidden QRCodeCanvas
      const wrapper = document.createElement('div');
      container.appendChild(wrapper);

      await new Promise<void>((resolve) => {
        const root = createRoot(wrapper);
        root.render(
          createElement(QRCodeCanvas, {
            value: url,
            size: hiResSize,
            level: 'H',
            marginSize: 1,
            ref: () => {
              // Give it a frame to render
              setTimeout(() => {
                resolve();
              }, 100);
            },
          })
        );
      });

      const renderedCanvas = wrapper.querySelector('canvas');
      if (!renderedCanvas) {
        throw new Error('Canvas not found');
      }

      // Create final canvas
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = hiResSize;
      finalCanvas.height = hiResSize;
      const ctx = finalCanvas.getContext('2d')!;

      // Draw QR
      ctx.drawImage(renderedCanvas, 0, 0);

      // Draw logo on top if available
      if (logoUrl) {
        try {
          const localUrl = await loadImageAsObjectUrl(logoUrl);
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = localUrl;
          });

          const padding = 8;
          const x = (hiResSize - logoSize) / 2;
          const y = (hiResSize - logoSize) / 2;

          // White excavation background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(x - padding, y - padding, logoSize + padding * 2, logoSize + padding * 2);

          ctx.drawImage(img, x, y, logoSize, logoSize);
          URL.revokeObjectURL(localUrl);
        } catch {
          // If logo fails, QR is still valid without it
          console.warn('Failed to load logo for high-res QR');
        }
      }

      // Download
      const link = document.createElement('a');
      link.download = `qr-placa-${idPlaca}.png`;
      link.href = finalCanvas.toDataURL('image/png');
      link.click();

      // Cleanup
      document.body.removeChild(container);
      toast({ title: `QR Code da placa ${idPlaca} baixado (2000×2000px)` });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erro ao gerar imagem de alta resolução' });
    }
  }, [url, idPlaca, logoUrl, toast]);

  const imageSettings = logoUrl ? {
    src: logoUrl,
    height: Math.round(size * 0.2),
    width: Math.round(size * 0.2),
    excavate: true,
  } : undefined;

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex">
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
          title="Baixar QR Code (Alta Resolução 2000×2000)"
          className="text-muted-foreground hover:text-primary"
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default PlacaQrCode;
