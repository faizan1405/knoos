import { requireAdmin } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";
import { validateImageFile, saveProductImage } from "@/lib/image-storage";

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

    // Validate file type and size
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: validation.code },
        { status: 400 }
      );
    }

    // Upload to Hostinger persistent storage
    const result = await saveProductImage({
      arrayBuffer: () => file.arrayBuffer(),
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!result.success) {
      const status = result.code === "HOSTINGER_STORAGE_NOT_AVAILABLE" ? 503 : 400;
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status }
      );
    }

    return NextResponse.json({
      url: result.url,
      filename: result.filename,
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
