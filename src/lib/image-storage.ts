import crypto from "node:crypto";

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export function getCloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() !== null;
}

export function validateImageFile(file: { size: number; type: string }): {
  valid: boolean;
  error?: string;
  code?: string;
} {
  const normalizedType = file.type.toLowerCase().trim();
  if (!ALLOWED_IMAGE_TYPES.has(normalizedType)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPG, PNG, and WEBP are allowed.",
      code: "INVALID_FILE_TYPE",
    };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return {
      valid: false,
      error: "File size too large. Maximum 5MB allowed.",
      code: "FILE_TOO_LARGE",
    };
  }

  return { valid: true };
}

export function generateSafePublicId(originalFileName: string): string {
  const sanitized = originalFileName
    .replace(/\.[^/.]+$/, "") // strip extension
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 50);

  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString("hex");
  return sanitized ? `${timestamp}_${sanitized}_${randomSuffix}` : `${timestamp}_${randomSuffix}`;
}

export function generateCloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  // Sort parameters alphabetically by key
  const sortedKeys = Object.keys(params).sort();
  const serialized = sortedKeys.map((key) => `${key}=${params[key]}`).join("&");
  const stringToSign = `${serialized}${apiSecret}`;

  return crypto.createHash("sha1").update(stringToSign).digest("hex");
}

export type ImageUploadResult =
  | { success: true; url: string; publicId: string }
  | { success: false; error: string; code: string };

export async function uploadProductImage(file: {
  arrayBuffer: () => Promise<ArrayBuffer>;
  name: string;
  size: number;
  type: string;
}): Promise<ImageUploadResult> {
  const config = getCloudinaryConfig();
  if (!config) {
    return {
      success: false,
      error: "Permanent image storage is not configured yet.",
      code: "IMAGE_STORAGE_NOT_CONFIGURED",
    };
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || "Invalid file.",
      code: validation.code || "VALIDATION_FAILED",
    };
  }

  const folder = "knoos/products";
  const publicId = generateSafePublicId(file.name || "product_image");
  const timestamp = Math.floor(Date.now() / 1000);

  const signatureParams: Record<string, string | number> = {
    folder,
    public_id: publicId,
    timestamp,
  };

  const signature = generateCloudinarySignature(signatureParams, config.apiSecret);

  try {
    const fileBytes = await file.arrayBuffer();
    const blob = new Blob([fileBytes], { type: file.type });

    const formData = new FormData();
    formData.append("file", blob, file.name || "image");
    formData.append("api_key", config.apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("folder", folder);
    formData.append("public_id", publicId);
    formData.append("signature", signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.secure_url) {
      console.error("[CLOUDINARY_UPLOAD_ERROR]", data);
      return {
        success: false,
        error: data?.error?.message || "Failed to upload image to durable storage.",
        code: "UPLOAD_FAILED",
      };
    }

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id || publicId,
    };
  } catch (error) {
    console.error("[CLOUDINARY_NETWORK_ERROR]", error);
    return {
      success: false,
      error: "Network error while uploading image to storage.",
      code: "NETWORK_ERROR",
    };
  }
}
