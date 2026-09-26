"use client";

import Link from "next/link";
import Image from "next/image";
import { getColorSwatch } from "@/lib/colors";

export interface ColorSibling {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  status?: string;
  price?: number;
  salePrice?: number | null;
  images?: { id: string; imageUrl: string }[];
}

interface ColorSelectorProps {
  currentProductId: string;
  currentColor: string | null;
  siblings?: ColorSibling[];
}

export function ColorSelector({
  currentProductId,
  currentColor,
  siblings = [],
}: ColorSelectorProps) {
  // If there are no sibling color options or only 1 product in the group
  if (siblings.length <= 1) {
    if (!currentColor) return null;
    const swatch = getColorSwatch(currentColor);

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-dark font-semibold">
            Color:
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-3.5 h-3.5 rounded-full ${
                swatch.isLight ? "border border-black/20" : ""
              }`}
              style={{ backgroundColor: swatch.hex }}
              aria-hidden="true"
            />
            <span className="font-mono text-xs tracking-wider text-brand-dark font-medium capitalize">
              {swatch.label}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Active color label for display in the header
  const currentOption = siblings.find((s) => s.id === currentProductId);
  const activeColorLabel = getColorSwatch(currentOption?.color ?? currentColor).label;

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-dark font-semibold">
            Color:
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-brand-gray-700 font-medium">
            {activeColorLabel}
          </span>
        </div>
        <span className="font-mono text-[11px] text-brand-gray-400">
          {siblings.length} colors
        </span>
      </div>

      {/* Swatch List: Horizontally swipeable on mobile, wrapping row on desktop */}
      <div
        className="flex items-center gap-2.5 overflow-x-auto snap-x snap-proximity touch-pan-x hide-scrollbar py-1 px-0.5 sm:flex-wrap sm:overflow-visible"
        role="radiogroup"
        aria-label="Color options"
      >
        {siblings.map((sibling) => {
          const isSelected = sibling.id === currentProductId;
          const swatch = getColorSwatch(sibling.color);
          const firstImage = sibling.images?.[0]?.imageUrl;

          return (
            <Link
              key={sibling.id}
              href={`/product/${sibling.slug}`}
              prefetch={true}
              role="radio"
              aria-checked={isSelected}
              aria-current={isSelected ? "page" : undefined}
              aria-label={`${swatch.label}${isSelected ? " (Selected)" : ""}`}
              className={`
                snap-start flex-shrink-0 group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2
                ${
                  isSelected
                    ? "border-brand-navy bg-brand-sky/25 ring-1 ring-brand-navy shadow-xs"
                    : "border-brand-gray-200 bg-white hover:border-brand-navy/50 hover:bg-brand-sky/10"
                }
              `}
            >
              {/* Optional tiny product thumbnail */}
              {firstImage ? (
                <div className="relative w-8 h-8 rounded-md overflow-hidden bg-brand-sky/20 flex-shrink-0 border border-brand-sky-border/40">
                  <Image
                    src={firstImage}
                    alt={sibling.name || swatch.label}
                    fill
                    sizes="32px"
                    className="object-contain p-0.5"
                  />
                </div>
              ) : null}

              {/* Color swatch dot */}
              <span
                className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${
                  swatch.isLight ? "border border-black/20" : ""
                }`}
                style={{ backgroundColor: swatch.hex }}
                aria-hidden="true"
              />

              {/* Human-readable color label */}
              <span
                className={`font-mono text-xs tracking-wide capitalize ${
                  isSelected
                    ? "text-brand-dark font-semibold"
                    : "text-brand-gray-600 group-hover:text-brand-dark"
                }`}
              >
                {swatch.label}
              </span>

              {isSelected && <span className="sr-only">(Selected)</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
