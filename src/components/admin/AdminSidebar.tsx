import { LayoutDashboard, Building2, Home, Users, LogOut, LayoutGrid, Globe, Settings, Kanban, Tag, BookOpen, FolderOpen, Briefcase, Newspaper, MapPinned, Megaphone, QrCode, SearchCheck } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AdminContext = 'imoveis' | 'guia';

const AdminSidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const path = location.pathname;

  // Auto-detect context from route
  const guiaRoutes = ['/admin/guia-posts', '/admin/guia-categorias', '/admin/guia-config', '/admin/guia-seo', '/admin/locais', '/admin/ad-templates'];
  const isGuiaRoute = guiaRoutes.some((r) => path.startsWith(r));

  const [context, setContext] = useState<AdminContext>(isGuiaRoute ? 'guia' : 'imoveis');

  useEffect(() => {
    if (isGuiaRoute) setContext('guia');
    else if (path !== '/admin') setContext('imoveis');
  }, [path, isGuiaRoute]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isGuia = context === 'guia';

  return (
    <Sidebar collapsible="icon" className={cn(isGuia && '[&_[data-sidebar=sidebar]]:bg-[hsl(var(--guia-sidebar-bg))]')}>
      <SidebarHeader className="p-2 border-b">
        {!collapsed ? (
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => { setContext('imoveis'); navigate('/admin/imoveis'); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors',
                !isGuia
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-muted-foreground hover:bg-muted'
              )}
            >
              <Briefcase className="h-3.5 w-3.5" />
              NEGÓCIOS
            </button>
            <button
              onClick={() => { setContext('guia'); navigate('/admin/guia-posts'); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors',
                isGuia
                  ? 'bg-[hsl(var(--guia-primary))] text-[hsl(var(--guia-primary-foreground))]'
                  : 'bg-transparent text-muted-foreground hover:bg-muted'
              )}
            >
              <Newspaper className="h-3.5 w-3.5" />
              CONTEÚDO
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => { setContext('imoveis'); navigate('/admin/imoveis'); }}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                !isGuia ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
              title="Negócios (Imóveis)"
            >
              <Briefcase className="h-4 w-4 mx-auto" />
            </button>
            <button
              onClick={() => { setContext('guia'); navigate('/admin/guia-posts'); }}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                isGuia ? 'bg-[hsl(var(--guia-primary))] text-[hsl(var(--guia-primary-foreground))]' : 'text-muted-foreground hover:bg-muted'
              )}
              title="Conteúdo (Guia Local)"
            >
              <Newspaper className="h-4 w-4 mx-auto" />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {!isGuia ? (
          /* ===== NEGÓCIOS / IMÓVEIS ===== */
          <SidebarGroup>
            <SidebarGroupLabel>Imóveis</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" end className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Visão Geral</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/imoveis" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <Home className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Listagem</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/tags" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <Tag className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Tags / Características</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/condominios" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <Building2 className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Condomínios</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/condominio-tags" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <Tag className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Tags / Condomínios</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/crm" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <Kanban className="mr-2 h-4 w-4" />
                      {!collapsed && <span>CRM / Funil</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/leads" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <Users className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Leads / Contatos</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/blocos" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Blocos HTML</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/placas" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <QrCode className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Placas QR</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          /* ===== CONTEÚDO / GUIA LOCAL ===== */
          <SidebarGroup>
            <SidebarGroupLabel className="text-[hsl(var(--guia-primary))]">Guia Local</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/guia-posts" className="hover:bg-[hsl(var(--guia-accent))]" activeClassName="bg-[hsl(var(--guia-accent))] text-[hsl(var(--guia-primary))] font-medium">
                      <BookOpen className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Postagens</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/guia-categorias" className="hover:bg-[hsl(var(--guia-accent))]" activeClassName="bg-[hsl(var(--guia-accent))] text-[hsl(var(--guia-primary))] font-medium">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Categorias</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/locais" className="hover:bg-[hsl(var(--guia-accent))]" activeClassName="bg-[hsl(var(--guia-accent))] text-[hsl(var(--guia-primary))] font-medium">
                      <MapPinned className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Locais</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/ad-templates" className="hover:bg-[hsl(var(--guia-accent))]" activeClassName="bg-[hsl(var(--guia-accent))] text-[hsl(var(--guia-primary))] font-medium">
                      <Megaphone className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Publicidade</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/guia-config" className="hover:bg-[hsl(var(--guia-accent))]" activeClassName="bg-[hsl(var(--guia-accent))] text-[hsl(var(--guia-primary))] font-medium">
                      <Settings className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Configurações</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/guia-seo" className="hover:bg-[hsl(var(--guia-accent))]" activeClassName="bg-[hsl(var(--guia-accent))] text-[hsl(var(--guia-primary))] font-medium">
                      <Globe className="mr-2 h-4 w-4" />
                      {!collapsed && <span>SEO do Guia</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings - context-specific */}
        {!isGuia && (
          <SidebarGroup>
            <SidebarGroupLabel>Sistema</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/site-config" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <Settings className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Configurações</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/seo" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <Globe className="mr-2 h-4 w-4" />
                      {!collapsed && <span>SEO Geral</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/seo-pro" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <SearchCheck className="mr-2 h-4 w-4" />
                      {!collapsed && <span>SEO PRO</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && 'Sair'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
