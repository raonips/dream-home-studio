import { useState, type ImgHTMLAttributes } from 'react';

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

const SafeImage = ({ fallbackSrc = '/placeholder.svg', onError, ...props }: SafeImageProps) => {
  const [errored, setErrored] = useState(false);

  return (
    <img
      loading="lazy"
      decoding="async"
      {...props}
      src={errored ? fallbackSrc : props.src}
      onError={(e) => {
        if (!errored) {
          setErrored(true);
          console.warn('[SafeImage] Failed to load:', props.src);
        }
        onError?.(e);
      }}
    />
  );
};

export default SafeImage;
