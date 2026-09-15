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
  });

  // Sort: default first, then by newest
  addresses.sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json(addresses);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      return NextResponse.json({ error: "Please fill all required fields." }, { status: 400 });
    }

    let makeDefault = isDefault ?? false;

    // If no addresses exist for this user, make this one default
    if (!makeDefault) {
      const count = await prisma.address.count({ where: { userId: session.user.id } });
      if (count === 0) {
        makeDefault = true;
      }
    }

    // If this is being set as default, unset other defaults
    if (makeDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        label: label || "HOME",
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2?.trim() || null,
        landmark: landmark?.trim() || null,
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country || "India",
        isDefault: makeDefault,
      },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error("Create address error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
