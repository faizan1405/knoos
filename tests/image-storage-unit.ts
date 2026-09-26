import assert from "node:assert/strict";
import {
  getHostingerUploadRoot,
  getProductUploadDirectory,
  validateImageFile,
  generateSafeFilename,
  isSafeFilename,
  resolveProductImagePath,
  saveProductImage,
  getProductImagePath,
  MAX_IMAGE_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
} from "../src/lib/image-storage";

import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, chmodSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

const TEST_ROOT = mkdtempSync(path.join(tmpdir(), "knoos-image-test-"));

async function withEnv(root: string | undefined, home: string | undefined, fn: () => Promise<void>) {
  const prevRoot = process.env.HOSTINGER_UPLOAD_ROOT;
  const prevHome = process.env.HOME;
  if (root === undefined) {
    delete process.env.HOSTINGER_UPLOAD_ROOT;
  } else {
    process.env.HOSTINGER_UPLOAD_ROOT = root;
  }
  if (home === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = home;
  }
  try {
    await fn();
  } finally {
    if (prevRoot === undefined) {
      delete process.env.HOSTINGER_UPLOAD_ROOT;
    } else {
      process.env.HOSTINGER_UPLOAD_ROOT = prevRoot;
    }
    if (prevHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = prevHome;
    }
  }
}

function createMockFile(bytes: number, mimeType: string, name = "test.jpg") {
  const buffer = new ArrayBuffer(bytes);
  return {
    arrayBuffer: async () => buffer,
    name,
    size: bytes,
    type: mimeType,
  };
}

async function runTests() {
  console.log("Running Hostinger Image Storage Unit Tests...\n");

  let passed = 0;
  let failed = 0;

  function assertEqual(actual: unknown, expected: unknown, label?: string) {
    if (actual !== expected) {
      throw new Error(`${label ? label + ": " : ""}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  function assertOk(value: unknown, label: string) {
    if (!value) throw new Error(label);
  }

  async function test(label: string, fn: () => Promise<void>) {
    try {
      await fn();
      passed++;
      console.log(`  PASS: ${label}`);
    } catch (err: unknown) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  FAIL: ${label} — ${message}`);
    }
  }

  // ─── Storage Root Resolution ─────────────────────────────────────────────

  console.log("\n[Storage Root Resolution]");
  await test("uses HOSTINGER_UPLOAD_ROOT when set", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      assertEqual(getHostingerUploadRoot(), TEST_ROOT);
    });
  });

  await test("falls back to $HOME/knoos-storage when HOME is set", async () => {
    await withEnv(undefined, TEST_ROOT, async () => {
      assertEqual(getHostingerUploadRoot(), path.join(TEST_ROOT, "knoos-storage"));
    });
  });

  await test("returns null when neither HOSTINGER_UPLOAD_ROOT nor HOME is available", async () => {
    await withEnv(undefined, undefined, async () => {
      assertEqual(getHostingerUploadRoot(), null);
    });
  });

  await test("getProductUploadDirectory returns products subdirectory", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      assertEqual(getProductUploadDirectory(), path.join(TEST_ROOT, "products"));
    });
  });

  await test("getProductUploadDirectory returns null when no storage root", async () => {
    await withEnv(undefined, undefined, async () => {
      assertEqual(getProductUploadDirectory(), null);
    });
  });

  // ─── File Validation ────────────────────────────────────────────────────

  console.log("\n[File Validation]");
  await test("accepts valid MIME types (jpeg, jpg, png, webp)", async () => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    for (const t of validTypes) {
      const res = validateImageFile({ size: 1024, type: t });
      assertEqual(res.valid, true, `MIME type '${t}' should be allowed`);
    }
  });

  await test("rejects GIF", async () => {
    const res = validateImageFile({ size: 1024, type: "image/gif" });
    assertEqual(res.valid, false);
  });

  await test("rejects SVG", async () => {
    const res = validateImageFile({ size: 1024, type: "image/svg+xml" });
    assertEqual(res.valid, false);
  });

  await test("rejects PDF", async () => {
    const res = validateImageFile({ size: 1024, type: "application/pdf" });
    assertEqual(res.valid, false);
  });

  await test("rejects files exceeding 5MB", async () => {
    const oversized = MAX_IMAGE_FILE_SIZE + 1;
    const res = validateImageFile({ size: oversized, type: "image/jpeg" });
    assertEqual(res.valid, false);
    if (!res.valid) {
      assertEqual(res.code, "FILE_TOO_LARGE");
      assertEqual(res.error, "File size too large. Maximum 5MB allowed.");
    }
  });

  await test("accepts file exactly at 5MB boundary", async () => {
    const res = validateImageFile({ size: MAX_IMAGE_FILE_SIZE, type: "image/jpeg" });
    assertEqual(res.valid, true);
  });

  await test("accepts file well under 5MB", async () => {
    const res = validateImageFile({ size: 1024, type: "image/jpeg" });
    assertEqual(res.valid, true);
  });

  // ─── Filename Generation ────────────────────────────────────────────────

  console.log("\n[Filename Generation]");
  await test("strips special characters from filename", async () => {
    const name = generateSafeFilename("My Product Photo! (1).jpg");
    assertOk(!name.includes("!"), "Should strip exclamation marks");
    assertOk(!name.includes("("), "Should strip parentheses");
    assertOk(!name.includes(" "), "Should strip spaces");
  });

  await test("preserves safe characters", async () => {
    const name = generateSafeFilename("simple_product-name_123.jpg");
    assertOk(name.includes("simple"), "Should preserve letters");
    assertOk(name.includes("product"), "Should preserve letters");
    assertOk(name.includes("-"), "Should preserve dashes");
    assertOk(name.includes("_"), "Should preserve underscores");
  });

  await test("produces unique filenames for same input", async () => {
    const names = new Set<string>();
    for (let i = 0; i < 10; i++) {
      names.add(generateSafeFilename("same.jpg"));
    }
    assertEqual(names.size, 10, "All generated names should be unique");
  });

  await test("starts with timestamp", async () => {
    const before = Date.now();
    const name = generateSafeFilename("test.jpg");
    const after = Date.now();
    const timestamp = Number.parseInt(name.split("-")[0]!, 10);
    assertOk(timestamp >= before, "Timestamp should be >= creation time");
    assertOk(timestamp <= after, "Timestamp should be <= creation time");
  });

  await test("handles empty original filename", async () => {
    const name = generateSafeFilename("");
    assertOk(name.length > 0, "Should produce non-empty filename");
    assertOk(name.endsWith(".bin"), "Empty filename should default to .bin extension");
  });

  await test("produces exactly one dot (the extension)", async () => {
    const name = generateSafeFilename("my.file.name.jpg");
    const dots = (name.match(/\./g) || []).length;
    assertEqual(dots, 1, "Should have exactly one dot for the extension");
  });

  // ─── Filename Safety ────────────────────────────────────────────────────

  console.log("\n[Filename Safety]");
  await test("accepts valid product filenames", async () => {
    const valid = ["product-123.jpg", "my_product.webp", "shoe123.png"];
    for (const f of valid) {
      assertOk(isSafeFilename(f), `Should accept: ${f}`);
    }
  });

  await test("rejects null bytes", async () => {
    assertOk(!isSafeFilename("test\0.jpg"), "Should reject null byte");
  });

  await test("rejects forward slashes", async () => {
    assertOk(!isSafeFilename("path/to/file.jpg"), "Should reject forward slash");
  });

  await test("rejects backslashes", async () => {
    assertOk(!isSafeFilename("path\\to\\file.jpg"), "Should reject backslash");
  });

  await test("rejects double-dot sequences", async () => {
    assertOk(!isSafeFilename("../../etc/passwd.jpg"), "Should reject ..");
  });

  await test("rejects URL-encoded traversal", async () => {
    assertOk(!isSafeFilename("%2e%2e%2f%2e%2e%2fetc%2fpasswd"), "Should reject encoded traversal");
  });

  await test("rejects empty filename", async () => {
    assertOk(!isSafeFilename(""), "Should reject empty string");
  });

  await test("rejects non-string input", async () => {
    assertOk(!isSafeFilename(null as unknown as string), "Should reject null");
    assertOk(!isSafeFilename(undefined as unknown as string), "Should reject undefined");
  });

  await test("rejects filenames without recognized image extension", async () => {
    assertOk(!isSafeFilename("no-extension"), "Should reject no extension");
    assertOk(!isSafeFilename("document.pdf"), "Should reject non-image extension");
  });

  await test("rejects shell metacharacters", async () => {
    assertOk(!isSafeFilename("test`whoami`.jpg"), "Should reject backtick");
    assertOk(!isSafeFilename("test;ls.jpg"), "Should reject semicolon");
    assertOk(!isSafeFilename("test$HOME.jpg"), "Should reject dollar sign");
  });

  // ─── Path Resolution ────────────────────────────────────────────────────

  console.log("\n[Path Resolution]");
  await test("resolves valid filename inside product directory", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const resolved = resolveProductImagePath("product-123.jpg");
      assertOk(resolved !== null, "Should resolve valid filename");
      if (resolved) {
        assertOk(resolved.startsWith(path.join(TEST_ROOT, "products")), "Should be inside products dir");
      }
    });
  });

  await test("returns null for traversal attempts", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      assertEqual(resolveProductImagePath("../../.env"), null);
    });
  });

  await test("returns null when no storage root configured", async () => {
    await withEnv(undefined, undefined, async () => {
      assertEqual(resolveProductImagePath("product.jpg"), null);
    });
  });

  await test("resolves to absolute path starting with product dir", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const resolved = resolveProductImagePath("test.jpg");
      assertOk(resolved !== null, "Should resolve to non-null path");
      if (resolved) {
        assertOk(path.isAbsolute(resolved), "Should be absolute path");
      }
    });
  });

  // ─── Save Product Image ─────────────────────────────────────────────────

  console.log("\n[Save Product Image]");
  await test("accepts valid JPEG upload", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage(createMockFile(1024, "image/jpeg", "test.jpg"));
      assertEqual(result.success, true);
      if (result.success) {
        assertOk(result.url.startsWith("/media/products/"), `URL: ${result.url}`);
        assertOk(result.filename.endsWith(".jpg"), "Should preserve jpg extension");
      }
    });
  });

  await test("accepts valid PNG upload", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage(createMockFile(1024, "image/png", "test.png"));
      assertEqual(result.success, true);
      if (result.success) {
        assertOk(result.filename.endsWith(".png"), "Should preserve png extension");
      }
    });
  });

  await test("accepts valid WEBP upload", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage(createMockFile(1024, "image/webp", "test.webp"));
      assertEqual(result.success, true);
      if (result.success) {
        assertOk(result.filename.endsWith(".webp"), "Should preserve webp extension");
      }
    });
  });

  await test("rejects invalid file types", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const invalid = ["image/gif", "image/svg+xml", "application/pdf"];
      for (const type of invalid) {
        const result = await saveProductImage(createMockFile(1024, type));
        assertEqual(result.success, false, `Should reject ${type}`);
      }
    });
  });

  await test("rejects files over 5MB", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage(createMockFile(MAX_IMAGE_FILE_SIZE + 1, "image/jpeg"));
      assertEqual(result.success, false);
      if (!result.success) {
        assertEqual(result.code, "FILE_TOO_LARGE");
      }
    });
  });

  await test("generated filename is safe", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage(createMockFile(1024, "image/jpeg", "../../etc/passwd.jpg"));
      assertEqual(result.success, true);
      if (result.success) {
        assertOk(isSafeFilename(result.filename), `Filename should be safe: ${result.filename}`);
      }
    });
  });

  await test("filename is unique", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const results = await Promise.all([
        saveProductImage(createMockFile(100, "image/jpeg", "unique.jpg")),
        saveProductImage(createMockFile(100, "image/jpeg", "unique.jpg")),
        saveProductImage(createMockFile(100, "image/jpeg", "unique.jpg")),
      ]);
      const filenames = results
        .filter((r): r is { success: true; url: string; filename: string } => r.success)
        .map((r) => r.filename);
      assertEqual(new Set(filenames).size, filenames.length, "All filenames should be unique");
    });
  });

  await test("image bytes successfully write to persistent directory", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage(createMockFile(2048, "image/webp", "shoe.webp"));
      assertEqual(result.success, true);
      if (result.success) {
        const filePath = path.join(path.join(TEST_ROOT, "products"), result.filename);
        assertOk(existsSync(filePath), "File should exist on disk");
        const content = readFileSync(filePath);
        assertEqual(content.length, 2048, "File bytes should match");
      }
    });
  });

  await test("returned public URL starts with /media/products/", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage(createMockFile(100, "image/webp", "format-test.webp"));
      assertEqual(result.success, true);
      if (result.success) {
        assertOk(result.url.startsWith("/media/products/"), `URL: ${result.url}`);
      }
    });
  });

  await test("returned URL does not expose absolute filesystem path", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage(createMockFile(100, "image/png", "path-test.png"));
      assertEqual(result.success, true);
      if (result.success) {
        assertOk(!result.url.startsWith("/home"), "Should not expose /home");
        assertOk(!result.url.startsWith(TEST_ROOT), "Should not expose storage root");
        assertOk(!result.url.includes("file://"), "Should not use file:// scheme");
      }
    });
  });

  await test("does not return Cloudinary URLs", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage(createMockFile(100, "image/jpeg", "no-cloud.jpg"));
      assertEqual(result.success, true);
      if (result.success) {
        assertOk(!result.url.includes("cloudinary.com"), "Should not use Cloudinary");
        assertOk(!result.url.includes("res.cloudinary.com"), "Should not use res.cloudinary.com");
      }
    });
  });

  // ─── Saved File Roundtrip ───────────────────────────────────────────────

  console.log("\n[Saved File Roundtrip]");
  await test("saved file can be read through getProductImagePath", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage({
        arrayBuffer: async () => new ArrayBuffer(1024),
        name: "roundtrip-test.jpg",
        size: 1024,
        type: "image/jpeg",
      });
      assertEqual(result.success, true);
      if (result.success) {
        const filePath = await getProductImagePath(result.filename);
        assertOk(filePath !== null, "File should be found");
        assertOk(existsSync(filePath!), "File should exist on disk");
        const content = readFileSync(filePath!);
        assertEqual(content.length, 1024);
      }
    });
  });

  await test("getProductImagePath returns null for missing file", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const filePath = await getProductImagePath("nonexistent-file.jpg");
      assertEqual(filePath, null);
    });
  });

  await test("getProductImagePath rejects traversal", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const filePath = await getProductImagePath("../../.env");
      assertEqual(filePath, null);
    });
  });

  // ─── Path Traversal Security ────────────────────────────────────────────

  console.log("\n[Path Traversal Security]");
  const traversalAttempts = [
    "../../.env",
    "../../secret.txt",
    "..\\..\\secret.txt",
    "%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "%2e%2e/test.jpg",
    "%5c%5cserver%5csecret.jpg",
    "subdir/../../etc/passwd",
    "/absolute/path/file.jpg",
    "~/.ssh/id_rsa.jpg",
    "test`whoami`.jpg",
    "test;ls.jpg",
    "test$HOME.jpg",
  ];

  for (const attempt of traversalAttempts) {
    await test(`rejects traversal: ${attempt}`, async () => {
      await withEnv(TEST_ROOT, undefined, async () => {
        assertEqual(isSafeFilename(attempt), false, `isSafeFilename should reject: ${attempt}`);
        assertEqual(resolveProductImagePath(attempt), null, `resolveProductImagePath should reject: ${attempt}`);
        const pathResult = await getProductImagePath(attempt);
        assertEqual(pathResult, null, `getProductImagePath should reject: ${attempt}`);
      });
    });
  }

  await test("saveProductImage sanitizes malicious filenames to safe names", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage({
        arrayBuffer: async () => new ArrayBuffer(100),
        name: "../../etc/passwd.jpg",
        size: 100,
        type: "image/jpeg",
      });
      assertEqual(result.success, true);
      if (result.success) {
        assertOk(result.url.startsWith("/media/products/"), "URL should start with /media/products/");
        assertOk(!result.filename.includes(".."), "Filename should not contain ..");
        assertOk(!result.filename.includes("/"), "Filename should not contain /");
        assertOk(!result.filename.includes("\\"), "Filename should not contain \\");
      }
    });
  });

  // ─── Filename Uniqueness ────────────────────────────────────────────────

  console.log("\n[Filename Uniqueness]");
  await test("generates unique filenames across multiple calls", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const results = await Promise.all([
        saveProductImage(createMockFile(100, "image/jpeg", "unique-test.jpg")),
        saveProductImage(createMockFile(100, "image/jpeg", "unique-test.jpg")),
        saveProductImage(createMockFile(100, "image/jpeg", "unique-test.jpg")),
      ]);
      const filenames = results
        .filter((r): r is { success: true; url: string; filename: string } => r.success)
        .map((r) => r.filename);
      assertEqual(new Set(filenames).size, filenames.length, "All filenames should be unique");
    });
  });

  // ─── Returned URL Format ────────────────────────────────────────────────

  console.log("\n[Returned URL Format]");
  await test("returns URL starting with /media/products/", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage({
        arrayBuffer: async () => new ArrayBuffer(100),
        name: "format-test.webp",
        size: 100,
        type: "image/webp",
      });
      assertEqual(result.success, true);
      if (result.success) {
        assertOk(result.url.startsWith("/media/products/"), `URL: ${result.url}`);
      }
    });
  });

  await test("returns URL without absolute filesystem path", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage({
        arrayBuffer: async () => new ArrayBuffer(100),
        name: "path-test.png",
        size: 100,
        type: "image/png",
      });
      assertEqual(result.success, true);
      if (result.success) {
        assertOk(!result.url.startsWith("/home"), "Should not expose absolute path");
        assertOk(!result.url.startsWith(TEST_ROOT), "Should not expose storage root");
        assertOk(!result.url.includes("file://"), "Should not use file:// scheme");
      }
    });
  });

  await test("does not return Cloudinary URLs", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage({
        arrayBuffer: async () => new ArrayBuffer(100),
        name: "no-cloud.jpg",
        size: 100,
        type: "image/jpeg",
      });
      assertEqual(result.success, true);
      if (result.success) {
        assertOk(!result.url.includes("cloudinary.com"), "Should not use Cloudinary");
        assertOk(!result.url.includes("res.cloudinary.com"), "Should not use res.cloudinary.com");
      }
    });
  });

  // ─── Storage Failure Behavior ───────────────────────────────────────────

  console.log("\n[Storage Failure Behavior]");
  await test("returns HOSTINGER_STORAGE_NOT_AVAILABLE when no root configured", async () => {
    await withEnv(undefined, undefined, async () => {
      const result = await saveProductImage(createMockFile(1024, "image/jpeg"));
      assertEqual(result.success, false);
      if (!result.success) {
        assertEqual(result.code, "HOSTINGER_STORAGE_NOT_AVAILABLE");
        assertEqual(result.error, "Persistent Hostinger image storage is not available.");
      }
    });
  });

  await test("does not silently fallback to public/uploads", async () => {
    await withEnv(undefined, undefined, async () => {
      const result = await saveProductImage(createMockFile(1024, "image/jpeg"));
      assertEqual(result.success, false);
      if (!result.success) {
        assertOk(result.error !== "Failed to upload image", "Should not be generic upload error");
        assertEqual(result.code, "HOSTINGER_STORAGE_NOT_AVAILABLE");
      }
    });
  });

  await test("returns error when storage directory is not writable", async () => {
    const readOnlyDir = path.join(TEST_ROOT, "readonly");
    mkdirSync(readOnlyDir, { recursive: true });
    try {
      chmodSync(readOnlyDir, 0o444);
    } catch {
      console.log("  SKIP: writable test (chmod not supported on this platform)");
      passed++;
      return;
    }

    // Verify chmod actually made it read-only (Windows may silently ignore)
    try {
      mkdirSync(path.join(readOnlyDir, "__writetest__"), { recursive: true });
      console.log("  SKIP: writable test (chmod didn't restrict on this platform)");
      passed++;
      return;
    } catch {
      // directory is read-only, proceed with test
    }

    await withEnv(readOnlyDir, undefined, async () => {
      const result = await saveProductImage(createMockFile(1024, "image/jpeg"));
      assertEqual(result.success, false);
      if (!result.success) {
        assertEqual(result.code, "STORAGE_NOT_WRITABLE");
      }
    });

    try {
      chmodSync(readOnlyDir, 0o755);
    } catch {
      // ignore cleanup errors
    }
  });

  await test("rejects GIF with proper error code", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage(createMockFile(1024, "image/gif"));
      assertEqual(result.success, false);
      if (!result.success) {
        assertEqual(result.code, "INVALID_FILE_TYPE");
      }
    });
  });

  await test("rejects files over 5MB with proper error code", async () => {
    await withEnv(TEST_ROOT, undefined, async () => {
      const result = await saveProductImage(createMockFile(MAX_IMAGE_FILE_SIZE + 1, "image/jpeg"));
      assertEqual(result.success, false);
      if (!result.success) {
        assertEqual(result.code, "FILE_TOO_LARGE");
      }
    });
  });

  // ─── Summary ────────────────────────────────────────────────────────────

  console.log(`\n========================================`);
  console.log(`  PASS: ${passed}  FAIL: ${failed}`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests();
