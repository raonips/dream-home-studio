import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from './AdminSidebar';
import { Loader2 } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const AdminLayout = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-background px-4 gap-3">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground">
              Bem-vindo, <span className="font-semibold text-foreground">Administrador</span>
            </span>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
