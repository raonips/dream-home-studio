import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Building2, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const [counts, setCounts] = useState({ properties: 0, condominios: 0, leads: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const [p, c, l] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }),
        supabase.from('condominios').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
      ]);
      setCounts({
        properties: p.count ?? 0,
        condominios: c.count ?? 0,
        leads: l.count ?? 0,
      });
    };
    fetchCounts();
  }, []);

  const stats = [
    { label: 'Imóveis Cadastrados', value: counts.properties, icon: Home, color: 'text-primary' },
    { label: 'Condomínios', value: counts.condominios, icon: Building2, color: 'text-accent' },
    { label: 'Leads Recebidos', value: counts.leads, icon: Users, color: 'text-nature' },
    { label: 'Taxa de Conversão', value: '—', icon: TrendingUp, color: 'text-ocean' },
  ];

  return (
    <>
      <Helmet><title>Dashboard | Imóveis Barra do Jacuípe Admin</title></Helmet>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-display text-foreground">Visão Geral</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold">{s.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
