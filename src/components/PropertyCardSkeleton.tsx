const PropertyCardSkeleton = () => (
  <div className="bg-card rounded-xl overflow-hidden shadow-card border border-border min-h-[420px]">
    <div className="aspect-[4/3] bg-muted animate-pulse" />
    <div className="p-5 space-y-3">
      <div className="h-6 w-2/3 bg-muted animate-pulse rounded" />
      <div className="h-5 w-4/5 bg-muted animate-pulse rounded" />
      <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
      <div className="flex items-center gap-4 border-t border-border pt-4">
        <div className="h-4 w-10 bg-muted animate-pulse rounded" />
        <div className="h-4 w-10 bg-muted animate-pulse rounded" />
        <div className="h-4 w-10 bg-muted animate-pulse rounded" />
        <div className="h-4 w-14 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex gap-3 pt-1">
        <div className="flex-1 h-10 bg-muted animate-pulse rounded-lg" />
        <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  </div>
);

export default PropertyCardSkeleton;
