import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const QrRedirect = () => {
  const { idPlaca } = useParams<{ idPlaca: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      if (!idPlaca) { navigate('/imoveis', { replace: true }); return; }

      const { data, error: err } = await supabase
        .from('placas_qr')
        .select('imovel_vinculado_id, properties:imovel_vinculado_id(slug, transaction_type)')
        .eq('id_placa', idPlaca)
        .maybeSingle();

      if (err || !data || !data.imovel_vinculado_id) {
        navigate('/imoveis', { replace: true });
        return;
      }

      const prop = data.properties as any;
      if (prop?.slug) {
        const prefix = prop.transaction_type === 'temporada' ? 'temporada' : 'venda';
        navigate(`/imoveis/${prefix}/${prop.slug}`, { replace: true });
      } else {
        navigate(`/imoveis/imovel/${data.imovel_vinculado_id}`, { replace: true });
      }
    };

    resolve();
  }, [idPlaca, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default QrRedirect;
