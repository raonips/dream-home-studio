import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, RefreshCw, Home, MapPinned, Newspaper, Building2, FolderOpen, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SitemapStats {
  total: number;
  properties_venda: number;
  properties_temporada: number;
  locais: number;
  guia_posts: number;
  guia_categorias: number;
  condominios: number;
  static_pages: number;
}

const SITEMAP_URL = `https://nfzkreaylakmvlrbbjci.supabase.co/functions/v1/sitemap`;

const AdminSitemap = () => {
  const [stats, setStats] = useState<SitemapStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SITEMAP_URL}?format=json`);
      if (!res.ok) throw new Error("Erro ao carregar stats");
      const data = await res.json();
      setStats(data);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(SITEMAP_URL);
    toast({ title: "Link copiado!", description: "Cole no Google Search Console." });
  };

  const handleOpen = () => {
    window.open(SITEMAP_URL, "_blank");
  };

  const statCards = stats ? [
    { label: "Imóveis Venda", count: stats.properties_venda, icon: Home, color: "text-blue-600" },
    { label: "Imóveis Temporada", count: stats.properties_temporada, icon: Home, color: "text-purple-600" },
    { label: "Condomínios", count: stats.condominios, icon: Building2, color: "text-emerald-600" },
    { label: "Locais (Guia)", count: stats.locais, icon: MapPinned, color: "text-orange-600" },
    { label: "Posts do Guia", count: stats.guia_posts, icon: Newspaper, color: "text-rose-600" },
    { label: "Categorias Guia", count: stats.guia_categorias, icon: FolderOpen, color: "text-amber-600" },
    { label: "Páginas Fixas", count: stats.static_pages, icon: FileText, color: "text-slate-600" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sitemap e Indexação</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie a indexação do site no Google. O sitemap é gerado dinamicamente.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Total counter */}
      {stats && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de URLs no Sitemap</p>
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Prontas para o Google
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acesso ao Sitemap</CardTitle>
          <CardDescription>
            Envie o link abaixo ao Google Search Console para indexar todas as páginas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted font-mono text-sm break-all">
            {SITEMAP_URL}
          </div>
          <div className="flex gap-3">
            <Button onClick={handleOpen} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Abrir Sitemap XML
            </Button>
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              <Copy className="h-4 w-4" />
              Copiar Link do Sitemap
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSitemap;
