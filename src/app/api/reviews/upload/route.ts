import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  isDurableReviewStorageConfigured,
  uploadReviewImage,
  validateReviewImageFile,
  DURABLE_STORAGE_REQUIRED_MESSAGE,
} from "@/lib/review-storage";

/**
 * POST /api/reviews/upload
 * Boundary endpoint for customer review photo uploads.
 * 
 * In accordance with Phase 4 architecture requirements:
 * If NO durable storage provider is configured in the environment,
 * local ephemeral filesystem storage (/public/uploads) is strictly forbidden.
 * 
 * The endpoint cleanly reports DURABLE REVIEW IMAGE STORAGE REQUIRED until
 * an S3/Cloudinary/R2 provider is connected.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  // Check if durable storage provider is configured
  if (!isDurableReviewStorageConfigured()) {
    return NextResponse.json(
      {
        error: DURABLE_STORAGE_REQUIRED_MESSAGE,
        durableStorageConfigured: false,
      },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const validation = validateReviewImageFile(file.type, file.size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadReviewImage({
      buffer,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });

    return NextResponse.json({ url: result.url, provider: result.provider });
  } catch (error: any) {
    console.error("Error processing review photo upload:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image." },
      { status: 500 }
    );
  }
}
