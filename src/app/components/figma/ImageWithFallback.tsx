import * as React from "react";
import { cn } from "../ui/utils";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  fallbackClassName?: string;
}

const ImageWithFallback = React.forwardRef<HTMLImageElement, ImageWithFallbackProps>(
  ({ src, alt, fallback, fallbackClassName, className, onError, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setHasError(true);
      onError?.(e);
    };

    if (hasError || !src) {
      return (
        <div
          className={cn(
            "flex items-center justify-center bg-muted text-muted-foreground",
            fallbackClassName,
            className
          )}
        >
          {fallback || <span className="text-sm">{alt || "Image"}</span>}
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        onError={handleError}
        {...props}
      />
    );
  }
);
ImageWithFallback.displayName = "ImageWithFallback";

export { ImageWithFallback };
