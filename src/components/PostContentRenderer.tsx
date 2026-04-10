import { memo } from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import LocalCardInPost from "@/components/LocalCardInPost";

interface PostContentRendererProps {
  html: string | null | undefined;
  className?: string;
}

const LOCAL_CARD_REGEX = /\[LOCAL_CARD:\s*([a-f0-9-]{36})\]/gi;

/**
 * Renders blog post HTML content, replacing [LOCAL_CARD: uuid] markers
 * with interactive LocalCardInPost components.
 */
const PostContentRenderer = memo(({ html, className }: PostContentRendererProps) => {
  if (!html) return null;

  const normalized = html
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00A0/g, " ");

  const clean = DOMPurify.sanitize(normalized, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["target", "style", "allow", "allowfullscreen", "frameborder"],
    FORBID_TAGS: ["script"],
  });

  // Check if content has any LOCAL_CARD markers
  if (!LOCAL_CARD_REGEX.test(clean)) {
    return (
      <div
        className={cn("safe-html-content prose prose-lg max-w-[75ch]", className)}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }

  // Reset regex lastIndex after test()
  LOCAL_CARD_REGEX.lastIndex = 0;

  // Split content by LOCAL_CARD markers
  const parts: { type: "html" | "local"; content: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = LOCAL_CARD_REGEX.exec(clean)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "html", content: clean.slice(lastIndex, match.index) });
    }
    parts.push({ type: "local", content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < clean.length) {
    parts.push({ type: "html", content: clean.slice(lastIndex) });
  }

  return (
    <div className={cn("safe-html-content prose prose-lg max-w-[75ch]", className)}>
      {parts.map((part, i) =>
        part.type === "local" ? (
          <LocalCardInPost key={`local-${part.content}`} localId={part.content} />
        ) : (
          <div key={i} dangerouslySetInnerHTML={{ __html: part.content }} />
        )
      )}
    </div>
  );
});

PostContentRenderer.displayName = "PostContentRenderer";

export default PostContentRenderer;
