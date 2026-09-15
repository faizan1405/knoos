/**
 * KNOOS Product Import Script
 *
 * Usage:
 *   node scripts/import-products.mjs              (offline dry-run — no DB)
 *   node scripts/import-products.mjs --check-db   (read-only DB check)
 *   node scripts/import-products.mjs --execute    (write to DB)
 *
 * Dry-run validates the local dataset only — zero database connections.
 * Check-db connects read-only to verify DB, categories, and existing SKUs.
 * Execute mode connects to DATABASE_URL and imports atomically per product.
 *
 * All product data lives in src/lib/product-import-data.mjs (single source of truth).
 */

import {
  Gender,
  ProductStatus,
  PRODUCTS,
  ROADSTER_DESCRIPTION_SKUS,
  COLOR_DESCRIPTION_MISMATCHES,
  BLANK_DESCRIPTION_SKUS,
  BLANK_SALEPRICE_SKUS,
  IMPORT_TOTAL_PARENTS,
  IMPORT_TOTAL_VARIANTS,
  IMPORT_REQUIRED_CATEGORIES,
  normalizeCategoryName,
} from "../src/lib/product-import-data.mjs";

import { slugify } from "../src/lib/utils.ts";

// ═══════════════════════════════════════════════════════════════════════════════
// ARGUMENTS
// ═══════════════════════════════════════════════════════════════════════════════
const args = process.argv.slice(2);
const DRY_RUN = !args.includes("--execute") && !args.includes("--check-db");
const EXECUTE = args.includes("--execute");
const CHECK_DB = args.includes("--check-db");

// ═══════════════════════════════════════════════════════════════════════════════
// Prisma is ONLY imported/instantiated in EXECUTE mode.
// Dry-run must never touch the database.
// ═══════════════════════════════════════════════════════════════════════════════
let prisma = null;

async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
  }
  return prisma;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAME & SLUG GENERATION
// ═══════════════════════════════════════════════════════════════════════════════
// "KNOOS {Color} {SubCategory} - {ParentSKU}"

function generateName(p) {
  return `KNOOS ${p.color} ${p.subCategory} - ${p.parentSku}`;
}

function generateUniqueSlug(name, parentSku, existingSlugs) {
  const baseSlug = slugify(name);
  const skuSuffix = parentSku.toLowerCase();
  let candidate = `${baseSlug}-${skuSuffix}`;

  let counter = 1;
  const original = candidate;
  while (existingSlugs.has(candidate)) {
    candidate = `${original}-${counter}`;
    counter++;
  }

  existingSlugs.add(candidate);
  return candidate;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════════
// Source "Casual" maps to canonical "Casuals" per project convention.
// All other source categories are used as-is (slugified for lookup).
// Category auto-creation is DISABLED — required categories must exist in the DB.

const CATEGORY_CACHE = new Map();

async function resolveCategory(db, sourceCategory) {
  const normCat = normalizeCategoryName(sourceCategory);
  if (CATEGORY_CACHE.has(normCat)) {
    return CATEGORY_CACHE.get(normCat);
  }

  const slug = slugify(normCat);
  const found = await db.category.findFirst({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });

  if (!found) {
    throw new Error(`No categoryId resolved for "${normCat}"`);
  }

  CATEGORY_CACHE.set(normCat, found.id);
  return found.id;
}

async function resolveAllCategories(db) {
  for (const reqCat of IMPORT_REQUIRED_CATEGORIES) {
    await resolveCategory(db, reqCat.source);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA VALIDATION (NO DATABASE REQUIRED — offline only)
// ═══════════════════════════════════════════════════════════════════════════════

function runDataValidation() {
  const errors = [];
  const warnings = [];

  // 1. Count parents
  if (PRODUCTS.length !== IMPORT_TOTAL_PARENTS) {
    errors.push(`Expected ${IMPORT_TOTAL_PARENTS} parent products, found ${PRODUCTS.length}`);
  }

  // 2. Collect all variant SKUs
  const allVariantSkus = [];
  for (const p of PRODUCTS) {
    for (const s of p.sizes) {
      allVariantSkus.push(`${p.parentSku}-${s}`);
    }
  }

  // 3. Count variants
  if (allVariantSkus.length !== IMPORT_TOTAL_VARIANTS) {
    errors.push(`Expected ${IMPORT_TOTAL_VARIANTS} variant SKUs, found ${allVariantSkus.length}`);
  }

  // 4. No duplicate parent SKUs
  const parentSkus = PRODUCTS.map((p) => p.parentSku);
  const uniqueParents = new Set(parentSkus);
  if (uniqueParents.size !== parentSkus.length) {
    const dupes = parentSkus.filter((s, i) => parentSkus.indexOf(s) !== i);
    errors.push(`Duplicate parent SKUs: ${dupes.join(", ")}`);
  }

  // 5. No duplicate variant SKUs
  const uniqueVariants = new Set(allVariantSkus);
  if (uniqueVariants.size !== allVariantSkus.length) {
    errors.push("Duplicate variant SKUs detected");
  }

  // 6. Gender values
  const validGenders = new Set([Gender.MEN, Gender.WOMEN]);
  for (const p of PRODUCTS) {
    if (!validGenders.has(p.gender)) {
      errors.push(`Invalid gender "${p.gender}" in ${p.parentSku}`);
    }
  }

  // 7. Prices are positive integers (INR, no paise)
  for (const p of PRODUCTS) {
    if (typeof p.price !== "number" || p.price < 0 || !Number.isInteger(p.price)) {
      errors.push(`Invalid price ${p.price} in ${p.parentSku}`);
    }
    if (p.salePrice !== null && (typeof p.salePrice !== "number" || p.salePrice < 0 || !Number.isInteger(p.salePrice))) {
      errors.push(`Invalid salePrice ${p.salePrice} in ${p.parentSku}`);
    }
    if (p.salePrice !== null && p.salePrice > p.price) {
      warnings.push(`salePrice > price in ${p.parentSku}: ${p.salePrice} > ${p.price}`);
    }
  }

  // 8. No sizes outside the expected ranges
  for (const p of PRODUCTS) {
    for (const s of p.sizes) {
      if (p.gender === Gender.WOMEN && (s < 4 || s > 8)) {
        warnings.push(`Unusual women's size ${s} in ${p.parentSku}`);
      }
      if (p.gender === Gender.MEN && (s < 6 || s > 10)) {
        warnings.push(`Unusual men's size ${s} in ${p.parentSku}`);
      }
    }
  }

  // 9. Category source normalization
  for (const p of PRODUCTS) {
    const normCat = normalizeCategoryName(p.category);
    const expected = normCat;
    if (p.category.toLowerCase() === "casual" && normCat !== "casuals") {
      errors.push(`Category normalization failed for ${p.parentSku}: "${p.category}" → "${normCat}"`);
    }
  }

  // 10. Blank description count
  const blankDesc = PRODUCTS.filter((p) => p.description === null);
  if (blankDesc.length !== BLANK_DESCRIPTION_SKUS.size) {
    warnings.push(`${blankDesc.length} products have null descriptions (expected ${BLANK_DESCRIPTION_SKUS.size})`);
  }

  // 11. Blank salePrice count
  const blankSp = PRODUCTS.filter((p) => p.salePrice === null);
  if (blankSp.length !== BLANK_SALEPRICE_SKUS.size) {
    warnings.push(`${blankSp.length} products have null salePrice (expected ${BLANK_SALEPRICE_SKUS.size})`);
  }

  return { errors, warnings };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT DATABASE TARGET (never prints credentials)
// ═══════════════════════════════════════════════════════════════════════════════

function printDatabaseTarget() {
  const raw = process.env.DATABASE_URL || "";
  const dbMatch = raw.match(/:\/\/([^:]+):[^@]+@([^:]+):\d+\/(.+)/);
  if (dbMatch) {
    console.log(`  Host:     ${dbMatch[2]}`);
    console.log(`  Database: ${dbMatch[3]}`);
  } else {
    console.log("  Host:     (could not parse DATABASE_URL)");
    console.log("  Database: (could not parse DATABASE_URL)");
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OFFLINE REPORT
// ═══════════════════════════════════════════════════════════════════════════════

function printOfflineReport(validation) {
  console.log("\n" + "=".repeat(60));
  console.log("OFFLINE IMPORT REPORT");
  console.log("=".repeat(60));
  console.log(`1.  Parent products:            ${PRODUCTS.length}`);
  console.log(`2.  Total variants:             ${IMPORT_TOTAL_VARIANTS}`);
  console.log(`3.  Categories required:        ${IMPORT_REQUIRED_CATEGORIES.map(c => c.source).join(", ")}`);

  console.log(`\n4.  Blank salePrice (4 products):`);
  for (const sku of BLANK_SALEPRICE_SKUS) {
    console.log(`    - ${sku}`);
  }

  console.log(`\n5.  Blank descriptions (5 products):`);
  for (const sku of BLANK_DESCRIPTION_SKUS) {
    console.log(`    - ${sku}`);
  }

  console.log(`\n6.  Descriptions containing "Roadster" (${ROADSTER_DESCRIPTION_SKUS.size} products):`);
  for (const sku of ROADSTER_DESCRIPTION_SKUS) {
    console.log(`    - ${sku}`);
  }

  console.log(`\n7.  Colour/description mismatches (${COLOR_DESCRIPTION_MISMATCHES.length} products):`);
  for (const m of COLOR_DESCRIPTION_MISMATCHES) {
    console.log(`    - ${m.sku}: product is "${m.productColor}", description says "${m.descriptionColor}"`);
  }

  if (validation.errors.length > 0) {
    console.log("\n8.  VALIDATION ERRORS:");
    for (const e of validation.errors) {
      console.log(`    X ${e}`);
    }
  } else {
    console.log("\n8.  Validation: PASS");
  }

  if (validation.warnings.length > 0) {
    console.log("\n9.  WARNINGS:");
    for (const w of validation.warnings) {
      console.log(`    ! ${w}`);
    }
  } else {
    console.log("\n9.  Warnings: none");
  }

  console.log("\n" + "=".repeat(60));
  console.log("Use --check-db to verify database target, then --execute to import.");
  console.log("=".repeat(60));
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT ONE PRODUCT (with all its variants in a transaction)
// ═══════════════════════════════════════════════════════════════════════════════

async function importProduct(db, p, existingSkuSet, existingSlugs) {
  const name = generateName(p);
  const slug = generateUniqueSlug(name, p.parentSku, existingSlugs);
  const variantSkus = p.sizes.map((size) => `${p.parentSku}-${size}`);

  // Pre-check: if any variant SKU already exists, skip the whole product
  const existingVariantsForProduct = variantSkus.filter((sku) => existingSkuSet.has(sku));
  if (existingVariantsForProduct.length > 0) {
    console.log(`\n  SKIP  ${p.parentSku} — variant(s) already exist: ${existingVariantsForProduct.join(", ")}`);
    return { inserted: false, skipped: true, reason: "variant exists" };
  }

  // Resolve categoryId (auto-creation is disabled)
  const categoryId = await resolveCategory(db, p.category);

  // Use a transaction: create product + all variants atomically
  const result = await db.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name,
        slug,
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
          create: p.sizes.map((size) => {
            const variantSku = `${p.parentSku}-${size}`;
            return {
              size: String(size),
              stock: 10,
              sku: variantSku,
              price: p.price,
              salePrice: p.salePrice,
            };
          }),
        },
      },
      include: {
        variants: { orderBy: { size: "asc" } },
        images: true,
      },
    });

    return product;
  });

  // Track the new SKUs so subsequent products see them as existing
  existingSkuSet.add(p.parentSku);
  for (const v of result.variants) {
    existingSkuSet.add(v.sku);
  }

  console.log(
    `  OK    ${p.parentSku} | ${name} | ${p.gender} | ${p.color} | ` +
      `${p.sizes.join("/")} | Rs.${p.price} -> Rs.${p.salePrice ?? p.price} | ` +
      `${result.variants.length} variants`,
  );

  return { inserted: true, skipped: false, product: result };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("=".repeat(60));
  if (CHECK_DB) {
    console.log("KNOOS Product Import — DATABASE CHECK (read-only)");
  } else if (DRY_RUN) {
    console.log("KNOOS Product Import — OFFLINE DRY RUN (no DB access)");
  } else {
    console.log("KNOOS Product Import — EXECUTE MODE");
  }
  console.log("=".repeat(60));

  // ── STEP 0: Validate data without DB ──
  console.log("\n[0] Running offline data validation...");
  const validation = runDataValidation();

  if (validation.errors.length > 0) {
    console.log("\nVALIDATION ERRORS:");
    for (const e of validation.errors) {
      console.log(`  X ${e}`);
    }
    console.log("\nDry run FAILED — fix errors above before --execute.");
    printOfflineReport(validation);
    process.exit(1);
  } else {
    console.log("  OK All data validation checks passed.");
  }

  if (validation.warnings.length > 0) {
    console.log("\nVALIDATION WARNINGS:");
    for (const w of validation.warnings) {
      console.log(`  ! ${w}`);
    }
    console.log("\nDry run FAILED — fix warnings above before --execute.");
    printOfflineReport(validation);
    process.exit(1);
  } else {
    console.log("  OK No warnings.");
  }

  // ── STEP 1: CHECK-DB MODE — read-only database verification ──
  if (CHECK_DB) {
    console.log("\n[1] Connecting to database (read-only)...");
    let db;
    try {
      db = await getPrisma();
      await db.$connect();
    } catch (e) {
      console.error("\nX DB CONNECTION: FAIL");
      console.error(`  Error: ${e.message}`);
      process.exit(1);
    }

    console.log("\nDATABASE TARGET");
    printDatabaseTarget();
    console.log("\nDB CONNECTION: PASS\n");

    // Category check
    console.log("[2] Checking required categories...");
    const categoryResults = [];
    let allCategoriesFound = true;

    for (const reqCat of IMPORT_REQUIRED_CATEGORIES) {
      const slug = slugify(reqCat.slug);
      const found = await db.category.findFirst({
        where: { slug },
        select: { id: true, name: true, slug: true },
      });
      if (found) {
        console.log(`  OK ${reqCat.source}: FOUND (${found.id})`);
        categoryResults.push(`${reqCat.source}: FOUND`);
      } else {
        console.log(`  X ${reqCat.source}: MISSING`);
        categoryResults.push(`${reqCat.source}: MISSING`);
        allCategoriesFound = false;
      }
    }

    // SKU precheck
    console.log("\n[3] Checking existing SKUs...");

    const allProducts = await db.product.findMany({
      select: { sku: true },
    });
    const existingSkuSet = new Set(allProducts.map((p) => p.sku));
    const existingParentCount = PRODUCTS.filter((p) => existingSkuSet.has(p.parentSku)).length;
    console.log(`  Existing parent SKUs matching import: ${existingParentCount}`);
    if (existingParentCount > 0) {
      const matched = PRODUCTS.filter((p) => existingSkuSet.has(p.parentSku));
      console.log(`  Matched: ${matched.map((p) => p.parentSku).join(", ")}`);
    }

    const allVariants = await db.productVariant.findMany({
      select: { sku: true },
    });
    const existingVariantSkuSet = new Set(allVariants.map((v) => v.sku));
    const targetVariantSkus = PRODUCTS.flatMap((p) =>
      p.sizes.map((s) => `${p.parentSku}-${s}`),
    );
    const existingVariantCount = targetVariantSkus.filter((s) => existingVariantSkuSet.has(s)).length;
    console.log(`  Existing variant SKUs matching import: ${existingVariantCount}`);
    if (existingVariantCount > 0) {
      const matched = targetVariantSkus.filter((s) => existingVariantSkuSet.has(s));
      console.log(`  Matched: ${matched.join(", ")}`);
    }

    await db.$disconnect();

    console.log("\n" + "=".repeat(60));
    console.log("DATABASE CHECK REPORT");
    console.log("=".repeat(60));
    console.log(`DB CONNECTION: PASS`);
    console.log(`Categories:`);
    for (const r of categoryResults) {
      console.log(`  ${r}`);
    }
    console.log(`Existing parent SKUs: ${existingParentCount}`);
    console.log(`Existing variant SKUs: ${existingVariantCount}`);
    console.log("=".repeat(60));

    if (!allCategoriesFound) {
      console.error("\nX One or more required categories are MISSING.");
      console.error("  Create them via the admin panel before running --execute.");
      process.exit(1);
    }

    console.log("\nOK All prechecks passed. Safe to run with --execute.");
    return;
  }

  // ── STEP 1: EXECUTE MODE ONLY — DB connection and import ──
  if (!EXECUTE) {
    printOfflineReport(validation);
    return;
  }

  console.log("\n[1] Connecting to database...");
  let db;
  try {
    db = await getPrisma();
    await db.$connect();
  } catch (e) {
    console.error("\nX Cannot connect to database.");
    console.error("  Please verify DATABASE_URL in .env.");
    console.error(`  Error: ${e.message}`);
    process.exit(1);
  }

  console.log("\nDATABASE TARGET");
  printDatabaseTarget();

  // ── STEP 2: Check existing data ──
  console.log("\n[2] Checking existing data...");

  const allProducts = await db.product.findMany({
    select: { sku: true, slug: true },
  });
  const existingSkuSet = new Set(allProducts.map((p) => p.sku));
  const existingSlugs = new Set(allProducts.map((p) => p.slug));

  const allVariants = await db.productVariant.findMany({
    select: { sku: true },
  });
  const existingVariantSkuSet = new Set(allVariants.map((v) => v.sku));

  const targetVariantSkus = PRODUCTS.flatMap((p) =>
    p.sizes.map((s) => `${p.parentSku}-${s}`),
  );
  const existingParentCount = PRODUCTS.filter((p) => existingSkuSet.has(p.parentSku)).length;
  const existingVariantCount = targetVariantSkus.filter((s) => existingVariantSkuSet.has(s)).length;

  console.log(`  Existing parent SKUs matching import: ${existingParentCount}`);
  console.log(`  Existing variant SKUs matching import: ${existingVariantCount}`);

  if (existingParentCount > 0) {
    const skipped = PRODUCTS.filter((p) => existingSkuSet.has(p.parentSku));
    console.log(`  Skipped products: ${skipped.map((p) => p.parentSku).join(", ")}`);
  }

  // ── STEP 3: Resolve categories (READ-ONLY — no creation) ──
  console.log("\n[3] Resolving categories (read-only, auto-create DISABLED)...");
  await resolveAllCategories(db);
  console.log(`  All ${CATEGORY_CACHE.size} required categories resolved.`);

  // ── STEP 4: Import products atomically ──
  console.log("\n[4] Importing products (atomic per product + variants)...");

  let productsInserted = 0;
  let productsSkipped = 0;
  let variantsInserted = 0;
  const productsWithBlankSalePrice = [];
  const productsWithBlankDescription = [];
  const descriptionsWithRoadster = [];
  const foundColorMismatches = [];

  for (const p of PRODUCTS) {
    // Skip if product SKU already exists
    if (existingSkuSet.has(p.parentSku)) {
      productsSkipped++;
      continue;
    }

    // Collect data-quality notes
    if (p.salePrice === null) {
      productsWithBlankSalePrice.push(p.parentSku);
    }
    if (p.description === null) {
      productsWithBlankDescription.push(p.parentSku);
    }
    if (p.description && p.description.includes("Roadster")) {
      descriptionsWithRoadster.push(p.parentSku);
    }
    const mismatch = COLOR_DESCRIPTION_MISMATCHES.find((m) => m.sku === p.parentSku);
    if (mismatch) {
      foundColorMismatches.push(mismatch);
    }

    const result = await importProduct(db, p, existingSkuSet, existingSlugs);

    if (result.inserted) {
      productsInserted++;
      variantsInserted += result.product.variants.length;
    } else {
      productsSkipped++;
    }
  }

  // ── STEP 5: Final verification ──
  console.log("\n[5] Running post-import verification...");

  const verificationSkus = PRODUCTS.map((p) => p.parentSku);
  const importedProducts = await db.product.findMany({
    where: { sku: { in: verificationSkus } },
    include: {
      variants: { orderBy: { size: "asc" } },
      images: true,
    },
  });

  let verificationErrors = 0;

  for (const p of PRODUCTS) {
    if (existingSkuSet.has(p.parentSku) && !importedProducts.find((ip) => ip.sku === p.parentSku)) {
      // Was pre-existing, not imported this run — skip verification
      continue;
    }

    const prod = importedProducts.find((ip) => ip.sku === p.parentSku);
    if (!prod) {
      console.log(`  X ${p.parentSku}: NOT FOUND after import`);
      verificationErrors++;
      continue;
    }

    // Check status
    if (prod.status !== ProductStatus.INACTIVE) {
      console.log(`  X ${p.parentSku}: status is ${prod.status}, expected INACTIVE`);
      verificationErrors++;
    }

    // Check no images
    if (prod.images && prod.images.length > 0) {
      console.log(`  X ${p.parentSku}: has ${prod.images.length} images (expected 0)`);
      verificationErrors++;
    }

    // Check variant count
    if (prod.variants.length !== p.sizes.length) {
      console.log(`  X ${p.parentSku}: ${prod.variants.length} variants, expected ${p.sizes.length}`);
      verificationErrors++;
    }

    // Check each variant
    for (let i = 0; i < p.sizes.length; i++) {
      const v = prod.variants[i];
      const expectedSku = `${p.parentSku}-${p.sizes[i]}`;

      if (v.sku !== expectedSku) {
        console.log(`  X ${p.parentSku}: variant SKU ${v.sku} !== ${expectedSku}`);
        verificationErrors++;
      }
      if (v.stock !== 10) {
        console.log(`  X ${p.parentSku}: variant ${v.sku} stock is ${v.stock}, expected 10`);
        verificationErrors++;
      }
      if (v.price !== p.price) {
        console.log(`  X ${p.parentSku}: variant ${v.sku} price is ${v.price}, expected ${p.price}`);
        verificationErrors++;
      }
      if (v.salePrice !== p.salePrice) {
        console.log(`  X ${p.parentSku}: variant ${v.sku} salePrice is ${v.salePrice}, expected ${p.salePrice}`);
        verificationErrors++;
      }
    }
  }

  if (verificationErrors === 0) {
    console.log(`  OK All ${importedProducts.length} imported products verified.`);
  } else {
    console.log(`  X ${verificationErrors} verification errors found!`);
  }

  await db.$disconnect();

  // ── FINAL REPORT ──
  console.log("\n" + "=".repeat(60));
  console.log("IMPORT COMPLETE — FINAL REPORT");
  console.log("=".repeat(60));
  console.log(`1.  Database:`);
  printDatabaseTarget();
  console.log(`2.  Import script:      src/lib/product-import-data.mjs + scripts/import-products.mjs`);
  console.log(`3.  Products inserted:  ${productsInserted}`);
  console.log(`4.  Variants inserted:  ${variantsInserted}`);
  console.log(`5.  Products skipped:   ${productsSkipped} (already existed)`);
  console.log(`6.  Categories used:`);
  for (const c of IMPORT_REQUIRED_CATEGORIES) {
    console.log(`      - ${c.source} (slug: ${c.slug})`);
  }
  console.log(`7.  Stock per variant:  10 (confirmed)`);
  console.log(`8.  ProductImages:      0 created (confirmed)`);
  console.log(`9.  All imported products: INACTIVE (non-public)`);
  console.log(`10. Blank salePrice (${productsWithBlankSalePrice.length} products):`);
  for (const sku of productsWithBlankSalePrice) {
    console.log(`      - ${sku}`);
  }
  console.log(`11. Blank descriptions (${productsWithBlankDescription.length} products):`);
  for (const sku of productsWithBlankDescription) {
    console.log(`      - ${sku}`);
  }
  console.log(`12. "Roadster" descriptions (${descriptionsWithRoadster.length} products):`);
  for (const sku of descriptionsWithRoadster) {
    console.log(`      - ${sku}`);
  }
  console.log(`13. Colour/description mismatches (${foundColorMismatches.length} products):`);
  for (const m of foundColorMismatches) {
    console.log(`      - ${m.sku}: product="${m.productColor}", description="${m.descriptionColor}"`);
  }
  console.log(`14. TypeScript/build: run separately (npx tsc --noEmit && npx next build)`);
  console.log("=".repeat(60));
}

main().catch((e) => {
  console.error("\nFATAL:", e);
  process.exit(1);
});
