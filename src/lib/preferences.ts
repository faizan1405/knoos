/**
 * KNOOS Customer Preferences Constants & Types.
 * "Let Us Know" shopping preferences: Gender and Shoe Size.
 *
 * Current catalog footwear sizing: UK 4 through UK 10.
 * Internal storage format: "4", "5", "6", "7", "8", "9", "10"
 * (matches ProductVariant.size values in catalog).
 * Display format: "UK 4", "UK 5", etc.
 */

export const ALLOWED_GENDER_PREFERENCES = [
  "Men",
  "Women",
  "Prefer not to say",
] as const;

export type GenderPreference = (typeof ALLOWED_GENDER_PREFERENCES)[number];

export const ALLOWED_SHOE_SIZES = [
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
] as const;

export type ShoeSizePreference = (typeof ALLOWED_SHOE_SIZES)[number];

export interface ShoeSizeOption {
  value: ShoeSizePreference;
  label: string;
}

export const SHOE_SIZE_OPTIONS: readonly ShoeSizeOption[] = [
  { value: "4", label: "UK 4" },
  { value: "5", label: "UK 5" },
  { value: "6", label: "UK 6" },
  { value: "7", label: "UK 7" },
  { value: "8", label: "UK 8" },
  { value: "9", label: "UK 9" },
  { value: "10", label: "UK 10" },
];

/**
 * Returns user-friendly display label for a stored shoe size.
 * E.g., "7" -> "UK 7".
 */
export function formatShoeSizeDisplay(size: string | null | undefined): string {
  if (!size) return "";
  const match = SHOE_SIZE_OPTIONS.find((opt) => opt.value === size);
  if (match) return match.label;
  if (size.startsWith("UK")) return size;
  return `UK ${size}`;
}
