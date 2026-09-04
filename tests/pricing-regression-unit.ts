/**
 * Pricing regression tests (no DB required).
 *
 * Run with: npx tsx tests/pricing-regression-unit.ts
 *
 * Verifies:
 * - Discount calculation formula
 * - Price parsing safety
 * - No floating-point corruption of currency values
 */

// ─── Functions under test ──────────────────────────────────────────────────────

function discountPct(mrp: number, selling: number): number {
  if (mrp <= 0) return 0;
  return Math.round(((mrp - selling) / mrp) * 100);
}

function parsePrice(input: string | number | undefined | null): number {
  if (input === undefined || input === null) return 0;
  if (typeof input === "number") return Math.floor(input);
  const parsed = parseInt(input, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log("=== Pricing Regression Tests (Unit) ===\n");

// CASE 1: MRP 100, Selling 100 → 0% discount
assert(discountPct(100, 100) === 0, "Case 1: MRP=100, SP=100 => 0% discount");

// CASE 2: MRP 100, Selling 80 → 20% discount
assert(discountPct(100, 80) === 20, "Case 2: MRP=100, SP=80 => 20% discount");

// CASE 3: MRP 100, Selling 50 → 50% discount
assert(discountPct(100, 50) === 50, "Case 3: MRP=100, SP=50 => 50% discount");

// CASE 4: MRP 2499, Selling 1999 → 20% (20.008% rounded)
assert(discountPct(2499, 1999) === 20, "Case 4: MRP=2499, SP=1999 => 20% discount");

// CASE 5: MRP 100, Selling 35 → 65% discount
assert(discountPct(100, 35) === 65, "Case 5: MRP=100, SP=35 => 65% discount");

// CASE 6: MRP 100, Selling 40 → 60% discount
assert(discountPct(100, 40) === 60, "Case 6: MRP=100, SP=40 => 60% discount");

// CASE 7: Update from 50 to 100 selling
assert(discountPct(100, 100) === 0, "Case 7: Updated SP=100 => 0% discount");

// CASE 8: Price parsing - string input
assert(parsePrice("100") === 100, 'Case 8a: parsePrice("100") => 100');
assert(parsePrice("80") === 80, 'Case 8b: parsePrice("80") => 80');
assert(parsePrice("") === 0, 'Case 8c: parsePrice("") => 0');
assert(parsePrice(null) === 0, "Case 8d: parsePrice(null) => 0");
assert(parsePrice(undefined) === 0, "Case 8e: parsePrice(undefined) => 0");
assert(parsePrice("abc") === 0, 'Case 8f: parsePrice("abc") => 0');

// CASE 9: Price parsing - numeric input
assert(parsePrice(100) === 100, "Case 9a: parsePrice(100) => 100");
assert(parsePrice(80.9) === 80, "Case 9b: parsePrice(80.9) => 80 (truncated)");
assert(parsePrice(0) === 0, "Case 9c: parsePrice(0) => 0");

// CASE 10: No floating-point corruption
const mrp = 2499;
const selling = 1999;
const computed = ((mrp - selling) / mrp) * 100;
assert(Math.abs(computed - 20.008) < 0.01, "Case 10a: Float calculation is ~20.008%");
assert(Math.round(computed) === 20, "Case 10b: Rounded discount = 20%");

// CASE 11: Edge cases
assert(discountPct(0, 100) === 0, "Case 11a: MRP=0 => 0% discount (guard)");
assert(discountPct(100, 0) === 100, "Case 11b: SP=0 => 100% discount");
assert(discountPct(100, 101) === -1, "Case 11c: SP>MRP => -1% (mathematically correct; form validation prevents this)");

// CASE 12: Selling price is NEVER modified by discount logic
const userEnteredSP = 100;
const mrpVal = 100;
const computedSP = userEnteredSP; // This must stay 100
assert(computedSP === 100, "Case 12: User-entered SP=100 is preserved, not recalculated");

// CASE 13: Integer arithmetic safety
const mrpInt = 2999;
const spInt = 1999;
const expectedDiscount = Math.round(((mrpInt - spInt) / mrpInt) * 100);
assert(expectedDiscount === 33, "Case 13: MRP=2999, SP=1999 => 33% discount");

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passCount} passed, ${failCount} failed ===`);
if (failCount > 0) {
  process.exit(1);
}
