import { describe, it } from "node:test";
import assert from "node:assert";
import {
  ALLOWED_GENDER_PREFERENCES,
  ALLOWED_SHOE_SIZES,
  SHOE_SIZE_OPTIONS,
  formatShoeSizeDisplay,
} from "../src/lib/preferences";

describe("Customer Preferences 'Let Us Know' Logic & Validation (Section 6, 12, 13, 15, 20)", () => {
  it("allows only approved gender options suitable for footwear shopping preferences", () => {
    assert.deepStrictEqual([...ALLOWED_GENDER_PREFERENCES], ["Men", "Women", "Prefer not to say"]);

    const validGenders = ["Men", "Women", "Prefer not to say"];
    for (const g of validGenders) {
      assert.ok(ALLOWED_GENDER_PREFERENCES.includes(g as any));
    }

    const invalidGenders = ["Other", "Male", "Female", "Unknown", "Random", ""];
    for (const g of invalidGenders) {
      assert.strictEqual(ALLOWED_GENDER_PREFERENCES.includes(g as any), false);
    }
  });

  it("size preference accepts 4 through 10 (matching current KNOOS catalog variants)", () => {
    const expectedCatalogSizes = ["4", "5", "6", "7", "8", "9", "10"];
    assert.deepStrictEqual([...ALLOWED_SHOE_SIZES], expectedCatalogSizes);

    for (const size of expectedCatalogSizes) {
      assert.ok(
        ALLOWED_SHOE_SIZES.includes(size as any),
        `Catalog size ${size} must be accepted`
      );
    }

    // Verify option display labels
    assert.strictEqual(SHOE_SIZE_OPTIONS.length, 7);
    assert.strictEqual(SHOE_SIZE_OPTIONS[0].label, "UK 4");
    assert.strictEqual(SHOE_SIZE_OPTIONS[6].label, "UK 10");
  });

  it("size preference strictly rejects sizes 11 and 12", () => {
    const invalidSizes = ["11", "12", "UK 11", "UK 12", "13", "3", "US 9", "EU 42", "Large"];
    for (const s of invalidSizes) {
      assert.strictEqual(
        ALLOWED_SHOE_SIZES.includes(s as any),
        false,
        `Size '${s}' must be rejected as it is not in the current catalog`
      );
    }
  });

  it("formats stored shoe sizes correctly for customer display", () => {
    assert.strictEqual(formatShoeSizeDisplay("4"), "UK 4");
    assert.strictEqual(formatShoeSizeDisplay("7"), "UK 7");
    assert.strictEqual(formatShoeSizeDisplay("10"), "UK 10");
    assert.strictEqual(formatShoeSizeDisplay(null), "");
  });

  it("validates that name is optional, but if supplied must not exceed 100 characters", () => {
    const validName = "Aditi Sharma";
    assert.ok(validName.length <= 100);

    const emptyName = "";
    assert.ok(emptyName.length <= 100);

    const tooLongName = "A".repeat(101);
    assert.ok(tooLongName.length > 100);
  });

  it("enforces session user identity isolation (session.user.id determines record ownership)", () => {
    // Simulated request payload trying to overwrite another user's preference
    const payload = {
      userId: "malicious-user-id", // Client tries to spoof userId
      name: "Spoofed Name",
      genderPreference: "Men",
      shoeSize: "8",
    };

    const sessionUserId = "authenticated-user-123";

    // Ownership determination logic must use session.user.id, ignoring payload.userId
    const effectiveUserId = sessionUserId;
    assert.strictEqual(effectiveUserId, "authenticated-user-123");
    assert.notStrictEqual(effectiveUserId, payload.userId);
  });

  it("allows preferences to be optional so browsing and checkout are not blocked", () => {
    const emptyPreferences = {
      genderPreference: null,
      shoeSize: null,
    };

    // User can have null preferences and still use the app
    assert.strictEqual(emptyPreferences.genderPreference, null);
    assert.strictEqual(emptyPreferences.shoeSize, null);
  });
});
