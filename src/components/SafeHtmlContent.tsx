import { memo } from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

interface SafeHtmlContentProps {
  html: string | null | undefined;
  className?: string;
  /** Additional DOMPurify config */
  sanitizeConfig?: DOMPurify.Config;
}

/**
 * Normalizes HTML content by replacing non-breaking spaces (&nbsp; and \u00A0)
 * with regular spaces, sanitizes the HTML, and renders it with proper typography.
 */
const SafeHtmlContent = memo(({ html, className, sanitizeConfig }: SafeHtmlContentProps) => {
  if (!html) return null;

  const normalized = html
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00A0/g, " ");

  const clean = DOMPurify.sanitize(normalized, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["target", "style", "allow", "allowfullscreen", "frameborder"],
    FORBID_TAGS: ["script"],
    ...sanitizeConfig,
  });

  return (
    <div
      className={cn("safe-html-content prose prose-lg max-w-[75ch]", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
});

SafeHtmlContent.displayName = "SafeHtmlContent";

export default SafeHtmlContent;
