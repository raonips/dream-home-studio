import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Loader2, Code, Eye, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DOMPurify from 'dompurify';
import type { GlobalBlockRow } from '@/pages/admin/AdminBlocks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: GlobalBlockRow | null;
  onSuccess: () => void;
}

const TARGET_PAGE_OPTIONS = [
  { value: 'todas', label: 'Todas as Páginas' },
  { value: 'imovel_detail', label: 'Detalhe do Imóvel' },
  { value: 'condominio_detail', label: 'Detalhe do Condomínio' },
  { value: 'imoveis_list', label: 'Listagem de Imóveis' },
  { value: 'condominios_list', label: 'Listagem de Condomínios' },
];

const RISKY_PATTERN = /<style[\s>]|<script[\s>]|onload\s*=|onerror\s*=/i;

const BlockFormDialog = ({ open, onOpenChange, editing, onSuccess }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    html_content: '',
    is_active: true,
    target_pages: [] as string[],
  });

  useEffect(() => {
    setSaveError(null);
    if (editing) {
      setForm({
        title: editing.title,
        html_content: editing.html_content,
        is_active: editing.is_active,
        target_pages: editing.target_pages || [],
      });
    } else {
      setForm({ title: '', html_content: '', is_active: true, target_pages: [] });
    }
  }, [editing, open]);

  const isRiskyContent = useMemo(() => RISKY_PATTERN.test(form.html_content), [form.html_content]);

  const togglePage = (value: string) => {
    setForm((f) => ({
      ...f,
      target_pages: f.target_pages.includes(value)
        ? f.target_pages.filter((p) => p !== value)
        : [...f.target_pages, value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!form.title.trim()) {
      toast({ variant: 'destructive', title: 'Informe o título do bloco' });
      return;
    }
    if (form.title.trim().length > 200) {
      toast({ variant: 'destructive', title: 'Título muito longo (máx. 200 caracteres)' });
      return;
    }
    if (form.target_pages.length === 0) {
      toast({ variant: 'destructive', title: 'Selecione pelo menos uma página de destino' });
      return;
    }

    setLoading(true);

    const payload = {
      title: form.title.trim(),
      html_content: form.html_content,
      is_active: form.is_active,
      target_pages: form.target_pages,
    };

    console.log('[BlockFormDialog] Saving payload:', {
      ...payload,
      html_content: payload.html_content.length + ' chars',
    });

    try {
      let error;
      if (editing) {
        ({ error } = await supabase.from('global_blocks').update(payload as any).eq('id', editing.id));
      } else {
        ({ error } = await supabase.from('global_blocks').insert(payload as any));
      }

      if (error) {
        const msg = `Erro ${error.code || '?'}: ${error.message}`;
        console.error('[BlockFormDialog] Save error:', error.code, error.message, error.details, error.hint);
        setSaveError(msg);
        toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
      } else {
        console.log('[BlockFormDialog] Saved successfully');
        toast({ title: editing ? 'Bloco atualizado' : 'Bloco criado' });
        onOpenChange(false);
        onSuccess();
      }
    } catch (err: any) {
      const msg = `Erro inesperado: ${err?.message || String(err)}`;
      console.error('[BlockFormDialog] Unexpected save error:', err);
      setSaveError(msg);
      toast({ variant: 'destructive', title: 'Erro inesperado', description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  const sanitizedPreview = useMemo(() => {
    if (!form.html_content) return '';
    return DOMPurify.sanitize(form.html_content, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['target', 'style', 'allow', 'allowfullscreen', 'frameborder'],
      FORBID_TAGS: ['script'],
    });
  }, [form.html_content]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Bloco' : 'Novo Bloco de Conteúdo'}</DialogTitle>
          <DialogDescription>
            Crie blocos HTML para injetar nas páginas públicas do site (publicidade, SEO local, banners).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {saveError && (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-destructive/50 bg-destructive/5">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Falha ao salvar</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{saveError}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Título (interno)</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Banner Facilities - Condomínios"
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground text-right">{form.title.length}/200</p>
          </div>

          <div className="space-y-2">
            <Label>Conteúdo HTML</Label>
            {isRiskyContent && (
              <div className="flex items-center gap-2 p-2 rounded border border-yellow-500/50 bg-yellow-500/10 text-xs text-yellow-700 dark:text-yellow-400">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Conteúdo contém &lt;style&gt;, &lt;script&gt; ou event handlers. A pré-visualização exibirá apenas o código-fonte.</span>
              </div>
            )}
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="code" className="flex items-center gap-2 text-xs">
                  <Code className="h-3 w-3" /> Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2 text-xs">
                  <Eye className="h-3 w-3" /> Pré-visualização
                </TabsTrigger>
              </TabsList>
              <TabsContent value="code">
                <Textarea
                  value={form.html_content}
                  onChange={(e) => setForm((f) => ({ ...f, html_content: e.target.value }))}
                  rows={10}
                  placeholder='<div style="background:#f5f5f5; padding:24px; border-radius:12px; text-align:center;">&#10;  <h3>🏡 Precisando de manutenção?</h3>&#10;  <p>Conheça a <a href="https://seusite.com">Empresa X</a></p>&#10;</div>'
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="border border-border rounded-lg p-4 min-h-[120px] bg-background">
                  {!form.html_content ? (
                    <p className="text-muted-foreground text-sm text-center">Nenhum conteúdo para pré-visualizar</p>
                  ) : isRiskyContent ? (
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground max-h-60 overflow-auto">
                      {form.html_content}
                    </pre>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: sanitizedPreview }} />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-3">
            <Label>Exibir nas Páginas</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TARGET_PAGE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={form.target_pages.includes(opt.value)}
                    onCheckedChange={() => togglePage(opt.value)}
                  />
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Bloco Ativo</p>
              <p className="text-xs text-muted-foreground">Desative para ocultar o bloco sem excluí-lo</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Salvar Bloco' : 'Criar Bloco'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BlockFormDialog;
