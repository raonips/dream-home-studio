import { useEffect, useState, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';
import BlockItemErrorBoundary from '@/components/admin/BlockItemErrorBoundary';

interface Props {
  pageSlug: string;
}

interface BlockData {
  id: string;
  html_content: string;
  title?: string;
}

const SafeBlockContent = memo(({ block }: { block: BlockData }) => {
  const clean = DOMPurify.sanitize(block.html_content || '', {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['target', 'style', 'allow', 'allowfullscreen', 'frameborder'],
    FORBID_TAGS: ['script'],
  });

  return (
    <div
      className="global-block-content"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
});
SafeBlockContent.displayName = 'SafeBlockContent';

const GlobalBlocks = ({ pageSlug }: Props) => {
  const [blocks, setBlocks] = useState<BlockData[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchBlocks = async () => {
      try {
        console.log('[GlobalBlocks] Fetching blocks for page:', pageSlug);
        const { data, error } = await supabase
          .from('global_blocks')
          .select('id, html_content, target_pages, title')
          .eq('is_active', true);

        if (cancelled) return;

        if (error) {
          console.error('[GlobalBlocks] Fetch error:', error.code, error.message);
          return;
        }

        const filtered = (data ?? []).filter(
          (b: any) =>
            b.target_pages?.includes('todas') || b.target_pages?.includes(pageSlug)
        );
        console.log('[GlobalBlocks] Rendering', filtered.length, 'blocks');
        setBlocks(filtered);
      } catch (err) {
        console.error('[GlobalBlocks] Unexpected error:', err);
      }
    };

    fetchBlocks();
    return () => { cancelled = true; };
  }, [pageSlug]);

  if (blocks.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      <div className="container space-y-6">
        {blocks.map((block) => (
          <BlockItemErrorBoundary key={block.id} blockTitle={block.title}>
            <SafeBlockContent block={block} />
          </BlockItemErrorBoundary>
        ))}
      </div>
    </section>
  );
};

export default GlobalBlocks;
