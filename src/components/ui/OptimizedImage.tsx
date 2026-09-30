import React, { useState } from "react";

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  aspectRatio?: string;
  sizes?: string;
  containerClassName?: string;
}

/**
 * Builds responsive srcset for local images in /images/news, /images/services, /about, etc.
 */
function getResponsiveSrcSet(src: string): { webpSrcSet?: string; fallbackSrc: string } {
  if (!src || src.startsWith("http") || src.startsWith("data:")) {
    return { fallbackSrc: src };
  }

  // Strip extension
  const extMatch = src.match(/\.(webp|jpg|jpeg|png)$/i);
  if (!extMatch) {
    return { fallbackSrc: src };
  }

  const ext = extMatch[1].toLowerCase();
  const basePath = src.replace(/\.(webp|jpg|jpeg|png)$/i, "");

  // If this is a known responsive path, generate srcset
  const isResponsiveTarget =
    src.includes("/images/") ||
    src.includes("/assets/") ||
    src.includes("/about/") ||
    src.includes("placeholder");

  if (isResponsiveTarget) {
    const webpSrcSet = `${basePath}-320w.webp 320w, ${basePath}-640w.webp 640w, ${basePath}-960w.webp 960w, ${basePath}.webp 1280w`;
    const fallbackSrc = ext === "webp" ? `${basePath}.jpg` : src;
    return { webpSrcSet, fallbackSrc };
  }

  // Standard webp swap if available
  const webpSrc = `${basePath}.webp`;
  return { webpSrcSet: `${webpSrc} 1x`, fallbackSrc: src };
}

export function OptimizedImage({
  src,
  alt,
  priority = false,
  aspectRatio,
  sizes = "(max-width: 768px) 100vw, 50vw",
  className = "",
  containerClassName = "",
  width,
  height,
  style,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const { webpSrcSet, fallbackSrc } = getResponsiveSrcSet(src);

  // Tiny blur placeholder path
  const blurSrc = src && !src.startsWith("http") && !src.startsWith("data:")
    ? `${src.replace(/\.(webp|jpg|jpeg|png)$/i, "")}-blur.webp`
    : undefined;

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={{
        aspectRatio: aspectRatio,
        ...(aspectRatio ? { width: width || "100%" } : {}),
      }}
    >
      {/* CSS Shimmer / Blur Placeholder before load */}
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-stone-100 dark:bg-stone-800 animate-pulse pointer-events-none transition-opacity duration-300 z-0"
          style={{
            backgroundImage: blurSrc ? `url(${blurSrc})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(10px)",
            transform: "scale(1.1)",
          }}
        />
      )}

      <picture className="w-full h-full">
        {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}
        <img
          src={fallbackSrc || src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          width={width}
          height={height}
          onLoad={() => setLoaded(true)}
          className={`relative z-10 transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          style={{
            ...style,
            ...(aspectRatio ? { aspectRatio } : {}),
          }}
          {...props}
        />
      </picture>
    </div>
  );
}
