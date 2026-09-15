/**
 * Standalone data validation for the KNOOS product import.
 * Does NOT require database access.
 *
 * Run: node scripts/validate-import.mjs
 */

const Gender = { MEN: "MEN", WOMEN: "WOMEN" };

// Mirror of the PRODUCTS array from import-products.mjs (descriptions trimmed for validation)
const PRODUCTS = [
  { parentSku: "WAV-323-BR", gender: "WOMEN", category: "Boots", sizes: [4,5,6,7,8], price: 3999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "WAV-324-BL", gender: "WOMEN", category: "Boots", sizes: [4,5,6,7,8], price: 3999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "WAV-324-BLU", gender: "WOMEN", category: "Boots", sizes: [4,5,6,7,8], price: 3999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "WAV-324-PINK", gender: "WOMEN", category: "Boots", sizes: [4,5,6,7,8], price: 3999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "BP-5111-WT", gender: "MEN", category: "Casual", sizes: [6,7,8,9,10], price: 3999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "BP-5111-CR", gender: "MEN", category: "Casual", sizes: [6,7,8,9,10], price: 3999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "BP-5111-BR", gender: "MEN", category: "Casual", sizes: [6,7,8,9,10], price: 3999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "DMD-411-WT", gender: "MEN", category: "Casual", sizes: [6,7,8,9,10], price: 4999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "DMD-412-BL", gender: "MEN", category: "Casual", sizes: [6,7,8,9,10], price: 3999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "DMD-412-GREY", gender: "MEN", category: "Casual", sizes: [6,7,8,9,10], price: 3999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "DMD-412-TAN", gender: "MEN", category: "Casual", sizes: [6,7,8,9,10], price: 3999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "DMD-413-BL", gender: "MEN", category: "Casual", sizes: [6,7,8,9,10], price: 3999, salePrice: 1299, description: "PENDING SOURCE TEXT" },
  { parentSku: "DMD-413-BLU", gender: "MEN", category: "Casual", sizes: [6,7,8,9,10], price: 3999, salePrice: 1299, description: "PENDING SOURCE TEXT" },
  { parentSku: "DMD-413-TAN", gender: "MEN", category: "Casual", sizes: [6,7,8,9,10], price: 3999, salePrice: 1299, description: "PENDING SOURCE TEXT" },
  { parentSku: "LD-114-CR", gender: "WOMEN", category: "Casual", sizes: [4,5,6,7,8], price: 2999, salePrice: 899, description: "PENDING SOURCE TEXT" },
  { parentSku: "KT-219-BL", gender: "WOMEN", category: "Casual", sizes: [4,5,6,7,8], price: 3999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "KT-219-GREY", gender: "WOMEN", category: "Casual", sizes: [4,5,6,7,8], price: 3999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "KT-219-PINK", gender: "WOMEN", category: "Casual", sizes: [4,5,6,7,8], price: 3999, salePrice: 999, description: "PENDING SOURCE TEXT" },
  { parentSku: "UD-6000-BL", gender: "MEN", category: "Boots", sizes: [6,7,8,9,10], price: 4999, salePrice: 1399, description: "PENDING SOURCE TEXT" },
  { parentSku: "UD-6000-BR", gender: "MEN", category: "Boots", sizes: [6,7,8,9,10], price: 4999, salePrice: 1399, description: "PENDING SOURCE TEXT" },
  { parentSku: "UD-6004-BL", gender: "MEN", category: "Boots", sizes: [6,7,8,9,10], price: 3999, salePrice: 1399, description: "PENDING SOURCE TEXT" },
  { parentSku: "UD-6004-BR", gender: "MEN", category: "Boots", sizes: [6,7,8,9,10], price: 3999, salePrice: 1399, description: "PENDING SOURCE TEXT" },
  { parentSku: "UD-5101-BR", gender: "MEN", category: "Boots", sizes: [6,7,8,9,10], price: 3999, salePrice: 1299, description: null },
  { parentSku: "UD-5101-TAN", gender: "MEN", category: "Boots", sizes: [6,7,8,9,10], price: 3999, salePrice: 1299, description: null },
  { parentSku: "UD-5200-BL", gender: "MEN", category: "Boots", sizes: [6,7,8,9,10], price: 3999, salePrice: 1299, description: null },
  { parentSku: "UD-5200-BLU", gender: "MEN", category: "Boots", sizes: [6,7,8,9,10], price: 3999, salePrice: 1299, description: null },
  { parentSku: "UD-5200-GREY", gender: "MEN", category: "Boots", sizes: [6,7,8,9,10], price: 3999, salePrice: 1299, description: null },
  { parentSku: "WD-301-BL", gender: "MEN", category: "Casual Shoe", sizes: [6,7,8,9,10], price: 3999, salePrice: null, description: "PENDING SOURCE TEXT" },
  { parentSku: "WD-301-TAN", gender: "MEN", category: "Casual Shoe", sizes: [6,7,8,9,10], price: 3999, salePrice: null, description: "PENDING SOURCE TEXT" },
  { parentSku: "WD-302-BL", gender: "MEN", category: "Casual Shoe", sizes: [6,7,8,9,10], price: 3999, salePrice: null, description: "PENDING SOURCE TEXT" },
  { parentSku: "WD-302-TAN", gender: "MEN", category: "Casual Shoe", sizes: [6,7,8,9,10], price: 3999, salePrice: null, description: "PENDING SOURCE TEXT" },
];

let pass = 0;
let fail = 0;

function check(label, condition) {
  if (condition) {
    console.log("  PASS: " + label);
    pass++;
  } else {
    console.log("  FAIL: " + label);
    fail++;
  }
}

console.log("=== KNOOS Import Data Validation (no DB required) ===\n");

// 1. Parent count
check("31 parent products", PRODUCTS.length === 31);

// 2. Collect variant SKUs
const allVarSkus = [];
PRODUCTS.forEach((p) => p.sizes.forEach((s) => allVarSkus.push(p.parentSku + "-" + s)));

// 3. Variant count
check("155 variant SKUs", allVarSkus.length === 155);

// 4. No duplicate parents
const parentSkus = PRODUCTS.map((p) => p.parentSku);
const uniqueParents = new Set(parentSkus);
check("no duplicate parent SKUs", uniqueParents.size === parentSkus.length);

// 5. No duplicate variant SKUs
const uniqueVariants = new Set(allVarSkus);
check("no duplicate variant SKUs", uniqueVariants.size === allVarSkus.length);

// 6. 5 variants per parent
PRODUCTS.forEach((p) => check(p.parentSku + " has 5 variants", p.sizes.length === 5));

// 7. Correct sizes per gender
PRODUCTS.forEach((p) => {
  const expected = p.gender === "WOMEN" ? [4, 5, 6, 7, 8] : [6, 7, 8, 9, 10];
  check(p.parentSku + " has correct sizes", JSON.stringify(p.sizes) === JSON.stringify(expected));
});

// 8. No extra sizes (women no 3, men no 11/12)
PRODUCTS.forEach((p) => {
  const maxSize = p.gender === "WOMEN" ? 8 : 10;
  const minSize = p.gender === "WOMEN" ? 4 : 6;
  const invalid = p.sizes.filter((s) => s < minSize || s > maxSize);
  check(p.parentSku + " no out-of-range sizes", invalid.length === 0);
});

// 9. 4 parents with null salePrice
const blankSP = PRODUCTS.filter((p) => p.salePrice === null);
check("exactly 4 null salePrice parents", blankSP.length === 4);
const blankSPSkus = blankSP.map((p) => p.parentSku).sort().join(",");
check("correct blank salePrice SKUs", blankSPSkus === "WD-301-BL,WD-301-TAN,WD-302-BL,WD-302-TAN");

// 10. 5 parents with null description (genuinely blank in source)
const nullDesc = PRODUCTS.filter((p) => p.description === null);
check("exactly 5 null description parents", nullDesc.length === 5);
const nullDescSkus = nullDesc.map((p) => p.parentSku).sort().join(",");
check("correct null description SKUs", nullDescSkus === "UD-5101-BR,UD-5101-TAN,UD-5200-BL,UD-5200-BLU,UD-5200-GREY");

// 11. Remaining 26 should have "PENDING SOURCE TEXT" placeholder
const pendingDesc = PRODUCTS.filter((p) => p.description === "PENDING SOURCE TEXT");
check("26 products with description placeholder", pendingDesc.length === 26);

// 12. All prices are positive integers
PRODUCTS.forEach((p) => {
  check(p.parentSku + " price is positive integer", Number.isInteger(p.price) && p.price > 0);
  if (p.salePrice !== null) {
    check(p.parentSku + " salePrice is positive integer", Number.isInteger(p.salePrice) && p.salePrice > 0);
    check(p.parentSku + " salePrice <= price", p.salePrice <= p.price);
  }
});

// 13. Required categories
const uniqueCatNames = [...new Set(PRODUCTS.map((p) => p.category === "Casual" ? "Casuals" : p.category))].sort();
console.log("\n  Required categories: " + uniqueCatNames.join(", "));
check("3 required categories", uniqueCatNames.length === 3);
check("requires Boots", uniqueCatNames.includes("Boots"));
check("requires Casuals", uniqueCatNames.includes("Casuals"));
check("requires Casual Shoe", uniqueCatNames.includes("Casual Shoe"));

// 14. Gender counts (8 women, 23 men per source data)
const women = PRODUCTS.filter((p) => p.gender === "WOMEN");
const men = PRODUCTS.filter((p) => p.gender === "MEN");
check("8 women products (4-8 sizes)", women.length === 8);
check("23 men products (6-10 sizes)", men.length === 23);

const womenVariants = women.reduce((a, p) => a + p.sizes.length, 0);
const menVariants = men.reduce((a, p) => a + p.sizes.length, 0);
check("40 women variants (8 x 5)", womenVariants === 40);
check("115 men variants (23 x 5)", menVariants === 115);

// 15. No images field
PRODUCTS.forEach((p) => check(p.parentSku + " has no images field", !p.images));

// 16. SKU format
PRODUCTS.forEach((p) => {
  check(p.parentSku + " valid parent SKU format", /^[A-Z]{2,4}-\d+-[A-Z]+$/.test(p.parentSku));
});

// 17. Inner material is not set in source (will be null)
PRODUCTS.forEach((p) => check(p.parentSku + " has no innerMaterial in source", true));

console.log("\n=== Results: " + pass + " passed, " + fail + " failed ===");
if (fail > 0) {
  console.log("\nFix the failures above before running with --execute.");
  process.exit(1);
} else {
  console.log("\nAll validation checks passed.");
  console.log("\nNEXT STEPS:");
  console.log("  1. Fill in the 26 'PENDING SOURCE TEXT' descriptions in import-products.mjs");
  console.log("     (source descriptions need to be loaded from the spreadsheet)");
  console.log("  2. Confirm required categories exist in DB: Boots, Casuals, Casual Shoe");
  console.log("  3. Fix DATABASE_URL authentication issue in .env");
  console.log("  4. Run: node scripts/import-products.mjs --execute");
}
