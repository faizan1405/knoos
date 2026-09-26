import { describe, it } from "node:test";
import assert from "node:assert";
import {
  validateImageFile,
  generateCloudinarySignature,
  generateSafePublicId,
  uploadProductImage,
  MAX_IMAGE_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
} from "../src/lib/image-storage";

describe("Durable Cloudinary Image Storage Unit Tests (Section 8 - 12)", () => {
  it("validates allowed image formats (JPEG, JPG, PNG, WEBP)", () => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "IMAGE/JPEG", "image/PNG"];
    for (const t of validTypes) {
      const res = validateImageFile({ size: 1024, type: t });
      assert.strictEqual(res.valid, true, `MIME type '${t}' should be allowed`);
    }
  });

  it("rejects unauthorized file formats (GIF, SVG, PDF, EXE)", () => {
    const invalidTypes = ["image/gif", "image/svg+xml", "application/pdf", "application/x-msdownload", "text/plain"];
    for (const t of invalidTypes) {
      const res = validateImageFile({ size: 1024, type: t });
      assert.strictEqual(res.valid, false, `MIME type '${t}' should be rejected`);
      assert.strictEqual(res.code, "INVALID_FILE_TYPE");
    }
  });

  it("rejects file exceeding 5MB limit", () => {
    const oversized = MAX_IMAGE_FILE_SIZE + 1;
    const res = validateImageFile({ size: oversized, type: "image/jpeg" });
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.code, "FILE_TOO_LARGE");
    assert.strictEqual(res.error, "File size too large. Maximum 5MB allowed.");
  });

  it("accepts file within 5MB limit", () => {
    const validSize = MAX_IMAGE_FILE_SIZE - 100;
    const res = validateImageFile({ size: validSize, type: "image/jpeg" });
    assert.strictEqual(res.valid, true);
  });

  it("generates deterministic and sorted Cloudinary signature", () => {
    const params = {
      folder: "knoos/products",
      public_id: "test_123",
      timestamp: 1700000000,
    };
    const secret = "my_cloudinary_secret";

    // Alphabetical order: folder=knoos/products&public_id=test_123&timestamp=1700000000my_cloudinary_secret
    const sig1 = generateCloudinarySignature(params, secret);
    const sig2 = generateCloudinarySignature(
      {
        timestamp: 1700000000,
        public_id: "test_123",
        folder: "knoos/products",
      },
      secret
    );

    assert.strictEqual(typeof sig1, "string");
    assert.strictEqual(sig1.length, 40); // SHA-1 is 40 hex characters
    assert.strictEqual(sig1, sig2, "Signature must be order-independent of input object keys");
  });

  it("generates safe, sanitized unique public IDs", () => {
    const id1 = generateSafePublicId("My Product Photo! (1).png");
    assert.ok(!id1.includes("!"), "Special characters must be stripped or replaced");
    assert.ok(!id1.includes("("));
    assert.ok(!id1.includes(" "));
    assert.ok(!id1.endsWith(".png"), "Extension should be stripped");

    const id2 = generateSafePublicId("My Product Photo! (1).png");
    assert.notStrictEqual(id1, id2, "Public IDs should include random suffix for collision prevention");
  });

  it("returns IMAGE_STORAGE_NOT_CONFIGURED when Cloudinary credentials are missing", async () => {
    // Preserve current env
    const prevCloud = process.env.CLOUDINARY_CLOUD_NAME;
    const prevKey = process.env.CLOUDINARY_API_KEY;
    const prevSecret = process.env.CLOUDINARY_API_SECRET;

    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    try {
      const mockFile = {
        name: "test.jpg",
        size: 1024,
        type: "image/jpeg",
        arrayBuffer: async () => new ArrayBuffer(1024),
      };

      const result = await uploadProductImage(mockFile);
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.strictEqual(result.code, "IMAGE_STORAGE_NOT_CONFIGURED");
        assert.strictEqual(result.error, "Permanent image storage is not configured yet.");
      }
    } finally {
      // Restore
      if (prevCloud !== undefined) process.env.CLOUDINARY_CLOUD_NAME = prevCloud;
      if (prevKey !== undefined) process.env.CLOUDINARY_API_KEY = prevKey;
      if (prevSecret !== undefined) process.env.CLOUDINARY_API_SECRET = prevSecret;
    }
  });
});
