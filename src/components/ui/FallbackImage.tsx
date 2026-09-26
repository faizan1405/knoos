"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

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
  ...props
}: FallbackImageProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  // If no source or runtime load error occurred, render branded fallback
  if (!src || error) {
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

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}
