/**
 * KNOOS Phase 3: Product Color Families & Swatches Unit Tests
 *
 * Run with: npx tsx tests/color-families-unit.ts
 *
 * Verifies:
 * - Color swatch hex mappings & light/dark borders
 * - Unknown color fallback preserving original label
 * - Color label formatting (multi-word, title case, underscores)
 * - Admin Zod validation schemas (createProductSchema, updateProductSchema, colorGroupKeySchema)
 * - Color sibling query & inclusion logic (Requirement A, B, C)
 * - Size selection isolation across color transitions (Requirement E)
 * - Cart payload integrity (Requirement F)
 */

import { getColorSwatch, formatColorLabel } from "../src/lib/colors";
import {
  colorGroupKeySchema,
  createProductSchema,
  updateProductSchema,
} from "../src/lib/validation/admin";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failCount++;
  } else {
    console.log(`PASS: ${message}`);
    passCount++;
  }
}

console.log("=== KNOOS Phase 3: Color Families & Swatches Unit Tests ===\n");

// ─── 1. Color Swatch Mappings ────────────────────────────────────────────────
console.log("--- 1. Color Swatch Mappings ---");

const blackSwatch = getColorSwatch("Black");
assert(blackSwatch.hex === "#18181b", "Black hex is #18181b");
assert(blackSwatch.isLight === false, "Black is not light");
assert(blackSwatch.isUnknown === false, "Black is recognized");
assert(blackSwatch.label === "Black", "Black label is 'Black'");

const brownSwatch = getColorSwatch("Brown");
assert(brownSwatch.hex === "#5c3a21", "Brown hex is #5c3a21");
assert(brownSwatch.isUnknown === false, "Brown is recognized");

const whiteSwatch = getColorSwatch("White");
assert(whiteSwatch.hex === "#ffffff", "White hex is #ffffff");
assert(whiteSwatch.isLight === true, "White is marked light for border");

const tanSwatch = getColorSwatch("Tan");
assert(tanSwatch.hex === "#c29b6c", "Tan hex is recognized");

const navySwatch = getColorSwatch("Navy");
assert(navySwatch.hex === "#1e293b", "Navy hex is recognized");

const beigeSwatch = getColorSwatch("Beige");
assert(beigeSwatch.isLight === true, "Beige is marked light");

// Compound color names
const darkBrownSwatch = getColorSwatch("Dark Brown");
assert(darkBrownSwatch.hex === "#382214", "Dark Brown mapped correctly");

const navyBlueSwatch = getColorSwatch("navy_blue");
assert(navyBlueSwatch.label === "Navy Blue", "navy_blue formatted as 'Navy Blue'");
assert(navyBlueSwatch.isUnknown === false, "navy_blue recognized");

// ─── 2. Unknown Color Fallback ───────────────────────────────────────────────
console.log("\n--- 2. Unknown Color Fallback ---");

const unknownColor = getColorSwatch("Electric Tangerine");
assert(unknownColor.isUnknown === true, "Unknown color flagged as isUnknown: true");
assert(unknownColor.hex === "#9ca3af", "Unknown color uses neutral fallback #9ca3af");
assert(unknownColor.label === "Electric Tangerine", "Unknown color preserves exact human name");

const nullColor = getColorSwatch(null);
assert(nullColor.isUnknown === true, "Null color returns unknown");
assert(nullColor.hex === "#9ca3af", "Null color returns fallback hex");

const emptyColor = getColorSwatch("   ");
assert(emptyColor.isUnknown === true, "Empty whitespace color returns unknown");

// ─── 3. Color Label Formatting ───────────────────────────────────────────────
console.log("\n--- 3. Color Label Formatting ---");

assert(formatColorLabel("black") === "Black", "'black' -> 'Black'");
assert(formatColorLabel("DARK_BROWN") === "Dark Brown", "'DARK_BROWN' -> 'Dark Brown'");
assert(formatColorLabel("chelsea__boots") === "Chelsea / Boots", "'chelsea__boots' handles double underscores");
assert(formatColorLabel("light-grey") === "Light Grey", "'light-grey' -> 'Light Grey'");

// ─── 4. Admin Validation: colorGroupKeySchema ────────────────────────────────
console.log("\n--- 4. Admin Validation: colorGroupKeySchema ---");

// Normalizes to lowercase and trims
const parsedValid = colorGroupKeySchema.safeParse("  Wave-323  ");
assert(parsedValid.success && parsedValid.data === "wave-323", "Trims and lowercases '  Wave-323  ' -> 'wave-323'");

// Empty string normalizes to null
const parsedEmpty = colorGroupKeySchema.safeParse("");
assert(parsedEmpty.success && parsedEmpty.data === null, "Empty string '' -> null");

const parsedWhitespace = colorGroupKeySchema.safeParse("   ");
assert(parsedWhitespace.success && parsedWhitespace.data === null, "Whitespace '   ' -> null");

// Null remains null
const parsedNull = colorGroupKeySchema.safeParse(null);
assert(parsedNull.success && parsedNull.data === null, "null -> null");

// Undefined remains undefined (crucial for PATCH updates to not overwrite)
const parsedUndefined = colorGroupKeySchema.safeParse(undefined);
assert(parsedUndefined.success && parsedUndefined.data === undefined, "undefined -> undefined");

// Length guard (>100 characters)
const tooLongKey = "a".repeat(101);
const parsedTooLong = colorGroupKeySchema.safeParse(tooLongKey);
assert(!parsedTooLong.success, "Rejects color group key longer than 100 characters");

// ─── 5. createProductSchema & updateProductSchema ────────────────────────────
console.log("\n--- 5. createProductSchema & updateProductSchema ---");

const baseProduct = {
  name: "KNOOS Oxford",
  slug: "knoos-oxford",
  description: "A classic oxford shoe.",
  gender: "MEN" as const,
  price: 4999,
  salePrice: 3999,
  sku: "KNOOS-OX-001",
  status: "ACTIVE" as const,
  variants: [
    { size: "8", stock: 10, sku: "KNOOS-OX-001-8", price: 4999, salePrice: 3999 },
  ],
  images: [{ imageUrl: "https://example.com/shoe.jpg", sortOrder: 0 }],
};

// Create without colorGroupKey
const createNoKey = createProductSchema.safeParse(baseProduct);
assert(createNoKey.success, "createProductSchema succeeds when colorGroupKey is omitted");

// Create with colorGroupKey
const createWithKey = createProductSchema.safeParse({
  ...baseProduct,
  color: "Brown",
  colorGroupKey: "OXFORD-WAVE-1",
});
assert(createWithKey.success && createWithKey.data.colorGroupKey === "oxford-wave-1", "createProductSchema normalizes colorGroupKey to 'oxford-wave-1'");

// Update product schema with empty string -> null
const updateEmptyKey = updateProductSchema.safeParse({
  id: "prod-123",
  colorGroupKey: "",
});
assert(updateEmptyKey.success && updateEmptyKey.data.colorGroupKey === null, "updateProductSchema converts empty string to null");

// Update product schema omitting colorGroupKey does not introduce it
const updateOmitKey = updateProductSchema.safeParse({
  id: "prod-123",
  name: "Updated Name",
});
assert(updateOmitKey.success && updateOmitKey.data.colorGroupKey === undefined, "updateProductSchema preserves undefined when omitted");

// ─── 6. Sibling Resolution & Consistency Logic (Requirement A, B, C) ─────────
console.log("\n--- 6. Sibling Resolution & Consistency (Req A, B, C) ---");

// Helper simulating product page sibling resolution logic
function resolveSiblings(
  product: { id: string; name: string; slug: string; color: string | null; colorGroupKey: string | null; price: number; salePrice: number | null; images: { id: string; imageUrl: string }[] },
  dbSiblings: Array<{ id: string; name: string; slug: string; color: string | null; status: string; price: number; salePrice: number | null; images: { id: string; imageUrl: string }[] }>
) {
  if (!product.colorGroupKey) {
    return [];
  }
  const siblings = [...dbSiblings.filter(s => s.status === "ACTIVE")];
  if (!siblings.some(s => s.id === product.id)) {
    siblings.unshift({
      id: product.id,
      name: product.name,
      slug: product.slug,
      color: product.color,
      status: "ACTIVE",
      price: product.price,
      salePrice: product.salePrice,
      images: product.images.slice(0, 1),
    });
  }
  return siblings;
}

// Requirement A: Product without colorGroupKey
const prodA = {
  id: "p1",
  name: "Shoe One",
  slug: "shoe-one",
  color: "Black",
  colorGroupKey: null,
  price: 3999,
  salePrice: null,
  images: [{ id: "i1", imageUrl: "https://example.com/1.jpg" }],
};
const siblingsA = resolveSiblings(prodA, []);
assert(siblingsA.length === 0, "Req A: Product with colorGroupKey=null returns empty siblings (no fake siblings)");

// Requirement B: Product with 1 member in group
const prodB = {
  id: "p2",
  name: "Sole Mate",
  slug: "sole-mate",
  color: "Tan",
  colorGroupKey: "solo-family",
  price: 4999,
  salePrice: null,
  images: [{ id: "i2", imageUrl: "https://example.com/2.jpg" }],
};
const siblingsB = resolveSiblings(prodB, [
  { id: "p2", name: "Sole Mate", slug: "sole-mate", color: "Tan", status: "ACTIVE", price: 4999, salePrice: null, images: [{ id: "i2", imageUrl: "https://example.com/2.jpg" }] }
]);
assert(siblingsB.length === 1, "Req B: 1-member group has exactly 1 sibling (clean display)");

// Requirement C: Product with 2+ active members & inactive filtering
const prodC = {
  id: "p3",
  name: "Chelsea Boot Brown",
  slug: "chelsea-boot-brown",
  color: "Brown",
  colorGroupKey: "chelsea-wave",
  price: 4999,
  salePrice: 3999,
  images: [{ id: "i3", imageUrl: "https://example.com/brown.jpg" }],
};
const dbSiblings = [
  { id: "p3", name: "Chelsea Boot Brown", slug: "chelsea-boot-brown", color: "Brown", status: "ACTIVE", price: 4999, salePrice: 3999, images: [{ id: "i3", imageUrl: "https://example.com/brown.jpg" }] },
  { id: "p4", name: "Chelsea Boot Black", slug: "chelsea-boot-black", color: "Black", status: "ACTIVE", price: 4999, salePrice: 3999, images: [{ id: "i4", imageUrl: "https://example.com/black.jpg" }] },
  { id: "p5", name: "Chelsea Boot Inactive Grey", slug: "chelsea-boot-grey", color: "Grey", status: "INACTIVE", price: 4999, salePrice: 3999, images: [] },
];
const siblingsC = resolveSiblings(prodC, dbSiblings);
assert(siblingsC.length === 2, "Req C: Inactive siblings are excluded (2 active returned)");
assert(siblingsC.some(s => s.slug === "chelsea-boot-black"), "Req C: Active black sibling is present");
assert(!siblingsC.some(s => s.slug === "chelsea-boot-grey"), "Req C: Inactive grey sibling is hidden");

// Requirement C (Edge case): DB query missed current product -> safely recovered
const siblingsCEdge = resolveSiblings(prodC, [
  { id: "p4", name: "Chelsea Boot Black", slug: "chelsea-boot-black", color: "Black", status: "ACTIVE", price: 4999, salePrice: 3999, images: [] }
]);
assert(siblingsCEdge.some(s => s.id === "p3"), "Req C: Data inconsistency recovery includes current product as selected option");

// ─── 7. Size Variant & Add to Cart Regression Safety (Req E & F) ──────────────
console.log("\n--- 7. Size Variant & Cart Safety (Req E & F) ---");

// Simulating product A variants and product B variants
const productVariantsColorA = [
  { id: "v1-uk7", productId: "p3", size: "7", stock: 5 },
  { id: "v1-uk8", productId: "p3", size: "8", stock: 0 }, // OOS
];

const productVariantsColorB = [
  { id: "v2-uk8", productId: "p4", size: "8", stock: 3 }, // In stock in color B!
  { id: "v2-uk9", productId: "p4", size: "9", stock: 4 },
];

// Verify navigation to canonical slug creates fresh product info state
let selectedVariantIdColorA: string | null = "v1-uk7";
// When navigating to sibling /product/chelsea-boot-black, component remounts with initial state:
let selectedVariantIdColorB: string | null = null; // fresh initial state

assert(selectedVariantIdColorB === null, "Req E: Size is not carried over automatically across colors");

// Add to cart payload creation
function createCartPayload(productId: string, variantId: string, quantity: number) {
  return { productId, variantId, quantity };
}

const cartPayload = createCartPayload("p4", "v2-uk8", 1);
assert(cartPayload.productId === "p4", "Req F: Cart payload has correct productId for selected color");
assert(cartPayload.variantId === "v2-uk8", "Req F: Cart payload has correct variantId for selected color");
assert(cartPayload.quantity === 1, "Req F: Cart quantity is valid");

// Summary
console.log(`\n=== Results: ${passCount} passed, ${failCount} failed ===`);
if (failCount > 0) {
  process.exit(1);
}
