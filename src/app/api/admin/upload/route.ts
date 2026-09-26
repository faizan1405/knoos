import { requireAdmin } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";
import { uploadProductImage, validateImageFile } from "@/lib/image-storage";

export async function POST(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded", code: "NO_FILE_UPLOADED" },
        { status: 400 }
      );
    }

    // Pre-validate before attempting upload
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: validation.code },
        { status: 400 }
      );
    }

    const uploadResult = await uploadProductImage(file);
    if (!uploadResult.success) {
      const status = uploadResult.code === "IMAGE_STORAGE_NOT_CONFIGURED" ? 503 : 400;
      return NextResponse.json(
        { error: uploadResult.error, code: uploadResult.code },
        { status }
      );
    }

    return NextResponse.json({
      url: uploadResult.url,
      filename: uploadResult.publicId,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload image", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// Disable GET for this route
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
