import { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Status semáforo para o ícone de OG Image na tabela do SEO PRO.
 *
 * Verde   → OG image customizada na hierarquia 1 (override).
 * Âmbar   → Sem custom, mas a rota é de entidade e tem foto de capa (hierarquia 2).
 * Cinza   → Depende do fallback global (hierarquia 3).
 *
 * A detecção da hierarquia 2 é feita por linha (lazy) com cache por path,
 * evitando uma query N+1 no carregamento da tabela.
 */

type Detected = { table: string; slugCol: string; slug: string; cols: string; pickCol: string } | null;

const cache = new Map<string, boolean>();

const detectEntity = (path: string): Detected => {
  // /imoveis/venda/:slug  OR  /imoveis/temporada/:slug
  const imovel = path.match(/^\/imoveis\/(?:venda|temporada)\/([^/]+)\/?$/);
  if (imovel) {
    return {
      table: 'properties', slugCol: 'slug', slug: imovel[1],
      cols: 'featured_image, image_url, thumbnail_url, images',
      pickCol: 'mixed',
    };
  }
  // /imoveis/condominio/:slug  OR  /imoveis/condominios/:slug
  const condo = path.match(/^\/imoveis\/condominios?\/([^/]+)\/?$/);
  if (condo) {
    return {
      table: 'condominios', slugCol: 'slug', slug: condo[1],
      cols: 'featured_image, hero_image, thumbnail_url, images',
      pickCol: 'mixed',
    };
  }
  // /locais/:slug
  const local = path.match(/^\/locais\/([^/]+)\/?$/);
  if (local) {
    return {
      table: 'locais', slugCol: 'slug', slug: local[1],
      cols: 'imagem_destaque, imagem_destaque_mobile, imagens',
      pickCol: 'mixed',
    };
  }
  // /guia/categoria/:slug
  const guiaCat = path.match(/^\/guia\/categoria\/([^/]+)\/?$/);
  if (guiaCat) {
    return {
      table: 'guia_categorias', slugCol: 'slug', slug: guiaCat[1],
      cols: 'imagem, imagem_mobile',
      pickCol: 'mixed',
    };
  }
  // /guia/:cat/:post  →  post
  const guiaPost = path.match(/^\/guia\/[^/]+\/([^/]+)\/?$/);
  if (guiaPost) {
    return {
      table: 'guia_posts', slugCol: 'slug', slug: guiaPost[1],
      cols: 'imagem_destaque, imagem_destaque_mobile',
      pickCol: 'mixed',
    };
  }
  // posts servidos no root /:slug — registros listados como source 'Post'
  // (cobre o uso atual em AdminSeoPro, onde posts ficam em `/${slug}`)
  const rootPost = path.match(/^\/([^/]+)\/?$/);
  if (rootPost) {
    return {
      table: 'guia_posts', slugCol: 'slug', slug: rootPost[1],
      cols: 'imagem_destaque, imagem_destaque_mobile',
      pickCol: 'mixed',
    };
  }
  return null;
};

const hasImage = (table: string, row: any): boolean => {
  if (!row) return false;
  const candidates: any[] = [];
  if (table === 'properties') candidates.push(row.featured_image, row.image_url, row.thumbnail_url, ...(Array.isArray(row.images) ? row.images : []));
  else if (table === 'condominios') candidates.push(row.featured_image, row.hero_image, row.thumbnail_url, ...(Array.isArray(row.images) ? row.images : []));
  else if (table === 'locais') candidates.push(row.imagem_destaque, row.imagem_destaque_mobile, ...(Array.isArray(row.imagens) ? row.imagens : []));
  else if (table === 'guia_posts') candidates.push(row.imagem_destaque, row.imagem_destaque_mobile);
  else if (table === 'guia_categorias') candidates.push(row.imagem, row.imagem_mobile);
  return candidates.some((c) => typeof c === 'string' && c.trim().length > 0);
};

interface Props {
  path: string;
  hasCustomOg: boolean;
  /** When true, the row is a non-entity static page → never show amber. */
  isStaticOnly?: boolean;
}

const OgImageStatusIcon = ({ path, hasCustomOg, isStaticOnly }: Props) => {
  const [entityHasImage, setEntityHasImage] = useState<boolean | null>(
    cache.has(path) ? cache.get(path)! : null,
  );

  useEffect(() => {
    if (hasCustomOg || isStaticOnly) return; // não precisamos consultar — já é verde ou sempre cinza
    if (cache.has(path)) {
      setEntityHasImage(cache.get(path)!);
      return;
    }
    const entity = detectEntity(path);
    if (!entity) {
      cache.set(path, false);
      setEntityHasImage(false);
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
        const ok = hasImage(entity.table, data);
        cache.set(path, ok);
        setEntityHasImage(ok);
      });
    return () => { cancelled = true; };
  }, [path, hasCustomOg, isStaticOnly]);

  let color = 'text-muted-foreground/40';
  let label = 'Fallback global (hierarquia 3)';
  if (hasCustomOg) {
    color = 'text-emerald-600';
    label = 'OG image customizada (hierarquia 1)';
  } else if (!isStaticOnly && entityHasImage) {
    color = 'text-amber-500';
    label = 'Imagem da entidade (hierarquia 2)';
  }

  return <ImageIcon className={`h-4 w-4 ${color}`} aria-label={label} title={label} />;
};

export default OgImageStatusIcon;
