"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

export type ImageSourceClassification =
  | { type: "local"; url: string }
  | { type: "cloudinary"; url: string }
  | { type: "legacy-remote"; url: string }
  | { type: "invalid" };

/**
 * Classifies an image source string:
 * - "local": relative or rooted path (e.g. /uploads/products/derby.jpg)
 * - "cloudinary": approved CDN (https://res.cloudinary.com/...)
 * - "legacy-remote": valid external HTTP/HTTPS URL from any other host
 * - "invalid": empty, non-string, malformed, or unsafe schemes (javascript:, data:, file:)
 */
export function classifyImageSource(src: unknown): ImageSourceClassification {
  if (typeof src !== "string") {
    if (src && typeof src === "object" && "src" in src && typeof (src as any).src === "string") {
      return classifyImageSource((src as any).src);
    }
    return { type: "invalid" };
  }

  const trimmed = src.trim();
  if (!trimmed) {
    return { type: "invalid" };
  }

  const lower = trimmed.toLowerCase();
  // Reject dangerous schemes immediately
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:") ||
    lower.startsWith("vbscript:")
  ) {
    return { type: "invalid" };
  }

  // Local path: starts with "/" (but not protocol-relative "//")
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return { type: "local", url: trimmed };
  }

  // Parse as absolute URL
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { type: "invalid" };
    }

    if (parsed.hostname.toLowerCase() === "res.cloudinary.com") {
      return { type: "cloudinary", url: trimmed };
    }

    return { type: "legacy-remote", url: trimmed };
  } catch {
    return { type: "invalid" };
  }
}

interface FallbackImageProps extends Omit<ImageProps, "onError"> {
  fallbackType?: "product" | "banner";
  fallbackClassName?: string;
}

export function FallbackImage({
  src,
  alt,
  className,
  fallbackType = "product",
  fallbackClassName,
  priority,
  fill,
  sizes,
  ...props
}: FallbackImageProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const classification = classifyImageSource(src);

  // If source is invalid or runtime load error occurred, render branded fallback
  if (classification.type === "invalid" || error) {
    if (fallbackType === "banner") {
      return (
        <div
          className={`absolute inset-0 w-full h-full bg-gradient-to-br from-brand-navy via-[#1e293b] to-brand-navy-dark flex items-center justify-center overflow-hidden ${fallbackClassName || ""}`}
          aria-label={alt}
        >
          {/* Subtle Decorative Geometric Accents */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-0 opacity-15 flex flex-col items-center select-none pointer-events-none">
            <svg
              className="w-36 h-36 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 17h20v2H2z" />
              <path d="M4 17c1-4 4-7 8-7h6c1 0 2 1 2 2v5" />
              <path d="M4 14c2-2 5-3 8-3" />
            </svg>
            <span className="font-serif tracking-widest text-2xl uppercase mt-2 text-white">KNOOS</span>
          </div>
        </div>
      );
    }

    // Default product fallback
    return (
      <div
        className={`w-full h-full bg-gradient-to-b from-brand-sky/30 to-brand-sky/10 flex flex-col items-center justify-center p-4 select-none ${fallbackClassName || ""}`}
        aria-label={alt}
      >
        <svg
          className="w-12 h-12 text-brand-blue/40 mb-2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 17h20v2H2z" />
          <path d="M4 17c1-4 4-7 8-7h6c1 0 2 1 2 2v5" />
          <path d="M4 14c2-2 5-3 8-3" />
        </svg>
        <span className="font-mono text-[10px] uppercase tracking-wider text-brand-gray-500 font-medium">
          KNOOS Footwear
        </span>
      </div>
    );
  }

  // Legacy remote image from external hostname (e.g. old Hostinger URLs):
  // Render via normal <img> to avoid Next/Image domain validation error throwing
  if (classification.type === "legacy-remote") {
    const imgStyle: React.CSSProperties = fill
      ? {
          position: "absolute",
          height: "100%",
          width: "100%",
          inset: 0,
          objectFit: (props.style?.objectFit as any) || "cover",
          ...props.style,
        }
      : { ...props.style };

    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={classification.url}
        alt={alt}
        className={className}
        width={props.width as number | undefined}
        height={props.height as number | undefined}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        style={imgStyle}
      />
    );
  }

  // Local or Cloudinary images: use Next/Image with optimization
  return (
    <Image
      src={classification.url}
      alt={alt}
      className={className}
      priority={priority}
      fill={fill}
      sizes={sizes}
      onError={() => setError(true)}
      {...props}
    />
  );
}
