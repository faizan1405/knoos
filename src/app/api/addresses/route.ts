"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/addresses
 * List all addresses for the authenticated user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(addresses);
}

/**
 * POST /api/addresses
 * Create a new address.
 * Body: { name, phone, address, city, state, pincode }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone, address, city, state, pincode } = body;

  if (!name || !phone || !address || !city || !state || !pincode) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const addr = await prisma.address.create({
    data: {
      userId: session.user.id,
      name,
      phone,
      address,
      city,
      state,
      pincode,
    },
  });

  return NextResponse.json(addr, { status: 201 });
}
