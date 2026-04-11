import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import SiteHeader from "@/components/SiteHeader";
import ScrollToTop from "@/components/ScrollToTop";
import { SiteSettingsProvider, HeadScripts, SiteHelmet } from "./hooks/useSiteSettings";

// Critical: Index loads eagerly for fastest FCP/LCP
import Index from "./pages/Index";

// Lazy-loaded routes — Imóveis
const Imoveis = lazy(() => import("./pages/Imoveis"));
const Vendas = lazy(() => import("./pages/Vendas"));
const Temporada = lazy(() => import("./pages/Temporada"));
const Condominios = lazy(() => import("./pages/Condominios"));
const CondominioDetalhe = lazy(() => import("./pages/CondominioDetalhe"));
const Contato = lazy(() => import("./pages/Contato"));
const ImovelDetalhe = lazy(() => import("./pages/ImovelDetalhe"));
const PropertySlugRedirect = lazy(() => import("./components/PropertySlugRedirect"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));

// Lazy-loaded routes — Guia Local
const GuiaHome = lazy(() => import("./pages/guia/GuiaHome"));
const GuiaPostDetalhe = lazy(() => import("./pages/guia/GuiaPostDetalhe"));
const GuiaCategoriaPage = lazy(() => import("./pages/guia/GuiaCategoria"));
const BuscaPage = lazy(() => import("./pages/BuscaPage"));

// Admin chunk
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProperties = lazy(() => import("./pages/admin/AdminProperties"));
const AdminCondominios = lazy(() => import("./pages/admin/AdminCondominios"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminCRM = lazy(() => import("./pages/admin/AdminCRM"));
const AdminBlocks = lazy(() => import("./pages/admin/AdminBlocks"));
const AdminSeoSettings = lazy(() => import("./pages/admin/AdminSeoSettings"));
const AdminSiteConfig = lazy(() => import("./pages/admin/AdminSiteConfig"));
const AdminTags = lazy(() => import("./pages/admin/AdminTags"));
const AdminCondominioTags = lazy(() => import("./pages/admin/AdminCondominioTags"));
const TagPage = lazy(() => import("./pages/TagPage"));
const LocalDetalhe = lazy(() => import("./pages/LocalDetalhe"));
const LocaisListagem = lazy(() => import("./pages/LocaisListagem"));
const AdminGuiaPosts = lazy(() => import("./pages/admin/AdminGuiaPosts"));
const AdminGuiaCategorias = lazy(() => import("./pages/admin/AdminGuiaCategorias"));
const AdminGuiaSiteConfig = lazy(() => import("./pages/admin/AdminGuiaSiteConfig"));
const AdminGuiaSeoSettings = lazy(() => import("./pages/admin/AdminGuiaSeoSettings"));
const AdminLocais = lazy(() => import("./pages/admin/AdminLocais"));
const AdminAdTemplates = lazy(() => import("./pages/admin/AdminAdTemplates"));
const AdminPlacas = lazy(() => import("./pages/admin/AdminPlacas"));
const MapaGeral = lazy(() => import("./pages/MapaGeral"));
const QrRedirect = lazy(() => import("./pages/QrRedirect"));

// Lazy-loaded layout pieces below the fold
const SiteFooter = lazy(() => import("@/components/SiteFooter"));
const FloatingMapButton = lazy(() => import("@/components/FloatingMapButton"));

const LegacyRedirect = ({ prefix }: { prefix: string }) => {
  const slug = window.location.pathname.split('/').pop() || '';
  return <Navigate to={`/imoveis/${prefix}/${slug}`} replace />;
};

const RouteLoading = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 30_000,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SiteSettingsProvider>
          <Toaster />
          <Sonner />
           <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
            <ScrollToTop />
            <SiteHelmet />
            <HeadScripts />
            <Routes>
              {/* Auth */}
              <Route path="/login" element={<Suspense fallback={<RouteLoading />}><Login /></Suspense>} />

              {/* Admin routes */}
              <Route path="/admin" element={<Suspense fallback={<RouteLoading />}><ErrorBoundary fallbackTitle="Erro no painel admin"><AdminLayout /></ErrorBoundary></Suspense>}>
                <Route index element={<Suspense fallback={<RouteLoading />}><Dashboard /></Suspense>} />
                {/* Imóveis admin */}
                <Route path="imoveis" element={<Suspense fallback={<RouteLoading />}><AdminProperties /></Suspense>} />
                <Route path="condominios" element={<Suspense fallback={<RouteLoading />}><AdminCondominios /></Suspense>} />
                <Route path="crm" element={<Suspense fallback={<RouteLoading />}><AdminCRM /></Suspense>} />
                <Route path="leads" element={<Suspense fallback={<RouteLoading />}><AdminLeads /></Suspense>} />
                <Route path="blocos" element={<Suspense fallback={<RouteLoading />}><AdminBlocks /></Suspense>} />
                <Route path="ad-templates" element={<Suspense fallback={<RouteLoading />}><AdminAdTemplates /></Suspense>} />
                <Route path="placas" element={<Suspense fallback={<RouteLoading />}><AdminPlacas /></Suspense>} />
                <Route path="site-config" element={<Suspense fallback={<RouteLoading />}><AdminSiteConfig /></Suspense>} />
                <Route path="seo" element={<Suspense fallback={<RouteLoading />}><AdminSeoSettings /></Suspense>} />
                <Route path="tags" element={<Suspense fallback={<RouteLoading />}><AdminTags /></Suspense>} />
                <Route path="condominio-tags" element={<Suspense fallback={<RouteLoading />}><AdminCondominioTags /></Suspense>} />
                {/* Guia Local admin */}
                <Route path="guia-posts" element={<Suspense fallback={<RouteLoading />}><AdminGuiaPosts /></Suspense>} />
                <Route path="guia-categorias" element={<Suspense fallback={<RouteLoading />}><AdminGuiaCategorias /></Suspense>} />
                <Route path="guia-config" element={<Suspense fallback={<RouteLoading />}><AdminGuiaSiteConfig /></Suspense>} />
                <Route path="guia-seo" element={<Suspense fallback={<RouteLoading />}><AdminGuiaSeoSettings /></Suspense>} />
                <Route path="locais" element={<Suspense fallback={<RouteLoading />}><AdminLocais /></Suspense>} />
              </Route>

              {/* Public routes */}
              <Route
                path="/*"
                element={
                <div className="min-h-screen bg-background flex flex-col">
                    <SiteHeader />
                    <main className="flex-1">
                      <ErrorBoundary fallbackTitle="Erro ao carregar a página">
                      <Suspense fallback={<RouteLoading />}>
                      <Routes>
                        {/* Guia Local — root */}
                        <Route path="/" element={<GuiaHome />} />
                        <Route path="/guia/categoria/:slug" element={<GuiaCategoriaPage />} />
                        <Route path="/busca" element={<BuscaPage />} />
                        <Route path="/mapa" element={<MapaGeral />} />

                        {/* Imóveis — moved under /imoveis */}
                        <Route path="/imoveis" element={<Index />} />
                        <Route path="/qr/:idPlaca" element={<QrRedirect />} />
                        <Route path="/imoveis/listagem" element={<Imoveis />} />
                        <Route path="/imoveis/tags/:tagSlug" element={<TagPage />} />
                        <Route path="/imoveis/vendas" element={<Vendas />} />
                        <Route path="/imoveis/temporada" element={<Temporada />} />
                        <Route path="/imoveis/condominios" element={<Condominios />} />
                        <Route path="/imoveis/condominio/:slug" element={<CondominioDetalhe />} />
                        <Route path="/imoveis/contato" element={<Contato />} />
                        <Route path="/imoveis/venda/:slug" element={<ImovelDetalhe />} />
                        <Route path="/imoveis/temporada/:slug" element={<ImovelDetalhe />} />
                        <Route path="/imoveis/imovel/:id" element={<ImovelDetalhe />} />

                        {/* Locais - listing by category */}
                        <Route path="/locais/gastronomia" element={<LocaisListagem />} />
                        <Route path="/locais/hospedagem" element={<LocaisListagem />} />
                        <Route path="/locais/utilidades" element={<LocaisListagem />} />
                        <Route path="/locais/condominios" element={<LocaisListagem />} />
                        {/* Locais - detail */}
                        <Route path="/locais/:slug" element={<LocalDetalhe />} />

                        {/* Legacy redirects (old URLs without /imoveis prefix) */}
                        <Route path="/venda/:slug" element={<LegacyRedirect prefix="venda" />} />
                        <Route path="/temporada/:slug" element={<LegacyRedirect prefix="temporada" />} />
                        <Route path="/imovel/:id" element={<LegacyRedirect prefix="imovel" />} />
                        <Route path="/condominio/:slug" element={<LegacyRedirect prefix="condominio" />} />

                        {/* Guia post catch-all (must be last) */}
                        <Route path="/:slug" element={<GuiaPostDetalhe />} />

                        <Route path="*" element={<NotFound />} />
                      </Routes>
                      </Suspense>
                      </ErrorBoundary>
                    </main>
                    <Suspense fallback={null}>
                      <SiteFooter />
                    </Suspense>
                    <Suspense fallback={null}>
                      <FloatingMapButton />
                    </Suspense>
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
          </SiteSettingsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
