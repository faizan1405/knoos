import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getProductImagePath } from "@/lib/image-storage";

/**
 * Serve product images from Hostinger persistent storage.
 *
 * GET /media/products/[filename]
 *
 * - Validates filename safety (rejects traversal, encoded tricks)
 * - Resolves path only within the product image directory
 * - Returns image with correct Content-Type
 * - Sets long cache headers (files have unique names, so immutable is safe)
 * - Never exposes directory listings
 */

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Resolve safely — rejects traversal, null bytes, encoded tricks
    const filePath = await getProductImagePath(filename);
    if (!filePath) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Read image bytes
    const buffer = await readFile(filePath);

    // Determine Content-Type from extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

// Disable POST/PUT/DELETE for this route
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
