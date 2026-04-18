import { Helmet } from 'react-helmet-async';
import { useSeoOverride } from '@/hooks/useSeoOverride';

/**
 * Global SEO component — placed once in the router (last child).
 *
 * Hierarchy applied:
 * - title / description: page Helmet → seo_overrides (last wins)
 * - og:image: 1) seo_overrides.og_image  2) entity Helmet  3) global fallback (SiteHelmet)
 *   Because Helmet uses "last child wins", we only emit og:image here when the
 *   override defines it. Otherwise we let the page-level Helmet (entity image)
 *   or the SiteHelmet (global fallback) prevail.
 * - robots: always emitted; noindex when override.is_indexed === false.
 */
const SeoHead = () => {
  const override = useSeoOverride();
  const robotsContent = override?.is_indexed === false ? 'noindex, nofollow' : 'index, follow';

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
    </Helmet>
  );
};

export default SeoHead;
