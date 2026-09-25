/**
 * Color Swatch and Color Family Helpers for KNOOS Storefront
 *
 * Maps human-readable product colors to CSS-safe hex codes and styles.
 * If a color is unrecognized, safely falls back to a neutral swatch while
 * preserving the exact human-visible color name.
 */

export interface ColorSwatch {
  hex: string;
  isLight: boolean;
  isUnknown: boolean;
  label: string;
}

const COLOR_MAP: Record<string, { hex: string; isLight?: boolean }> = {
  // Monochromes
  black: { hex: "#18181b" },
  white: { hex: "#ffffff", isLight: true },
  "off white": { hex: "#fcfbf9", isLight: true },
  "off-white": { hex: "#fcfbf9", isLight: true },
  cream: { hex: "#fffdd0", isLight: true },
  ivory: { hex: "#fffff0", isLight: true },
  grey: { hex: "#6b7280" },
  gray: { hex: "#6b7280" },
  "light grey": { hex: "#9ca3af", isLight: true },
  "light gray": { hex: "#9ca3af", isLight: true },
  "dark grey": { hex: "#374151" },
  "dark gray": { hex: "#374151" },
  charcoal: { hex: "#27272a" },
  silver: { hex: "#c0c0c0", isLight: true },

  // Browns, Tans, Earth Tones (Core Footwear Colors)
  brown: { hex: "#5c3a21" },
  "dark brown": { hex: "#382214" },
  "light brown": { hex: "#82532f" },
  tan: { hex: "#c29b6c" },
  cognac: { hex: "#9e472a" },
  camel: { hex: "#c19a6b" },
  beige: { hex: "#f5f5dc", isLight: true },
  khaki: { hex: "#b5a382" },
  sand: { hex: "#d8cbb5", isLight: true },
  chocolate: { hex: "#432818" },
  coffee: { hex: "#4a3525" },
  chestnut: { hex: "#743a1d" },
  caramel: { hex: "#af6f35" },
  nude: { hex: "#e3bc9a", isLight: true },
  taupe: { hex: "#8b8589" },
  rust: { hex: "#b45309" },
  terracotta: { hex: "#c86d51" },

  // Blues & Navies
  navy: { hex: "#1e293b" },
  "navy blue": { hex: "#172554" },
  blue: { hex: "#2563eb" },
  "dark blue": { hex: "#1e3a8a" },
  "royal blue": { hex: "#1d4ed8" },
  "sky blue": { hex: "#38bdf8" },
  "light blue": { hex: "#7dd3fc", isLight: true },
  midnight: { hex: "#0f172a" },
  indigo: { hex: "#4338ca" },
  denim: { hex: "#3b82f6" },

  // Reds & Burgundy
  red: { hex: "#dc2626" },
  burgundy: { hex: "#800020" },
  maroon: { hex: "#7f1d1d" },
  wine: { hex: "#722f37" },
  crimson: { hex: "#991b1b" },
  ruby: { hex: "#9b111e" },
  cherry: { hex: "#be123c" },

  // Greens
  green: { hex: "#15803d" },
  "dark green": { hex: "#14532d" },
  olive: { hex: "#556b2f" },
  "olive green": { hex: "#556b2f" },
  sage: { hex: "#9ca986", isLight: true },
  emerald: { hex: "#059669" },
  forest: { hex: "#1b4d3e" },
  mint: { hex: "#86efac", isLight: true },

  // Yellows, Oranges, Pinks
  pink: { hex: "#ec4899" },
  rose: { hex: "#f43f5e" },
  blush: { hex: "#fbcfe8", isLight: true },
  salmon: { hex: "#fa8072" },
  coral: { hex: "#f87171" },
  peach: { hex: "#fed7aa", isLight: true },
  orange: { hex: "#ea580c" },
  yellow: { hex: "#eab308" },
  mustard: { hex: "#d97706" },
  gold: { hex: "#d4af37" },
  bronze: { hex: "#cd7f32" },
  copper: { hex: "#b87333" },

  // Purples
  purple: { hex: "#7e22ce" },
  lavender: { hex: "#c4b5fd", isLight: true },
  plum: { hex: "#581c87" },
  violet: { hex: "#6d28d9" },
};

/**
 * Format raw color strings (e.g. "dark_brown" or "BLACK") into Title Case.
 */
export function formatColorLabel(rawColor: string | null | undefined): string {
  if (!rawColor) return "";
  return rawColor
    .split("__")
    .map((segment) =>
      segment
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
    )
    .join(" / ");
}

/**
 * Retrieve swatch color hex, light/dark contrast flag, and human-visible label.
 * If the color name is unknown, returns a neutral swatch without altering the label.
 */
export function getColorSwatch(rawColor: string | null | undefined): ColorSwatch {
  const label = formatColorLabel(rawColor);
  if (!rawColor || !rawColor.trim()) {
    return {
      hex: "#9ca3af",
      isLight: false,
      isUnknown: true,
      label: label || "Standard",
    };
  }

  const normalized = rawColor
    .toLowerCase()
    .trim()
    .replace(/[_\s-]+/g, " ");

  // Direct match
  if (COLOR_MAP[normalized]) {
    const match = COLOR_MAP[normalized];
    return {
      hex: match.hex,
      isLight: !!match.isLight,
      isUnknown: false,
      label,
    };
  }

  // Match whole words for compound color names (e.g. "cognac brown" or "classic black")
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (COLOR_MAP[word]) {
      const match = COLOR_MAP[word];
      return {
        hex: match.hex,
        isLight: !!match.isLight,
        isUnknown: false,
        label,
      };
    }
  }

  // Safe fallback: neutral mid-tone swatch, keep original human label
  return {
    hex: "#9ca3af",
    isLight: false,
    isUnknown: true,
    label,
  };
}
