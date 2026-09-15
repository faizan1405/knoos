"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Gender, ProductStatus } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import {
  PRODUCTS,
  IMPORT_REQUIRED_CATEGORIES,
  normalizeCategoryName,
} from "@/lib/product-import-data";

// ═══════════════════════════════════════════════════════════════════════════════
// POST — Admin-only product import
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof Response) return adminResult;

  // ── PRE-CHECK 1: Verify required categories exist (STOP if any missing) ───────
  const categoryMap = new Map<string, string>();

  for (const cat of IMPORT_REQUIRED_CATEGORIES) {
    const slug = slugify(cat.canonical);
    const found = await prisma.category.findFirst({
      where: { slug },
      select: { id: true, name: true },
    });
    if (!found) {
      return NextResponse.json(
        { error: `MISSING CATEGORY: ${cat.source}` },
        { status: 400 }
      );
    }
    categoryMap.set(cat.source, found.id);
  }

  // ── PRE-CHECK 2: Collect ALL existing SKUs before any writes ────────────────────
  const [allProducts, allVariants] = await Promise.all([
    prisma.product.findMany({ select: { sku: true } }),
    prisma.productVariant.findMany({ select: { sku: true } }),
  ]);

  const existingProductSkuSet = new Set(allProducts.map((p) => p.sku));
  const existingVariantSkuSet = new Set(allVariants.map((v) => v.sku));

  // Count collisions (informational — does not block, individual products skip)
  const targetVariantSkus: string[] = [];
  for (const p of PRODUCTS) {
    for (const s of p.sizes) {
      targetVariantSkus.push(`${p.parentSku}-${s}`);
    }
  }

  const existingParentCount = PRODUCTS.filter((p) => existingProductSkuSet.has(p.parentSku)).length;
  const existingVariantCount = targetVariantSkus.filter((s) => existingVariantSkuSet.has(s)).length;

  // ── IMPORT: Create products atomically per product ─────────────────────────
  let productsInserted = 0;
  let variantsInserted = 0;
  let productsSkipped = 0;
  let variantCollisions = 0;
  const errors: string[] = [];
  const skippedSkus: string[] = [];

  const existingSlugs = new Set(allProducts.map((p) => p.sku));

  for (const p of PRODUCTS) {
    // Skip if product already exists
    if (existingProductSkuSet.has(p.parentSku)) {
      productsSkipped++;
      skippedSkus.push(p.parentSku);
      continue;
    }

    // Check variant collisions — skip entire product if any variant exists
    const variantSkus = p.sizes.map((s) => `${p.parentSku}-${s}`);
    const collidingVariants = variantSkus.filter((sku) => existingVariantSkuSet.has(sku));
    if (collidingVariants.length > 0) {
      variantCollisions++;
      errors.push(`SKIP ${p.parentSku}: variant collision(s): ${collidingVariants.join(", ")}`);
      continue;
    }

    const normCat = normalizeCategoryName(p.category);
    const categoryId = categoryMap.get(p.category); // exact source category name → categoryId
    if (!categoryId) {
      errors.push(`SKIP ${p.parentSku}: no category resolved for "${p.category}"`);
      continue;
    }

    const name = `KNOOS ${p.color} ${p.subCategory} - ${p.parentSku}`;
    const baseSlug = slugify(name);
    const skuSuffix = p.parentSku.toLowerCase();
    let candidate = `${baseSlug}-${skuSuffix}`;
    let counter = 1;
    const originalCandidate = candidate;
    while (existingSlugs.has(candidate)) {
      candidate = `${originalCandidate}-${counter}`;
      counter++;
    }
    existingSlugs.add(candidate);

    // Create product + variants in a single transaction
    try {
      const product = await prisma.$transaction(async (tx) => {
        return tx.product.create({
          data: {
            name,
            slug: candidate,
            gender: p.gender,
            color: p.color,
            description: p.description ?? null,
            categoryId,
            subCategory: p.subCategory,
            upperMaterial: p.upperMaterial,
            innerMaterial: null,
            sole: p.sole,
            price: p.price,
            salePrice: p.salePrice,
            sku: p.parentSku,
            status: ProductStatus.INACTIVE,
            variants: {
              create: p.sizes.map((size) => ({
                size: String(size),
                stock: 10,
                sku: `${p.parentSku}-${size}`,
                price: p.price,
                salePrice: p.salePrice,
              })),
            },
          },
          include: {
            variants: { orderBy: { size: "asc" } },
            images: true,
          },
        });
      });

      productsInserted++;
      variantsInserted += product.variants.length;

      // Track new SKUs
      existingProductSkuSet.add(p.parentSku);
      for (const v of product.variants) {
        existingVariantSkuSet.add(v.sku);
      }
    } catch (err: any) {
      if (err.code === "P2002") {
        errors.push(`SKIP ${p.parentSku}: unique constraint violation (${err.meta?.target?.join(", ")})`);
      } else {
        errors.push(`ERR ${p.parentSku}: ${err.message}`);
      }
    }
  }

  // ── POST-IMPORT VERIFICATION ────────────────────────────────────────────────
  const importedProducts = await prisma.product.findMany({
    where: { sku: { in: PRODUCTS.map((p) => p.parentSku) } },
    include: {
      variants: { orderBy: { size: "asc" } },
      images: true,
    },
  });

  let verificationErrors = 0;
  const verificationDetails: string[] = [];

  for (const prod of importedProducts) {
    const source = PRODUCTS.find((p) => p.parentSku === prod.sku);
    if (!source) continue;

    let ok = true;

    if (prod.status !== ProductStatus.INACTIVE) {
      verificationDetails.push(`${prod.sku}: status="${prod.status}" expected INACTIVE`);
      verificationErrors++;
      ok = false;
    }
    if (prod.images.length > 0) {
      verificationDetails.push(`${prod.sku}: has ${prod.images.length} images (expected 0)`);
      verificationErrors++;
      ok = false;
    }
    if (prod.variants.length !== source.sizes.length) {
      verificationDetails.push(`${prod.sku}: ${prod.variants.length} variants, expected ${source.sizes.length}`);
      verificationErrors++;
      ok = false;
    }
    for (const v of prod.variants) {
      if (v.stock !== 10) {
        verificationDetails.push(`${prod.sku} ${v.sku}: stock=${v.stock}`);
        verificationErrors++;
        ok = false;
      }
      if (v.price !== source.price) {
        verificationDetails.push(`${prod.sku} ${v.sku}: price=${v.price}`);
        verificationErrors++;
        ok = false;
      }
      if (v.salePrice !== source.salePrice) {
        verificationDetails.push(`${prod.sku} ${v.sku}: salePrice=${v.salePrice}`);
        verificationErrors++;
        ok = false;
      }
      const expectedSku = `${source.parentSku}-${v.size}`;
      if (v.sku !== expectedSku) {
        verificationDetails.push(`${prod.sku} ${v.sku}: unexpected SKU`);
        verificationErrors++;
        ok = false;
      }
    }
    if (ok) {
      verificationDetails.push(`${prod.sku}: OK`);
    }
  }

  const totalProducts = await prisma.product.count();
  const totalVariants = await prisma.productVariant.count();

  return NextResponse.json({
    success: true,
    summary: {
      totalProductsInDb: totalProducts,
      totalVariantsInDb: totalVariants,
      productsInserted,
      variantsInserted,
      productsSkipped,
      existingParentSkusBeforeImport: existingParentCount,
      existingVariantSkusBeforeImport: existingVariantCount,
      variantCollisions,
      categoriesResolved: IMPORT_REQUIRED_CATEGORIES.map((c) => c.source),
      verificationErrors,
    },
    skippedSkus,
    errors: existingVariantCount > 0 ? targetVariantSkus.filter((s) => existingVariantSkuSet.has(s)) : [],
    verificationDetails,
  });
}

// Reject all other methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed — use POST" }, { status: 405 });
}
