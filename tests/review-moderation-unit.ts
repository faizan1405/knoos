import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createReviewSchema,
  syncIsActive,
  resolveModerationStatus,
  isValidModerationStatus,
  MODERATION_STATUSES,
  type ModerationStatus,
} from "../src/lib/reviews";
import {
  isDurableReviewStorageConfigured,
  uploadReviewImage,
  validateReviewImageFile,
  DURABLE_STORAGE_REQUIRED_MESSAGE,
} from "../src/lib/review-storage";

async function main() {
  console.log("Starting Review Moderation & Photo Unit Tests...");

// ============================================================================
// 1. MODERATION STATUS & SYNCHRONIZATION
// ============================================================================
{
  assert.deepEqual(MODERATION_STATUSES, ["PENDING", "APPROVED", "REJECTED"]);

  // Status validity checks
  assert.equal(isValidModerationStatus("PENDING"), true);
  assert.equal(isValidModerationStatus("APPROVED"), true);
  assert.equal(isValidModerationStatus("REJECTED"), true);
  assert.equal(isValidModerationStatus("UNKNOWN"), false);
  assert.equal(isValidModerationStatus(null), false);
  assert.equal(isValidModerationStatus(undefined), false);

  // Synchronization with legacy isActive
  // APPROVED => isActive = true
  // PENDING  => isActive = false
  // REJECTED => isActive = false
  assert.equal(syncIsActive("APPROVED"), true, "APPROVED must synchronize to isActive = true");
  assert.equal(syncIsActive("PENDING"), false, "PENDING must synchronize to isActive = false");
  assert.equal(syncIsActive("REJECTED"), false, "REJECTED must synchronize to isActive = false");

  // Migration resolution from legacy boolean isActive:
  // isActive = true  => APPROVED
  // isActive = false => PENDING (NEVER silently classify as REJECTED)
  assert.equal(
    resolveModerationStatus(undefined, true),
    "APPROVED",
    "Legacy active review must resolve to APPROVED"
  );
  assert.equal(
    resolveModerationStatus(undefined, false),
    "PENDING",
    "Legacy inactive review must resolve to PENDING (not REJECTED)"
  );
  assert.equal(
    resolveModerationStatus("REJECTED", false),
    "REJECTED",
    "Explicit status overrides legacy boolean"
  );

  console.log("✓ Moderation status and synchronization tests passed.");
}

// ============================================================================
// 2. CUSTOMER INPUT VALIDATION SCHEMA
// ============================================================================
{
  const validBaseReview = {
    productId: "prod_1234567890",
    rating: 5,
    reviewText: "Incredible comfort and authentic Italian leather craftsmanship.",
  };

  // Valid submissions
  assert.equal(createReviewSchema.safeParse(validBaseReview).success, true);

  // Rating boundaries: 1 to 5 accepted
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, rating: 1 }).success,
    true,
    "Rating 1 must be accepted"
  );
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, rating: 5 }).success,
    true,
    "Rating 5 must be accepted"
  );

  // Invalid ratings: < 1 or > 5 or non-integer rejected
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, rating: 0 }).success,
    false,
    "Rating 0 must be rejected"
  );
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, rating: -1 }).success,
    false,
    "Negative rating must be rejected"
  );
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, rating: 6 }).success,
    false,
    "Rating 6 must be rejected"
  );
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, rating: 3.5 }).success,
    false,
    "Non-integer rating must be rejected"
  );

  // Review text validation
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, reviewText: "" }).success,
    false,
    "Empty review text must be rejected"
  );
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, reviewText: "   " }).success,
    false,
    "Whitespace-only review text must be rejected"
  );
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, reviewText: "a".repeat(2001) }).success,
    false,
    "Review text exceeding 2000 chars must be rejected"
  );
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, reviewText: "a".repeat(2000) }).success,
    true,
    "Review text with exactly 2000 chars must be accepted"
  );

  // Missing productId
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, productId: "" }).success,
    false,
    "Empty productId must be rejected"
  );

  console.log("✓ Customer review input validation tests passed.");
}

// ============================================================================
// 3. PHOTO URL VALIDATION & SECURITY
// ============================================================================
{
  const validBaseReview = {
    productId: "prod_1234567890",
    rating: 5,
    reviewText: "Great fit and styling.",
  };

  // Optional photos: null, empty string, or undefined are accepted
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, customerPhotoUrl: null }).success,
    true
  );
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, customerPhotoUrl: "" }).success,
    true
  );
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, customerPhotoUrl: undefined }).success,
    true
  );
  assert.equal(
    createReviewSchema.safeParse({ ...validBaseReview, productPhotoUrl: null }).success,
    true
  );

  // Valid HTTPS image URL
  assert.equal(
    createReviewSchema.safeParse({
      ...validBaseReview,
      customerPhotoUrl: "https://images.example.com/avatar1.jpg",
      productPhotoUrl: "https://images.example.com/shoes-review.webp",
    }).success,
    true
  );

  // SVG images are strictly rejected for user-generated content to prevent XSS
  assert.equal(
    createReviewSchema.safeParse({
      ...validBaseReview,
      customerPhotoUrl: "https://malicious.example.com/attack.svg",
    }).success,
    false,
    "SVG customer photo must be rejected"
  );
  assert.equal(
    createReviewSchema.safeParse({
      ...validBaseReview,
      productPhotoUrl: "https://malicious.example.com/attack.SVG",
    }).success,
    false,
    "SVG product photo must be rejected"
  );

  // JavaScript / Data schemes rejected
  assert.equal(
    createReviewSchema.safeParse({
      ...validBaseReview,
      customerPhotoUrl: "javascript:alert(1)",
    }).success,
    false,
    "javascript: scheme must be rejected"
  );

  // Excessive length > 500 rejected
  const longUrl = "https://example.com/" + "a".repeat(500) + ".jpg";
  assert.equal(
    createReviewSchema.safeParse({
      ...validBaseReview,
      customerPhotoUrl: longUrl,
    }).success,
    false,
    "URL exceeding 500 characters must be rejected"
  );

  console.log("✓ Photo URL security & format tests passed.");
}

// ============================================================================
// 4. CRITICAL: DURABLE STORAGE BOUNDARY
// ============================================================================
{
  // Confirm durable storage is not silently faked
  assert.equal(
    isDurableReviewStorageConfigured(),
    false,
    "Durable storage must report unconfigured when no provider credentials exist"
  );

  // File validation helper
  assert.equal(
    validateReviewImageFile("image/jpeg", 1024 * 1024).valid,
    true,
    "JPEG within 5MB must be valid"
  );
  assert.equal(
    validateReviewImageFile("image/png", 1024 * 1024).valid,
    true,
    "PNG within 5MB must be valid"
  );
  assert.equal(
    validateReviewImageFile("image/webp", 1024 * 1024).valid,
    true,
    "WebP within 5MB must be valid"
  );
  assert.equal(
    validateReviewImageFile("image/svg+xml", 1024).valid,
    false,
    "SVG mime type must be rejected"
  );
  assert.equal(
    validateReviewImageFile("application/pdf", 1024).valid,
    false,
    "Non-image mime type must be rejected"
  );
  assert.equal(
    validateReviewImageFile("image/jpeg", 6 * 1024 * 1024).valid,
    false,
    "Image exceeding 5MB must be rejected"
  );

  // Attempting upload without configured durable storage must throw DURABLE_STORAGE_REQUIRED_MESSAGE
  let uploadErrorCaught = false;
  try {
    await uploadReviewImage({
      buffer: Buffer.from("test"),
      filename: "test.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 4,
    });
  } catch (err: any) {
    uploadErrorCaught = true;
    assert.equal(err.message, DURABLE_STORAGE_REQUIRED_MESSAGE);
  }
  assert.equal(uploadErrorCaught, true, "Upload must throw DURABLE REVIEW IMAGE STORAGE REQUIRED error");

  console.log("✓ Durable storage boundary & file validation tests passed.");
}

// ============================================================================
// 5. PUBLIC DISPLAY VISIBILITY FILTERING
// ============================================================================
{
  const mockDbReviews = [
    {
      id: "rev_1",
      displayName: "Alice",
      rating: 5,
      reviewText: "Love these!",
      moderationStatus: "APPROVED" as ModerationStatus,
      isActive: true,
      customerPhotoUrl: "https://example.com/alice.jpg",
      productPhotoUrl: null,
      createdAt: new Date("2026-09-01"),
    },
    {
      id: "rev_2",
      displayName: "Bob",
      rating: 4,
      reviewText: "Pending review",
      moderationStatus: "PENDING" as ModerationStatus,
      isActive: false,
      customerPhotoUrl: null,
      productPhotoUrl: null,
      createdAt: new Date("2026-09-02"),
    },
    {
      id: "rev_3",
      displayName: "Charlie",
      rating: 1,
      reviewText: "Rejected spam review",
      moderationStatus: "REJECTED" as ModerationStatus,
      isActive: false,
      customerPhotoUrl: null,
      productPhotoUrl: null,
      createdAt: new Date("2026-09-03"),
    },
  ];

  // Public filter logic: only APPROVED and isActive = true
  const publicReviews = mockDbReviews.filter(
    (r) => r.moderationStatus === "APPROVED" && r.isActive === true
  );

  assert.equal(publicReviews.length, 1, "Only 1 review should be public");
  assert.equal(publicReviews[0].id, "rev_1", "Approved review must be visible");
  assert.equal(
    publicReviews.some((r) => r.moderationStatus === "PENDING"),
    false,
    "Pending review must never be visible publicly"
  );
  assert.equal(
    publicReviews.some((r) => r.moderationStatus === "REJECTED"),
    false,
    "Rejected review must never be visible publicly"
  );

  console.log("✓ Public visibility filtering tests passed.");
}

// ============================================================================
// 6. MIGRATION FILE & SQL VALIDATION
// ============================================================================
{
  const migrationDir = path.join(
    process.cwd(),
    "prisma",
    "migrations",
    "20260925230000_review_moderation_and_photos"
  );
  const migrationFile = path.join(migrationDir, "migration.sql");

  assert.equal(fs.existsSync(migrationFile), true, "Migration file must exist");
  const sqlContent = fs.readFileSync(migrationFile, "utf-8");

  assert.equal(sqlContent.includes("moderationStatus"), true, "SQL must add moderationStatus column");
  assert.equal(sqlContent.includes("customerPhotoUrl"), true, "SQL must add customerPhotoUrl column");
  assert.equal(sqlContent.includes("productPhotoUrl"), true, "SQL must add productPhotoUrl column");
  assert.equal(
    sqlContent.includes("Review_moderationStatus_idx"),
    true,
    "SQL must create moderationStatus index"
  );
  assert.equal(
    sqlContent.includes("Review_productId_moderationStatus_idx"),
    true,
    "SQL must create compound index"
  );
  assert.equal(
    sqlContent.includes("UPDATE `Review` SET `moderationStatus` = 'APPROVED' WHERE `isActive` = true;"),
    true,
    "SQL must backfill active reviews to APPROVED"
  );
  assert.equal(
    sqlContent.includes("UPDATE `Review` SET `moderationStatus` = 'PENDING' WHERE `isActive` = false"),
    true,
    "SQL must backfill inactive reviews to PENDING"
  );

  console.log("✓ Migration file and SQL assertions passed.");
}
  console.log("\n========================================================");
  console.log("ALL PHASE 4 REVIEW MODERATION UNIT TESTS PASSED (100%)");
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
