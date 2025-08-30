import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  blur?: boolean;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallback = '/placeholder.jpg',
  blur = true,
  priority = false,
  className,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>(fallback);
  const [isLoading, setIsLoading] = useState(!priority);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Use Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        // Start loading when image is 50px away from viewport
        rootMargin: '50px',
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Load image when in view
  useEffect(() => {
    if (!isInView) {return;}

    let isMounted = true;
    const img = new Image();

    img.onload = () => {
      if (isMounted) {
        setImageSrc(src);
        setIsLoading(false);
      }
    };

    img.onerror = () => {
      if (isMounted) {
        setImageSrc(fallback);
        setIsLoading(false);
      }
    };

    img.src = src;

    return () => {
      isMounted = false;
    };
  }, [src, fallback, isInView]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-all duration-300',
          isLoading && blur && 'blur-md scale-105',
          className
        )}
        loading={priority ? 'eager' : 'lazy'}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </div>
  );
};

// Preload critical images
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Batch preload multiple images
export const preloadImages = async (srcs: string[]): Promise<void> => {
  await Promise.all(srcs.map(src => preloadImage(src).catch(() => {})));
};
