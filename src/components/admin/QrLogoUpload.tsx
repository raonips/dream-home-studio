import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QrLogoUploadProps {
  currentLogoUrl: string | null;
  onLogoChange: (url: string | null) => void;
}

const QrLogoUpload = ({ currentLogoUrl, onLogoChange }: QrLogoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `qr-logo/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('site_settings')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: uploadError.message });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('site_settings').getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Save to site_settings
    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ qr_logo_url: publicUrl } as any)
      .not('id', 'is', null);

    if (updateError) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: updateError.message });
    } else {
      onLogoChange(publicUrl);
      toast({ title: 'Logo do QR Code atualizada' });
    }
    setUploading(false);
  };

  const handleRemove = async () => {
    const { error } = await supabase
      .from('site_settings')
      .update({ qr_logo_url: null } as any)
      .not('id', 'is', null);

    if (!error) {
      onLogoChange(null);
      toast({ title: 'Logo removida' });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Logo para QR Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {currentLogoUrl ? (
            <div className="relative">
              <img
                src={currentLogoUrl}
                alt="QR Logo"
                className="h-16 w-16 rounded-md border border-border object-contain bg-background p-1"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                onClick={handleRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="h-16 w-16 rounded-md border border-dashed border-border flex items-center justify-center bg-muted/50">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-2">
              Esta logo será centralizada em todos os QR Codes gerados. Recomendado: imagem quadrada, fundo transparente.
            </p>
            <Button variant="outline" size="sm" disabled={uploading} asChild>
              <label className="cursor-pointer">
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {uploading ? 'Enviando...' : 'Enviar Logo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QrLogoUpload;
