"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { slugify } from "@/lib/utils";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function POST(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  const url = new URL(request.url);
  const isDryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dryRun") === "true";

  try {
    // 1. Load all products with id, name, slug, sku
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Count base slug frequencies across all products
    const baseCount = new Map<string, number>();
    for (const p of products) {
      const base = slugify(p.name);
      baseCount.set(base, (baseCount.get(base) || 0) + 1);
    }

    // 3. Resolve proposed slugs and detect collisions
    const assignedSlugs = new Map<string, string>(); // slug -> productId
    const unresolvedCollisions: Array<{
      id: string;
      name: string;
      sku: string;
      slug: string;
      reason: string;
    }> = [];
    const productToSlug = new Map<string, string>();

    for (const p of products) {
      let candidate = slugify(p.name);

      // If multiple products produce the same base slug, append deterministic SKU suffix
      if ((baseCount.get(candidate) || 0) > 1) {
        const skuSuffix = slugify(p.sku);
        candidate = `${candidate}-${skuSuffix}`;
      }

      // Check regex validity
      if (!SLUG_REGEX.test(candidate)) {
        unresolvedCollisions.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          slug: candidate,
          reason: "Candidate slug does not match regex /^[a-z0-9]+(?:-[a-z0-9]+)*$/",
        });
      } else if (assignedSlugs.has(candidate)) {
        // Collision with another product
        unresolvedCollisions.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          slug: candidate,
          reason: `Slug collision with product ID ${assignedSlugs.get(candidate)}`,
        });
      } else {
        assignedSlugs.set(candidate, p.id);
      }

      productToSlug.set(p.id, candidate);
    }

    // 4. Generate preview details
    const preview = products.map((p) => {
      const newSlug = productToSlug.get(p.id)!;
      const isOldSlugValid = SLUG_REGEX.test(p.slug) && !p.slug.includes("--");
      const changed = p.slug !== newSlug;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        oldSlug: p.slug,
        newSlug,
        isOldSlugValid,
        changed,
      };
    });

    const invalidSlugsFound = preview.filter((p) => !p.isOldSlugValid).length;
    const slugsToChange = preview.filter((p) => p.changed).length;
    const collisions = unresolvedCollisions.length;

    // 5. If dryRun, return preview without modifying anything
    if (isDryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        totalProducts: products.length,
        invalidSlugsFound,
        slugsToChange,
        collisions,
        collisionDetails: unresolvedCollisions,
        preview,
      });
    }

    // 6. Stop completely if unresolved collisions exist
    if (collisions > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Unresolved slug collisions detected (${collisions}). Normalization aborted without modifying the database.`,
          totalProducts: products.length,
          invalidSlugsFound,
          slugsToChange,
          collisions,
          collisionDetails: unresolvedCollisions,
        },
        { status: 409 }
      );
    }

    // 7. Actual update: perform strictly within a transaction, updating ONLY Product.slug
    const toUpdate = preview.filter((p) => p.changed);

    if (toUpdate.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const item of toUpdate) {
          await tx.product.update({
            where: { id: item.id },
            data: { slug: item.newSlug },
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      totalProducts: products.length,
      invalidSlugsFound,
      slugsUpdated: toUpdate.length,
      slugsToChange: 0,
      collisions: 0,
      summary: `Successfully normalized ${toUpdate.length} product slug(s).`,
      preview: toUpdate.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        oldSlug: item.oldSlug,
        newSlug: item.newSlug,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to normalize product slugs",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const dryRunUrl = new URL(request.url);
  dryRunUrl.searchParams.set("dryRun", "1");
  return POST(new Request(dryRunUrl.toString(), { method: "POST", headers: request.headers }));
}
