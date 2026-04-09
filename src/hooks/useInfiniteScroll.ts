import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UseInfiniteScrollOptions {
  mobilePageSize?: number;
  desktopPageSize?: number;
}

export function useInfiniteScroll<T>(
  items: T[],
  options: UseInfiniteScrollOptions = {}
) {
  const { mobilePageSize = 4, desktopPageSize = 6 } = options;
  const isMobile = useIsMobile();
  const pageSize = isMobile ? mobilePageSize : desktopPageSize;

  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset when items or pageSize change
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [pageSize, items]);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );

  const hasMore = visibleCount < items.length;
  const currentPage = Math.ceil(visibleCount / pageSize);
  const totalPages = Math.ceil(items.length / pageSize);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
  }, [pageSize, items.length]);

  // IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return {
    visibleItems,
    sentinelRef,
    hasMore,
    currentPage,
    totalPages,
  };
}
