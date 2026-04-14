import { useState, type ImgHTMLAttributes } from 'react';

interface ResponsiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  mobileSrc?: string | null;
  fallbackSrc?: string;
}

/**
 * Renders a <picture> element with mobile srcSet when mobileSrc is available,
 * falling back to a plain <img> otherwise. Includes error handling like SafeImage.
 */
const ResponsiveImage = ({
  src,
  mobileSrc,
  fallbackSrc = '/placeholder.svg',
  onError,
  ...props
}: ResponsiveImageProps) => {
  const [errored, setErrored] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!errored) {
      setErrored(true);
      console.warn('[ResponsiveImage] Failed to load:', src);
    }
    onError?.(e);
  };

  const imgSrc = errored ? fallbackSrc : src;

  if (mobileSrc && !errored) {
    return (
      <picture>
        <source media="(max-width: 800px)" srcSet={mobileSrc} />
        <img {...props} src={imgSrc} onError={handleError} />
      </picture>
    );
  }

  return <img {...props} src={imgSrc} onError={handleError} />;
};

export default ResponsiveImage;
