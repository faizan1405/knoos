/**
 * Shared utility functions.
 */

/**
 * Generate a URL-friendly slug from a product name.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Strict positive integer quantity parser.
 * Accepts only integers >= 1 (e.g. 1, "1", 2, "2").
 * Rejects 0, negative numbers, floats (1.5, "1.5"), alphanumeric strings ("1abc", "abc"),
 * empty strings, null, undefined, NaN, and Infinity.
 */
export function parsePositiveIntegerQuantity(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  } else if (typeof value !== "number") {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 1) {
    return null;
  }
  return num;
}

