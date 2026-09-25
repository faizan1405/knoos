/**
 * Phone Authentication Identity Resolution.
 *
 * Implements authoritative verified phone resolution:
 * 1. Checks PhoneAuthIdentity by unique normalized phone.
 *    - If found: authenticates linked User immediately.
 * 2. If NO PhoneAuthIdentity exists:
 *    - Atomically creates a NEW CUSTOMER User (role: "CUSTOMER", email: null, phone: phone)
 *      and links the new PhoneAuthIdentity.
 *    - DOES NOT search User.phone or auto-link unverified legacy profile phones.
 * 3. Handles Prisma P2002 race conditions by safely reloading the winning identity.
 */

import { prisma } from "@/lib/db";
import { normalizeIndianMobile } from "@/lib/phone";

export interface ResolvedUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

export type PhoneAuthResolutionResult =
  | { success: true; user: ResolvedUser }
  | { success: false; code: "INVALID_PHONE" | "RESOLUTION_FAILED"; error: string };

/**
 * Resolves or creates an authenticated user for a verified phone number.
 */
export async function resolveOrCreatePhoneUser(
  rawPhone: string,
  client: any = prisma
): Promise<PhoneAuthResolutionResult> {
  const validation = normalizeIndianMobile(rawPhone);
  if (!validation.isValid || !validation.normalized) {
    return {
      success: false,
      code: "INVALID_PHONE",
      error: validation.error || "Invalid phone number.",
    };
  }

  const phone = validation.normalized;

  // 1. Check authoritative PhoneAuthIdentity
  const existingIdentity = await client.phoneAuthIdentity.findUnique({
    where: { phone },
    include: { user: true },
  });

  if (existingIdentity && existingIdentity.user) {
    return {
      success: true,
      user: {
        id: existingIdentity.user.id,
        name: existingIdentity.user.name,
        email: existingIdentity.user.email,
        role: existingIdentity.user.role,
      },
    };
  }

  // 2. No PhoneAuthIdentity exists:
  // Strictly create a NEW CUSTOMER User + PhoneAuthIdentity atomically.
  // We do NOT search User.phone or auto-link legacy profiles.
  try {
    const createdIdentity = await client.phoneAuthIdentity.create({
      data: {
        phone,
        user: {
          create: {
            phone,
            role: "CUSTOMER", // strictly enforce CUSTOMER role
            email: null,
            name: null,
          },
        },
      },
      include: { user: true },
    });

    return {
      success: true,
      user: {
        id: createdIdentity.user.id,
        name: createdIdentity.user.name,
        email: createdIdentity.user.email,
        role: "CUSTOMER",
      },
    };
  } catch (err: unknown) {
    // Handle P2002 race condition (concurrent creation won by another request)
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      const racedIdentity = await client.phoneAuthIdentity.findUnique({
        where: { phone },
        include: { user: true },
      });
      if (racedIdentity && racedIdentity.user) {
        return {
          success: true,
          user: {
            id: racedIdentity.user.id,
            name: racedIdentity.user.name,
            email: racedIdentity.user.email,
            role: racedIdentity.user.role,
          },
        };
      }
    }
    console.error("[AUTH] Error creating new PhoneAuthIdentity:", err);
    return {
      success: false,
      code: "RESOLUTION_FAILED",
      error: "Failed to initialize phone account.",
    };
  }
}
