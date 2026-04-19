import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export interface Sitelink {
  title: string;
  url: string;
}

interface SeoOverride {
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  is_indexed: boolean;
  sitelinks: Sitelink[];
}

const cache = new Map<string, SeoOverride | null>();

const normalizePath = (input: string) => {
  let path = input.trim() || '/';
  path = path.split('#')[0]?.split('?')[0] || '/';

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  if (path.length > 1) {
    path = path.replace(/\/+$/, '');
  }

  return path || '/';
};

const sanitizeSitelinks = (raw: unknown): Sitelink[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .map((s) => ({
      title: typeof s.title === 'string' ? s.title : '',
      url: typeof s.url === 'string' ? s.url : '',
    }))
    .filter((s) => s.title.trim() && s.url.trim())
    .slice(0, 4);
};

export const useSeoOverride = () => {
  const location = useLocation();
  const rawPathname = location.pathname || '/';
  const pathname = normalizePath(rawPathname);
  const [override, setOverride] = useState<SeoOverride | null>(cache.get(pathname) ?? null);

  useEffect(() => {
    if (cache.has(pathname)) {
      setOverride(cache.get(pathname) ?? null);
    }

    let cancelled = false;
    const candidatePaths = Array.from(new Set([
      rawPathname,
      pathname,
      pathname === '/' ? pathname : `${pathname}/`,
    ]));

    supabase
      .from('seo_overrides')
      .select('page_path, seo_title, seo_description, og_image, is_indexed, sitelinks')
      .in('page_path', candidatePaths)
      .then(({ data }) => {
        if (cancelled) return;

        const match = (data || []).find((item: any) => normalizePath(item.page_path) === pathname) || null;
        const m: any = match;
        const sitelinks = sanitizeSitelinks(m?.sitelinks);
        const result = m && (m.seo_title || m.seo_description || m.og_image || m.is_indexed === false || sitelinks.length > 0)
          ? {
              seo_title: m.seo_title,
              seo_description: m.seo_description,
              og_image: m.og_image ?? null,
              is_indexed: m.is_indexed ?? true,
              sitelinks,
            }
          : null;

        cache.set(pathname, result);
        setOverride(result);
      });

    return () => { cancelled = true; };
  }, [pathname, rawPathname]);

  return override;
};
