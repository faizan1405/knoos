/**
 * GET & PUT /api/account/preferences
 *
 * Customer "Let Us Know" preference management:
 * 1. Name (saved in User.name)
 * 2. Gender preference (saved in CustomerPreference.genderPreference)
 * 3. Shoe size preference (saved in CustomerPreference.shoeSize)
 *
 * Authentication required.
 * Ownership strictly derived from session.user.id (never trusts client payload).
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { ALLOWED_GENDER_PREFERENCES, ALLOWED_SHOE_SIZES } from "@/lib/preferences";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [user, preference] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, phone: true, email: true },
      }),
      prisma.customerPreference.findUnique({
        where: { userId: session.user.id },
        select: { genderPreference: true, shoeSize: true, updatedAt: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name ?? "",
      genderPreference: preference?.genderPreference ?? "",
      shoeSize: preference?.shoeSize ?? "",
      isConfigured: Boolean(preference?.genderPreference || preference?.shoeSize || user.name),
    });
  } catch (error) {
    console.error("Fetch preferences error:", error);
    return NextResponse.json({ error: "Failed to load preferences." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { name, genderPreference, shoeSize } = body;

    // Validate Name if provided
    if (name !== undefined && name !== null) {
      if (typeof name !== "string") {
        return NextResponse.json({ error: "Name must be a text string." }, { status: 400 });
      }
      if (name.length > 100) {
        return NextResponse.json({ error: "Name cannot exceed 100 characters." }, { status: 400 });
      }
    }

    // Validate Gender Preference if provided
    if (genderPreference !== undefined && genderPreference !== null && genderPreference !== "") {
      if (
        typeof genderPreference !== "string" ||
        !ALLOWED_GENDER_PREFERENCES.includes(genderPreference as any)
      ) {
        return NextResponse.json(
          {
            error: `Invalid gender preference. Choose from: ${ALLOWED_GENDER_PREFERENCES.join(", ")}.`,
          },
          { status: 400 }
        );
      }
    }

    // Validate Shoe Size if provided
    let normalizedShoeSize: string | null = null;
    if (shoeSize !== undefined && shoeSize !== null && shoeSize !== "") {
      if (typeof shoeSize !== "string") {
        return NextResponse.json({ error: "Shoe size must be a string." }, { status: 400 });
      }
      const raw = shoeSize.trim();
      const candidate = raw.startsWith("UK ") ? raw.slice(3).trim() : raw;
      if (!ALLOWED_SHOE_SIZES.includes(candidate as any)) {
        return NextResponse.json(
          {
            error: `Invalid shoe size. Allowed footwear sizes: UK 4 through UK 10.`,
          },
          { status: 400 }
        );
      }
      normalizedShoeSize = candidate;
    }

    // Update User.name if provided
    if (name !== undefined) {
      const sanitizedName = typeof name === "string" ? name.trim() : null;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: sanitizedName || null },
      });
    }

    // Upsert CustomerPreference
    const preference = await prisma.customerPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        genderPreference: genderPreference ? (genderPreference as string).trim() : null,
        shoeSize: normalizedShoeSize,
      },
      update: {
        genderPreference: genderPreference !== undefined ? (genderPreference ? (genderPreference as string).trim() : null) : undefined,
        shoeSize: shoeSize !== undefined ? normalizedShoeSize : undefined,
      },
      select: {
        genderPreference: true,
        shoeSize: true,
      },
    });

    // Re-fetch current user name
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    return NextResponse.json({
      success: true,
      name: updatedUser?.name ?? "",
      genderPreference: preference.genderPreference ?? "",
      shoeSize: preference.shoeSize ?? "",
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json({ error: "Failed to update preferences." }, { status: 500 });
  }
}
