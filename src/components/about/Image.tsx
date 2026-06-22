import React from "react";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
}

export function Image({ src, alt, fill, priority, className, ...props }: ImageProps) {
  const styles: React.CSSProperties = fill
    ? {
        position: "absolute",
        height: "100%",
        width: "100%",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        objectFit: "cover",
      }
    : {};

  return (
    <img
      src={src}
      alt={alt}
      style={styles}
      className={className}
      loading={priority ? undefined : "lazy"}
      {...props}
    />
  );
}
