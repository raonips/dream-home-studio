import { Helmet } from 'react-helmet-async';
import { useSeoOverride } from '@/hooks/useSeoOverride';

/**
 * Global SEO component — placed once in the router.
 * If seo_overrides has data for the current pathname, it takes priority
 * over any page-level Helmet. Individual pages can still set their own
 * Helmet; react-helmet-async merges by priority (last wins for same tags).
 * Because this component renders conditionally, page-level Helmets
 * serve as the fallback automatically.
 */
const SeoHead = () => {
  const override = useSeoOverride();

  if (!override) return null;

  return (
    <Helmet>
      {override.seo_title && <title>{override.seo_title}</title>}
      {override.seo_title && <meta property="og:title" content={override.seo_title} />}
      {override.seo_description && <meta name="description" content={override.seo_description} />}
      {override.seo_description && <meta property="og:description" content={override.seo_description} />}
      {override.is_indexed === false && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
};

export default SeoHead;
