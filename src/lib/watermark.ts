/**
 * Applies a watermark logo onto an image using HTML5 Canvas.
 * Returns a new File with the watermark baked in.
 */

export interface WatermarkConfig {
  watermark_url: string;
  watermark_position: string; // center, bottom-right, top-right, bottom-left, top-left
  watermark_opacity: number;  // 0 to 1
  watermark_scale: number;    // 0.05 to 1.0
}

function loadImage(src: string, useCors: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (useCors) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Falha ao carregar imagem: ${src} — ${e}`));
    img.src = src;
  });
}

function getPosition(
  canvasW: number,
  canvasH: number,
  wmW: number,
  wmH: number,
  position: string
): { x: number; y: number } {
  const padding = Math.min(canvasW, canvasH) * 0.03;

  switch (position) {
    case 'top-left':
      return { x: padding, y: padding };
    case 'top-right':
      return { x: canvasW - wmW - padding, y: padding };
    case 'bottom-left':
      return { x: padding, y: canvasH - wmH - padding };
    case 'bottom-right':
      return { x: canvasW - wmW - padding, y: canvasH - wmH - padding };
    case 'center':
    default:
      return { x: (canvasW - wmW) / 2, y: (canvasH - wmH) / 2 };
  }
}

export async function applyWatermark(
  file: File,
  config: WatermarkConfig
): Promise<File> {
  if (!config.watermark_url) {
    console.log('[Watermark] Nenhuma URL de watermark configurada, pulando.');
    return file;
  }

  console.log('[Watermark] Iniciando aplicação de marca d\'água...', {
    position: config.watermark_position,
    opacity: config.watermark_opacity,
    scale: config.watermark_scale,
    watermark_url: config.watermark_url,
  });

  const objectUrl = URL.createObjectURL(file);

  try {
    // Load base image from local blob (no CORS needed)
    const baseImg = await loadImage(objectUrl, false);

    // Load watermark from Supabase URL (CORS required)
    let wmImg: HTMLImageElement;
    try {
      wmImg = await loadImage(config.watermark_url, true);
    } catch (corsErr) {
      // Fallback: try fetching as blob to bypass CORS
      console.warn('[Watermark] CORS falhou, tentando fetch como blob...', corsErr);
      const resp = await fetch(config.watermark_url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      try {
        wmImg = await loadImage(blobUrl, false);
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context não disponível');

    // Draw base image
    ctx.drawImage(baseImg, 0, 0);

    // Calculate watermark dimensions
    const scale = config.watermark_scale || 0.5;
    const maxWmWidth = canvas.width * scale;
    const ratio = wmImg.naturalWidth / wmImg.naturalHeight;
    const wmW = Math.min(maxWmWidth, wmImg.naturalWidth);
    const wmH = wmW / ratio;

    const { x, y } = getPosition(canvas.width, canvas.height, wmW, wmH, config.watermark_position);

    // Draw watermark with opacity
    ctx.globalAlpha = Math.max(0.05, Math.min(1, config.watermark_opacity));
    ctx.drawImage(wmImg, x, y, wmW, wmH);
    ctx.globalAlpha = 1;

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Falha ao gerar imagem com marca d\'água'))),
        file.type || 'image/jpeg',
        0.92
      );
    });

    console.log('[Watermark] ✅ Marca d\'água aplicada com sucesso!', {
      original: file.name,
      dimensions: `${canvas.width}x${canvas.height}`,
      watermarkSize: `${Math.round(wmW)}x${Math.round(wmH)}`,
      position: config.watermark_position,
    });

    return new File([blob], file.name, { type: blob.type });
  } catch (err) {
    console.error('[Watermark] ❌ Erro ao aplicar marca d\'água:', err);
    throw err;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
