/**
 * KNOOS Phase 4: Review Photo Storage Abstraction
 * 
 * ============================================================================
 * CRITICAL ARCHITECTURAL REQUIREMENT: DURABLE STORAGE
 * ============================================================================
 * In production/managed deployments, writing customer uploads to local disk
 * (such as `public/uploads/...`) is ephemeral and files will be erased or lost
 * across redeployments, dyno restarts, or container scaling.
 * 
 * Therefore, customer-uploaded review photos MUST use a durable storage provider
 * (e.g., AWS S3, Cloudinary, Cloudflare R2, Uploadthing).
 * 
 * Currently, NO durable storage credentials or providers are configured in the
 * project environment. Per specification:
 * - We DO NOT invent credentials.
 * - We DO NOT choose fake URLs.
 * - We DO NOT silently use local filesystem storage.
 * - The actual file-upload portion is marked: DURABLE REVIEW IMAGE STORAGE REQUIRED.
 * 
 * This module defines the pluggable storage provider interface and boundary,
 * allowing any S3/Cloudinary/R2 adapter to be connected cleanly without modifying
 * database schemas, review APIs, or review presentation components.
 */

export const DURABLE_STORAGE_REQUIRED_MESSAGE =
  "DURABLE REVIEW IMAGE STORAGE REQUIRED: No durable cloud storage provider (e.g. AWS S3, Cloudinary, Cloudflare R2) is currently configured. Direct file uploads are disabled until durable storage credentials are provided.";

export interface ReviewImagePayload {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ReviewStorageResult {
  url: string;
  provider: string;
  key?: string;
}

export interface ReviewStorageProvider {
  name: string;
  isAvailable(): boolean;
  uploadImage(payload: ReviewImagePayload): Promise<ReviewStorageResult>;
}

// Allowed image types for user review uploads. SVGs are explicitly excluded to prevent stored XSS attacks.
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_REVIEW_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates review image file metadata before any processing or upload.
 */
export function validateReviewImageFile(mimeType: string, sizeBytes: number): { valid: boolean; error?: string } {
  if (!mimeType || !ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as any)) {
    return {
      valid: false,
      error: `Invalid file format (${mimeType || "unknown"}). Allowed formats: JPG, PNG, WebP, AVIF. SVG is strictly prohibited.`,
    };
  }

  if (sizeBytes > MAX_REVIEW_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of 5MB.`,
    };
  }

  return { valid: true };
}

/**
 * Registry of storage providers. Can be extended when credentials become available.
 */
let activeProvider: ReviewStorageProvider | null = null;

export function registerReviewStorageProvider(provider: ReviewStorageProvider) {
  activeProvider = provider;
}

/**
 * Returns true if a valid durable storage provider is actively configured.
 */
export function isDurableReviewStorageConfigured(): boolean {
  return activeProvider !== null && activeProvider.isAvailable();
}

/**
 * Attempts to upload a review image through the configured durable storage provider.
 * Throws a clean descriptive error if durable storage is not yet configured.
 */
export async function uploadReviewImage(payload: ReviewImagePayload): Promise<ReviewStorageResult> {
  const validation = validateReviewImageFile(payload.mimeType, payload.sizeBytes);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!isDurableReviewStorageConfigured() || !activeProvider) {
    throw new Error(DURABLE_STORAGE_REQUIRED_MESSAGE);
  }

  return activeProvider.uploadImage(payload);
}
