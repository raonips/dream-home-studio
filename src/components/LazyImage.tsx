import { forwardRef, useState, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  eager?: boolean;
}

const LazyImage = forwardRef<HTMLDivElement, LazyImageProps>(
  ({ fallbackSrc = '/placeholder.svg', className, onLoad, onError, eager = false, ...props }, ref) => {
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);

    return (
      <div ref={ref} className={cn("relative overflow-hidden", className)}>
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
        <img
          width={props.width ?? 800}
          height={props.height ?? 600}
          {...props}
          src={errored ? fallbackSrc : props.src}
          loading={eager ? "eager" : "lazy"}
          decoding={eager ? "sync" : "async"}
          {...(eager ? { fetchPriority: "high" as const } : {})}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={(e) => {
            setLoaded(true);
            onLoad?.(e);
          }}
          onError={(e) => {
            if (!errored) {
              setErrored(true);
            }
            setLoaded(true);
            onError?.(e);
          }}
        />
      </div>
    );
  }
);

LazyImage.displayName = 'LazyImage';

export default LazyImage;
