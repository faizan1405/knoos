import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  isValidModerationStatus,
  syncIsActive,
  resolveModerationStatus,
  type ModerationStatus,
} from "@/lib/reviews";

/**
 * GET /api/admin/reviews
 * Query params:
 * - status: "PENDING" | "APPROVED" | "REJECTED" | "ALL" (default: "ALL")
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status")?.toUpperCase();

    const whereClause: any = {};
    if (statusParam && isValidModerationStatus(statusParam)) {
      whereClause.moderationStatus = statusParam;
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error("Error in admin GET /api/admin/reviews:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch reviews." }, { status: 500 });
  }
}

/**
 * PUT /api/admin/reviews
 * Admin moderation endpoint.
 * Accepts:
 * - { id, status: "PENDING" | "APPROVED" | "REJECTED" }
 * - OR { id, moderationStatus: "PENDING" | "APPROVED" | "REJECTED" }
 * - OR { id, isActive: boolean } (backward compatibility)
 */
export async function PUT(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, moderationStatus, isActive } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Review ID is required." }, { status: 400 });
    }

    const requestedStatus = status || moderationStatus;
    let targetModerationStatus: ModerationStatus;

    if (requestedStatus) {
      const upper = String(requestedStatus).toUpperCase();
      if (!isValidModerationStatus(upper)) {
        return NextResponse.json(
          { error: "Invalid moderation status. Must be PENDING, APPROVED, or REJECTED." },
          { status: 400 }
        );
      }
      targetModerationStatus = upper;
    } else if (typeof isActive === "boolean") {
      targetModerationStatus = isActive ? "APPROVED" : "PENDING";
    } else {
      return NextResponse.json(
        { error: "Must provide either status (PENDING, APPROVED, REJECTED) or isActive boolean." },
        { status: 400 }
      );
    }

    const syncedIsActive = syncIsActive(targetModerationStatus);

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        moderationStatus: targetModerationStatus,
        isActive: syncedIsActive,
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(updatedReview);
  } catch (error: any) {
    console.error("Error in admin PUT /api/admin/reviews:", error);
    return NextResponse.json({ error: error.message || "Failed to update review." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/reviews?id=...
 * Admin delete review.
 */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Review ID is required." }, { status: 400 });
    }

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Review deleted successfully." });
  } catch (error: any) {
    console.error("Error in admin DELETE /api/admin/reviews:", error);
    return NextResponse.json({ error: error.message || "Failed to delete review." }, { status: 500 });
  }
}
