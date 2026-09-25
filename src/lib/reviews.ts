import { z } from "zod";

export const MODERATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export function isValidModerationStatus(status: unknown): status is ModerationStatus {
  return typeof status === "string" && MODERATION_STATUSES.includes(status as ModerationStatus);
}

/**
 * Ensures backward-compatible synchronization with legacy boolean `isActive`:
 * APPROVED => isActive = true
 * PENDING  => isActive = false
 * REJECTED => isActive = false
 */
export function syncIsActive(status: ModerationStatus): boolean {
  return status === "APPROVED";
}

/**
 * Converts legacy or alternative status representation into authoritative ModerationStatus.
 */
export function resolveModerationStatus(
  explicitStatus?: unknown,
  legacyIsActive?: unknown
): ModerationStatus {
  if (isValidModerationStatus(explicitStatus)) {
    return explicitStatus;
  }
  if (typeof legacyIsActive === "boolean") {
    return legacyIsActive ? "APPROVED" : "PENDING";
  }
  return "PENDING";
}

/**
 * Public review structure exposed to storefront/carousel.
 * Internal IDs, emails, and moderation notes are strictly excluded.
 */
export interface PublicReview {
  id: string;
  displayName: string;
  rating: number;
  reviewText: string;
  customerPhotoUrl?: string | null;
  productPhotoUrl?: string | null;
  createdAt: string;
}

/**
 * Admin review structure with moderation metadata and relation information.
 */
export interface AdminReview {
  id: string;
  productId: string;
  userId: string | null;
  displayName: string;
  rating: number;
  reviewText: string;
  moderationStatus: ModerationStatus;
  customerPhotoUrl?: string | null;
  productPhotoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product?: {
    id?: string;
    name: string;
    slug: string;
  };
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

/**
 * Validates external or stored photo URL.
 * Prohibits unsafe schemes (javascript:, data:), SVGs (XSS risk), and limits max length to 500.
 */
const safePhotoUrlSchema = z
  .string()
  .trim()
  .max(500, "Image URL exceeds 500 characters")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return false;
        }
        // Reject SVG extension or MIME to prevent XSS
        const pathname = parsed.pathname.toLowerCase();
        if (pathname.endsWith(".svg")) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    },
    { message: "Must be a valid HTTP or HTTPS image URL (SVGs are not permitted)" }
  );

/**
 * Validation schema for customer review submission.
 */
export const createReviewSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  reviewText: z
    .string()
    .trim()
    .min(1, "Review text cannot be empty")
    .max(2000, "Review text cannot exceed 2000 characters"),
  customerPhotoUrl: z.union([safePhotoUrlSchema, z.literal(""), z.null()]).optional(),
  productPhotoUrl: z.union([safePhotoUrlSchema, z.literal(""), z.null()]).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
