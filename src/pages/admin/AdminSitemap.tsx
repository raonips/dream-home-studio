import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, RefreshCw, Home, MapPinned, Newspaper, Building2, FolderOpen, FileText } from "lucide-react";
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

const SITEMAP_EDGE_URL = `https://nfzkreaylakmvlrbbjci.supabase.co/functions/v1/sitemap`;
const SITEMAP_PROD_URL = `https://barradojacuipe.com.br/sitemap.xml`;

const AdminSitemap = () => {
  const [stats, setStats] = useState<SitemapStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SITEMAP_EDGE_URL}?format=json`);
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

  const handleCopy = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: `${label} copiado para a área de transferência.` });
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acesso ao Sitemap</CardTitle>
          <CardDescription>
            Envie a URL oficial ao Google Search Console. Use a URL de backup para acessar os dados diretamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* URL Oficial */}
          <div>
            <p className="text-sm font-semibold mb-1.5 flex items-center gap-2">
              <Badge className="bg-green-600 hover:bg-green-700">Produção</Badge>
              URL Oficial — envie esta ao Google
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 rounded-md bg-muted font-mono text-sm break-all">
                {SITEMAP_PROD_URL}
              </div>
              <Button size="icon" variant="outline" onClick={() => handleCopy(SITEMAP_PROD_URL, "URL Oficial")}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => window.open(SITEMAP_PROD_URL, "_blank")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* URL Backup */}
          <div>
            <p className="text-sm font-semibold mb-1.5 flex items-center gap-2">
              <Badge variant="secondary">Backup</Badge>
              URL da Edge Function (fonte dos dados)
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 rounded-md bg-muted font-mono text-sm break-all">
                {SITEMAP_EDGE_URL}
              </div>
              <Button size="icon" variant="outline" onClick={() => handleCopy(SITEMAP_EDGE_URL, "URL Backup")}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => window.open(SITEMAP_EDGE_URL, "_blank")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSitemap;
