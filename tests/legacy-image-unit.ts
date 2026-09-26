import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyImageSource } from "../src/components/ui/FallbackImage";

describe("Legacy Image Classification & Fallback Architecture (Section 5 - 7)", () => {
  it("Cloudinary URL classified as legacy-remote", () => {
    const cloudinaryUrl = "https://res.cloudinary.com/knoos/image/upload/v1720000000/products/derby.webp";
    const res = classifyImageSource(cloudinaryUrl);
    assert.strictEqual(res.type, "legacy-remote");
    if (res.type === "legacy-remote") {
      assert.strictEqual(res.url, cloudinaryUrl);
    }
  });

  it("local path classified as local", () => {
    const localPaths = [
      "/uploads/products/derby-shoe.jpg",
      "/images/process-footwear.jpg",
      "/images/men-category.jpg",
      "/icons/logo.svg",
    ];

    for (const path of localPaths) {
      const res = classifyImageSource(path);
      assert.strictEqual(res.type, "local", `Expected local for ${path}`);
      if (res.type === "local") {
        assert.strictEqual(res.url, path);
      }
    }
  });

  it("old Hostinger HTTPS URL classified as legacy remote", () => {
    const hostingerUrl = "https://u406400049.hostinger.com/public/uploads/oxford.png";
    const res = classifyImageSource(hostingerUrl);
    assert.strictEqual(res.type, "legacy-remote");
    if (res.type === "legacy-remote") {
      assert.strictEqual(res.url, hostingerUrl);
    }
  });

  it("arbitrary HTTPS legacy URL does not crash and is classified as legacy remote", () => {
    const urls = [
      "https://example.com/shoes/derby.jpg",
      "https://storage.googleapis.com/knoos-legacy/photo.webp",
      "http://insecure-legacy-host.com/images/1.png",
    ];

    for (const url of urls) {
      assert.doesNotThrow(() => {
        const res = classifyImageSource(url);
        assert.strictEqual(res.type, "legacy-remote");
      });
    }
  });

  it("javascript: is strictly rejected as invalid", () => {
    const dangerous = [
      "javascript:alert(1)",
      "JAVASCRIPT:void(0)",
      " javascript:/*code*/ ",
    ];

    for (const uri of dangerous) {
      const res = classifyImageSource(uri);
      assert.strictEqual(res.type, "invalid", `Expected invalid for ${uri}`);
    }
  });

  it("data:, file:, and vbscript: are strictly rejected as invalid", () => {
    const invalidSchemes = [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "file:///etc/passwd",
      "vbscript:msgbox",
    ];

    for (const uri of invalidSchemes) {
      const res = classifyImageSource(uri);
      assert.strictEqual(res.type, "invalid", `Expected invalid for ${uri}`);
    }
  });

  it("malformed source falls back to invalid without throwing", () => {
    const malformed = [
      "htt ps://bad url with spaces",
      "://missing-scheme",
      "https://",
      "http//invalid",
      "just-a-random-string",
    ];

    for (const src of malformed) {
      assert.doesNotThrow(() => {
        const res = classifyImageSource(src);
        assert.strictEqual(res.type, "invalid", `Expected invalid for ${src}`);
      });
    }
  });

  it("empty/null/whitespace source falls back to invalid", () => {
    const emptySources = [
      "",
      "   ",
      null,
      undefined,
      false,
      123,
      {},
    ];

    for (const src of emptySources) {
      const res = classifyImageSource(src);
      assert.strictEqual(res.type, "invalid");
    }
  });
});
