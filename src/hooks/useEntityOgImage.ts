import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Level-2 OG image fallback: when the current route is a dynamic entity page
 * (property, local, guia post, condomínio, category), fetch its cover image.
 *
 * Returns null for static / non-entity routes, or when the entity has no image.
 * Result is cached per pathname to avoid repeated fetches.
 */
const cache = new Map<string, string | null>();

const firstString = (...candidates: (string | null | undefined)[]) =>
  candidates.find((c) => typeof c === 'string' && c.trim().length > 0) || null;

const detectEntity = (pathname: string): { table: string; slugCol: string; slug: string; cols: string } | null => {
  // /imoveis/:slug   (avoid known non-entity sub-paths)
  const imovel = pathname.match(/^\/imoveis\/([^/]+)\/?$/);
  if (imovel) {
    const slug = imovel[1];
    if (!['vendas', 'temporada', 'condominios', 'contato', 'listagem', 'busca', 'mapa'].includes(slug)) {
      return { table: 'properties', slugCol: 'slug', slug, cols: 'featured_image, image_url, thumbnail_url, images' };
    }
  }
  // /imoveis/condominios/:slug
  const condo = pathname.match(/^\/imoveis\/condominios\/([^/]+)\/?$/);
  if (condo) return { table: 'condominios', slugCol: 'slug', slug: condo[1], cols: 'featured_image, hero_image, thumbnail_url, images' };

  // /locais/:slug
  const local = pathname.match(/^\/locais\/([^/]+)\/?$/);
  if (local) return { table: 'locais', slugCol: 'slug', slug: local[1], cols: 'imagem_destaque, imagem_destaque_mobile, imagens' };

  // /guia/:categoriaSlug/:postSlug   → post
  const guiaPost = pathname.match(/^\/guia\/[^/]+\/([^/]+)\/?$/);
  if (guiaPost) return { table: 'guia_posts', slugCol: 'slug', slug: guiaPost[1], cols: 'imagem_destaque, imagem_destaque_mobile' };

  // /guia/categoria/:slug
  const guiaCat = pathname.match(/^\/guia\/categoria\/([^/]+)\/?$/);
  if (guiaCat) return { table: 'guia_categorias', slugCol: 'slug', slug: guiaCat[1], cols: 'imagem, imagem_mobile' };

  return null;
};

const extractImage = (table: string, row: any): string | null => {
  if (!row) return null;
  if (table === 'properties') {
    return firstString(row.featured_image, row.image_url, row.thumbnail_url, Array.isArray(row.images) ? row.images[0] : null);
  }
  if (table === 'condominios') {
    return firstString(row.featured_image, row.hero_image, row.thumbnail_url, Array.isArray(row.images) ? row.images[0] : null);
  }
  if (table === 'locais') {
    return firstString(row.imagem_destaque, row.imagem_destaque_mobile, Array.isArray(row.imagens) ? row.imagens[0] : null);
  }
  if (table === 'guia_posts') {
    return firstString(row.imagem_destaque, row.imagem_destaque_mobile);
  }
  if (table === 'guia_categorias') {
    return firstString(row.imagem, row.imagem_mobile);
  }
  return null;
};

export const useEntityOgImage = (pathname: string): string | null => {
  const [image, setImage] = useState<string | null>(cache.get(pathname) ?? null);

  useEffect(() => {
    if (cache.has(pathname)) {
      setImage(cache.get(pathname) ?? null);
      return;
    }

    const entity = detectEntity(pathname);
    if (!entity) {
      cache.set(pathname, null);
      setImage(null);
      return;
    }

    let cancelled = false;
    (supabase as any)
      .from(entity.table)
      .select(entity.cols)
      .eq(entity.slugCol, entity.slug)
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        if (cancelled) return;
        const url = extractImage(entity.table, data);
        cache.set(pathname, url);
        setImage(url);
      });

    return () => { cancelled = true; };
  }, [pathname]);

  return image;
};
