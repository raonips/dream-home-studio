const CondominioCardSkeleton = () => (
  <div className="bg-card rounded-xl overflow-hidden border border-border shadow-card">
    <div className="aspect-[16/9] bg-muted animate-pulse" />
    <div className="p-5 md:p-6 space-y-4">
      <div className="h-4 w-full bg-muted animate-pulse rounded" />
      <div className="h-4 w-4/5 bg-muted animate-pulse rounded" />
      <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
        <div className="h-6 w-24 bg-muted animate-pulse rounded-full" />
        <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
      </div>
      <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
    </div>
  </div>
);

export default CondominioCardSkeleton;
