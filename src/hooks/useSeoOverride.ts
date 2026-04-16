import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SeoOverride {
  seo_title: string | null;
  seo_description: string | null;
  is_indexed: boolean;
}

const cache = new Map<string, SeoOverride | null>();

export const useSeoOverride = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [override, setOverride] = useState<SeoOverride | null>(cache.get(pathname) ?? null);

  useEffect(() => {
    if (cache.has(pathname)) {
      setOverride(cache.get(pathname) ?? null);
      return;
    }

    let cancelled = false;
    supabase
      .from('seo_overrides')
      .select('seo_title, seo_description, is_indexed')
      .eq('page_path', pathname)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const result = data && (data.seo_title || data.seo_description || data.is_indexed === false) ? { ...data, is_indexed: data.is_indexed ?? true } : null;
        cache.set(pathname, result);
        setOverride(result);
      });

    return () => { cancelled = true; };
  }, [pathname]);

  return override;
};
