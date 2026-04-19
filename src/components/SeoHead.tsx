import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useSeoOverride } from '@/hooks/useSeoOverride';
import { useEntityOgImage } from '@/hooks/useEntityOgImage';

/**
 * Global SEO component — placed once in the router (last child).
 *
 * og:image hierarchy (last wins via react-helmet-async):
 *   1. override.og_image  (from seo_overrides)        — highest priority
 *   2. entity featured image  (property/local/post/etc.)
 *   3. entity-page Helmet (e.g., a property page sets its own)
 *   4. global SiteHelmet og_image                     — lowest fallback
 *
 * SeoHead only injects og:image for levels 1 and 2; levels 3 and 4 keep
 * their existing tags untouched (we don't render a meta when neither
 * an override nor an entity image exists).
 */
const SeoHead = () => {
  const override = useSeoOverride();
  const location = useLocation();
  const entityImage = useEntityOgImage(location.pathname || '/');

  const robotsContent = override?.is_indexed === false ? 'noindex, nofollow' : 'index, follow';

  // Resolve the OG image (Level 1 → Level 2). Level 3/4 fall through naturally.
  const ogImage = override?.og_image || entityImage || null;

  const sitelinks = override?.sitelinks || [];
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const ldJson = sitelinks.length > 0
    ? JSON.stringify(
        sitelinks.map((s) => ({
          '@context': 'https://schema.org',
          '@type': 'SiteNavigationElement',
          name: s.title,
          url: s.url.startsWith('http') ? s.url : `${origin}${s.url.startsWith('/') ? '' : '/'}${s.url}`,
        })),
      )
    : null;

  return (
    <Helmet defer={false}>
      <meta name="robots" content={robotsContent} />
      {override?.seo_title && <title>{override.seo_title}</title>}
      {override?.seo_title && <meta property="og:title" content={override.seo_title} />}
      {override?.seo_description && <meta name="description" content={override.seo_description} />}
      {override?.seo_description && <meta property="og:description" content={override.seo_description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {ogImage && <meta name="twitter:card" content="summary_large_image" />}
      {ldJson && (
        <script type="application/ld+json">{ldJson}</script>
      )}
    </Helmet>
  );
};

export default SeoHead;
