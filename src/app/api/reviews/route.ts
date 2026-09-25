import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createReviewSchema } from "@/lib/reviews";

/**
 * GET /api/reviews?productId=...
 * Public endpoint: returns only APPROVED reviews for a product.
 * Sensitive customer/internal details are never leaked.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId query parameter is required." }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        moderationStatus: "APPROVED",
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        displayName: true,
        rating: true,
        reviewText: true,
        customerPhotoUrl: true,
        productPhotoUrl: true,
        createdAt: true,
      },
    });

    const formattedReviews = reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedReviews);
  } catch (error: any) {
    console.error("Error fetching public reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 });
  }
}

/**
 * POST /api/reviews
 * Customer review submission.
 * - Requires authenticated user
 * - Validates product existence, star rating (1-5), review text
 * - Validates optional customer/product photo URLs
 * - Enforces duplicate-review prevention (1 review per product per user)
 * - Server strictly sets moderationStatus = "PENDING" and isActive = false
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "You must be signed in to submit a review." }, { status: 401 });
  }

  try {
    const rawData = await req.json();
    const parseResult = createReviewSchema.safeParse(rawData);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid review data.";
      return NextResponse.json({ error: firstError, details: parseResult.error.issues }, { status: 400 });
    }

    const { productId, rating, reviewText, customerPhotoUrl, productPhotoUrl } = parseResult.data;

    // Verify product exists in database
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Check if user already reviewed this product (duplicate prevention)
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this product." }, { status: 400 });
    }

    // Server-controlled identity and moderation status
    const displayName = session.user.name?.trim() || "Customer";

    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        displayName,
        rating,
        reviewText,
        moderationStatus: "PENDING",
        isActive: false, // Strict synchronization: PENDING => isActive = false
        customerPhotoUrl: customerPhotoUrl ? customerPhotoUrl.trim() : null,
        productPhotoUrl: productPhotoUrl ? productPhotoUrl.trim() : null,
      },
    });

    return NextResponse.json(
      {
        message: "Thank you! Your review has been submitted and is pending moderation.",
        review: {
          id: review.id,
          displayName: review.displayName,
          rating: review.rating,
          reviewText: review.reviewText,
          customerPhotoUrl: review.customerPhotoUrl,
          productPhotoUrl: review.productPhotoUrl,
          createdAt: review.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: error.message || "Failed to submit review." }, { status: 500 });
  }
}
