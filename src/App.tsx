import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import SiteHeader from "@/components/SiteHeader";
import ScrollToTop from "@/components/ScrollToTop";
import { SiteSettingsProvider, HeadScripts } from "./hooks/useSiteSettings";

// Critical: Index loads eagerly for fastest FCP/LCP
import Index from "./pages/Index";

// Lazy-loaded routes
const Imoveis = lazy(() => import("./pages/Imoveis"));
const Vendas = lazy(() => import("./pages/Vendas"));
const Temporada = lazy(() => import("./pages/Temporada"));
const Condominios = lazy(() => import("./pages/Condominios"));
const CondominioDetalhe = lazy(() => import("./pages/CondominioDetalhe"));
const Contato = lazy(() => import("./pages/Contato"));
const ImovelDetalhe = lazy(() => import("./pages/ImovelDetalhe"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));

// Admin chunk — all admin pages in one lazy boundary
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

// Lazy-loaded layout pieces below the fold
const SiteFooter = lazy(() => import("@/components/SiteFooter"));
const WhatsAppButton = lazy(() => import("@/components/WhatsAppButton"));

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
          <HeadScripts />
          <Toaster />
          <Sonner />
           <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
            <ScrollToTop />
            <Routes>
              {/* Auth */}
              <Route path="/login" element={<Suspense fallback={<RouteLoading />}><Login /></Suspense>} />

              {/* Admin routes */}
              <Route path="/admin" element={<Suspense fallback={<RouteLoading />}><ErrorBoundary fallbackTitle="Erro no painel admin"><AdminLayout /></ErrorBoundary></Suspense>}>
                <Route index element={<Suspense fallback={<RouteLoading />}><Dashboard /></Suspense>} />
                <Route path="imoveis" element={<Suspense fallback={<RouteLoading />}><AdminProperties /></Suspense>} />
                <Route path="condominios" element={<Suspense fallback={<RouteLoading />}><AdminCondominios /></Suspense>} />
                <Route path="crm" element={<Suspense fallback={<RouteLoading />}><AdminCRM /></Suspense>} />
                <Route path="leads" element={<Suspense fallback={<RouteLoading />}><AdminLeads /></Suspense>} />
                <Route path="blocos" element={<Suspense fallback={<RouteLoading />}><AdminBlocks /></Suspense>} />
                <Route path="site-config" element={<Suspense fallback={<RouteLoading />}><AdminSiteConfig /></Suspense>} />
                <Route path="seo" element={<Suspense fallback={<RouteLoading />}><AdminSeoSettings /></Suspense>} />
                <Route path="tags" element={<Suspense fallback={<RouteLoading />}><AdminTags /></Suspense>} />
                <Route path="condominio-tags" element={<Suspense fallback={<RouteLoading />}><AdminCondominioTags /></Suspense>} />
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
                        <Route path="/" element={<Index />} />
                        <Route path="/imoveis" element={<Imoveis />} />
                        <Route path="/imoveis/tags/:tagSlug" element={<TagPage />} />
                        <Route path="/vendas" element={<Vendas />} />
                        <Route path="/temporada" element={<Temporada />} />
                        <Route path="/condominios" element={<Condominios />} />
                        <Route path="/condominio/:slug" element={<CondominioDetalhe />} />
                        <Route path="/contato" element={<Contato />} />
                        <Route path="/venda/:slug" element={<ImovelDetalhe />} />
                        <Route path="/temporada/:slug" element={<ImovelDetalhe />} />
                        <Route path="/imovel/:id" element={<ImovelDetalhe />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                      </Suspense>
                      </ErrorBoundary>
                    </main>
                    <Suspense fallback={null}>
                      <SiteFooter />
                    </Suspense>
                    <Suspense fallback={null}>
                      <WhatsAppButton />
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
