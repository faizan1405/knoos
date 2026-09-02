import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/recommendations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cartIds = searchParams.get("cartIds")?.split(",") || [];
    const gender = searchParams.get("gender") || undefined;
    const limit = parseInt(searchParams.get("limit") || "3", 10);

    const recommendations = await getRecommendations({
      cartItemIds: cartIds.filter(Boolean),
      gender,
      limit,
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}
