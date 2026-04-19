import { Helmet } from 'react-helmet-async';
import { useSeoOverride } from '@/hooks/useSeoOverride';

/**
 * Global SEO component — placed once in the router (last child).
 *
 * Hierarchy:
 * - title / description: page Helmet → seo_overrides (last wins)
 * - og:image: 1) override.og_image  2) entity Helmet  3) global SiteHelmet
 * - robots: noindex when override.is_indexed === false
 * - sitelinks: injected as JSON-LD SiteNavigationElement when present
 */
const SeoHead = () => {
  const override = useSeoOverride();
  const robotsContent = override?.is_indexed === false ? 'noindex, nofollow' : 'index, follow';

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
      {override?.og_image && <meta property="og:image" content={override.og_image} />}
      {override?.og_image && <meta name="twitter:image" content={override.og_image} />}
      {override?.og_image && <meta name="twitter:card" content="summary_large_image" />}
      {ldJson && (
        <script type="application/ld+json">{ldJson}</script>
      )}
    </Helmet>
  );
};

export default SeoHead;
