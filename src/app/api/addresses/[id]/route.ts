"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }

    const { label, fullName, phone, addressLine1, addressLine2, landmark, city, state, postalCode, country, isDefault } = body;

    // If setting as default, unset others first
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (label !== undefined) updateData.label = label;
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1.trim();
    if (addressLine2 !== undefined) updateData.addressLine2 = addressLine2?.trim() || null;
    if (landmark !== undefined) updateData.landmark = landmark?.trim() || null;
    if (city !== undefined) updateData.city = city.trim();
    if (state !== undefined) updateData.state = state.trim();
    if (postalCode !== undefined) updateData.postalCode = postalCode.trim();
    if (country !== undefined) updateData.country = country;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updated = await prisma.address.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
      select: { isDefault: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }

    await prisma.address.delete({ where: { id } });

    // If we deleted the default address, set another as default
    if (existing.isDefault) {
      const firstAddress = await prisma.address.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
      });

      if (firstAddress) {
        await prisma.address.update({
          where: { id: firstAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete address error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
