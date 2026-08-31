"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

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
    data: { userId: session.user.id, name, phone, address, city, state, pincode },
  });

  return NextResponse.json(addr, { status: 201 });
}
