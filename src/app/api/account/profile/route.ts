import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, phone } = body;

    // Basic validation
    if (name !== undefined && (typeof name !== "string" || name.trim().length < 1)) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
      }
    }

    if (phone !== undefined && phone !== null && phone.trim() !== "") {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
        return NextResponse.json({ error: "Please enter a valid Indian phone number (10 digits starting with 6-9)." }, { status: 400 });
      }
    }

    // Check email uniqueness if being changed
    if (email && email !== session.user.email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: session.user.id } },
      });
      if (existing) {
        return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (phone !== undefined) {
      updateData.phone = phone.trim() || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
