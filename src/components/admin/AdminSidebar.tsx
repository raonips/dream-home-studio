import { LayoutDashboard, Building2, Home, Users, LogOut, LayoutGrid, Globe, Settings, Kanban, Tag, ChevronDown, BookOpen, FolderOpen } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const AdminSidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const path = location.pathname;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const imoveisOpen = path.startsWith('/admin/imoveis') || path.startsWith('/admin/tags') || path.startsWith('/admin/condominios') || path.startsWith('/admin/condominio-tags') || path.startsWith('/admin/crm') || path.startsWith('/admin/leads') || path.startsWith('/admin/blocos');
  const guiaOpen = path.startsWith('/admin/guia');

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/admin" end className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Visão Geral</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* ===== IMÓVEIS GROUP ===== */}
              <Collapsible defaultOpen={imoveisOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="hover:bg-muted/50 cursor-pointer">
                      <Home className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">Imóveis</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/imoveis" className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted/50 w-full" activeClassName="bg-muted text-primary font-medium">
                          Listagem
                        </NavLink>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/tags" className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted/50 w-full" activeClassName="bg-muted text-primary font-medium">
                          <Tag className="h-3.5 w-3.5" /> Tags / Características
                        </NavLink>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/condominios" className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted/50 w-full" activeClassName="bg-muted text-primary font-medium">
                          <Building2 className="h-3.5 w-3.5" /> Condomínios
                        </NavLink>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/condominio-tags" className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted/50 w-full" activeClassName="bg-muted text-primary font-medium">
                          <Tag className="h-3.5 w-3.5" /> Tags / Condomínios
                        </NavLink>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/crm" className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted/50 w-full" activeClassName="bg-muted text-primary font-medium">
                          <Kanban className="h-3.5 w-3.5" /> CRM / Funil
                        </NavLink>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/leads" className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted/50 w-full" activeClassName="bg-muted text-primary font-medium">
                          <Users className="h-3.5 w-3.5" /> Leads / Contatos
                        </NavLink>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/blocos" className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted/50 w-full" activeClassName="bg-muted text-primary font-medium">
                          <LayoutGrid className="h-3.5 w-3.5" /> Blocos & Publicidade
                        </NavLink>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* ===== GUIA LOCAL GROUP ===== */}
              <Collapsible defaultOpen={guiaOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="hover:bg-muted/50 cursor-pointer">
                      <BookOpen className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">Guia Local</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/guia-posts" className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted/50 w-full" activeClassName="bg-muted text-primary font-medium">
                          <BookOpen className="h-3.5 w-3.5" /> Postagens
                        </NavLink>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/guia-categorias" className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted/50 w-full" activeClassName="bg-muted text-primary font-medium">
                          <FolderOpen className="h-3.5 w-3.5" /> Categorias
                        </NavLink>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Settings */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/admin/site-config" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                    <Settings className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Configurações do Site</span>}
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
