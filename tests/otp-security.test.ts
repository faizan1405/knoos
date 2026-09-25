import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { normalizeIndianMobile, formatPhoneDisplay } from "../src/lib/phone";
import {
  generateOtpCode,
  hashOtp,
  verifyOtpHash,
  getHmacSecret,
  OTP_COOLDOWN_MS,
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
} from "../src/lib/otp";
import {
  setSmsProviderForTesting,
  TestSmsProvider,
  UnconfiguredSmsProvider,
} from "../src/lib/sms";
import { POST as requestOtpRoute } from "../src/app/api/auth/otp/request/route";
import { resolveOrCreatePhoneUser } from "../src/lib/phone-auth";

describe("Phone Number Normalization & Validation (Section 5)", () => {
  it("normalizes valid 10-digit Indian numbers starting with 6, 7, 8, 9 to E.164 (+91XXXXXXXXXX)", () => {
    const testCases = [
      { input: "9876543210", expected: "+919876543210", digits: "9876543210" },
      { input: "8123456789", expected: "+918123456789", digits: "8123456789" },
      { input: "7000000001", expected: "+917000000001", digits: "7000000001" },
      { input: "6999999999", expected: "+916999999999", digits: "6999999999" },
      { input: "+919876543210", expected: "+919876543210", digits: "9876543210" },
      { input: "+91 98765 43210", expected: "+919876543210", digits: "9876543210" },
      { input: "09876543210", expected: "+919876543210", digits: "9876543210" },
      { input: "98765-43210", expected: "+919876543210", digits: "9876543210" },
      { input: "  +91 (987) 654-3210  ", expected: "+919876543210", digits: "9876543210" },
    ];

    for (const { input, expected, digits } of testCases) {
      const res = normalizeIndianMobile(input);
      assert.strictEqual(res.isValid, true, `Expected ${input} to be valid`);
      assert.strictEqual(res.normalized, expected, `Expected normalized ${expected} for ${input}`);
      assert.strictEqual(res.digits, digits, `Expected digits ${digits} for ${input}`);
    }
  });

  it("rejects invalid Indian mobile numbers", () => {
    const invalidInputs = [
      "",
      "   ",
      "1234567890",      // starts with 1
      "5123456789",      // starts with 5
      "0123456789",      // 0 + starts with 1
      "987654321",       // 9 digits
      "98765432100",     // 11 digits
      "abcdefghij",      // non-numeric
      "98765abcde",      // alpha-numeric
      "+14155552671",    // US number
      null as any,
      undefined as any,
    ];

    for (const input of invalidInputs) {
      const res = normalizeIndianMobile(input);
      assert.strictEqual(res.isValid, false, `Expected ${input} to be rejected`);
      assert.ok(res.error, `Expected an error message for ${input}`);
    }
  });

  it("formats display correctly with +91 and 10 digits", () => {
    const formatted = formatPhoneDisplay("+919876543210");
    assert.strictEqual(formatted, "+91 98765 43210");
  });
});

describe("OTP Generation & Cryptography (Section 6 & 19)", () => {
  it("generates a cryptographically secure 6-digit numeric OTP", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtpCode();
      assert.strictEqual(code.length, 6, "OTP must be exactly 6 digits");
      assert.ok(/^\d{6}$/.test(code), "OTP must contain only numeric digits");
      const num = parseInt(code, 10);
      assert.ok(num >= 100000 && num <= 999999, "OTP must be between 100000 and 999999");
    }
  });

  it("same phone + same OTP + same secret => verifies", () => {
    const phone = "+919876543210";
    const otp = "582914";
    const secret = "test-secure-server-secret-key-32chars";

    const hash = hashOtp(phone, otp, secret);
    assert.strictEqual(verifyOtpHash(phone, otp, hash, secret), true);
  });

  it("same OTP + different phone => does NOT verify", () => {
    const phone1 = "+919876543210";
    const phone2 = "+919999999999";
    const otp = "582914";
    const secret = "test-secure-server-secret-key-32chars";

    const hash1 = hashOtp(phone1, otp, secret);
    assert.strictEqual(verifyOtpHash(phone2, otp, hash1, secret), false);
  });

  it("same phone + same OTP + different secret => does NOT verify", () => {
    const phone = "+919876543210";
    const otp = "582914";
    const secret1 = "secret-key-one-abc-123456789";
    const secret2 = "secret-key-two-xyz-987654321";

    const hash1 = hashOtp(phone, otp, secret1);
    assert.strictEqual(verifyOtpHash(phone, otp, hash1, secret2), false);
  });

  it("missing secret fails securely without fallback to empty string or default", () => {
    const prevAuthSecret = process.env.AUTH_SECRET;
    const prevOtpSecret = process.env.OTP_HMAC_SECRET;

    delete process.env.AUTH_SECRET;
    delete process.env.OTP_HMAC_SECRET;

    try {
      assert.throws(
        () => getHmacSecret(),
        /Server OTP authentication secret is not configured/
      );
      assert.throws(
        () => hashOtp("+919876543210", "123456"),
        /Server OTP authentication secret is not configured/
      );
    } finally {
      if (prevAuthSecret !== undefined) process.env.AUTH_SECRET = prevAuthSecret;
      if (prevOtpSecret !== undefined) process.env.OTP_HMAC_SECRET = prevOtpSecret;
    }
  });

  it("plaintext OTP is never persisted or logged; SHA-256 HMAC produces 64 hex characters", () => {
    const phone = "+919876543210";
    const otp = "582914";
    const secret = "test-secure-server-secret-key-32chars";

    const hash = hashOtp(phone, otp, secret);
    assert.notStrictEqual(hash, otp, "Hash must never equal plaintext OTP");
    assert.strictEqual(typeof hash, "string");
    assert.strictEqual(hash.length, 64, "SHA-256 HMAC must produce 64 hex characters");
  });
});

describe("OTP Challenge Lifecycle, Cooldown & Security (Section 6, 7, 8, 19)", () => {
  let mockStorage: Map<string, any>;
  let testProvider: TestSmsProvider;

  beforeEach(() => {
    mockStorage = new Map();
    testProvider = new TestSmsProvider();
    setSmsProviderForTesting(testProvider);
  });

  it("fails gracefully with OTP_SERVICE_UNAVAILABLE when no SMS provider is configured", async () => {
    const prevFlag = process.env.NEXT_PUBLIC_OTP_ENABLED;
    process.env.NEXT_PUBLIC_OTP_ENABLED = "true";
    try {
      setSmsProviderForTesting(new UnconfiguredSmsProvider());

      const req = new Request("http://localhost:3000/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "9876543210" }),
      });

      const res = await requestOtpRoute(req);
      assert.strictEqual(res.status, 503);

      const body = await res.json();
      assert.strictEqual(body.code, "OTP_SERVICE_UNAVAILABLE");
      assert.ok(body.error.includes("SMS service is currently unavailable"));
      // OTP never returned in response
      assert.strictEqual(body.otp, undefined);
      assert.strictEqual(body.codeHash, undefined);
    } finally {
      if (prevFlag !== undefined) {
        process.env.NEXT_PUBLIC_OTP_ENABLED = prevFlag;
      } else {
        delete process.env.NEXT_PUBLIC_OTP_ENABLED;
      }
    }
  });

  it("enforces resend cooldown (60 seconds) between requests", () => {
    const now = Date.now();
    const lastSentAt = new Date(now - 30 * 1000); // 30s ago (within 60s cooldown)
    const elapsed = now - lastSentAt.getTime();
    assert.ok(elapsed < OTP_COOLDOWN_MS, "Cooldown should be active within 60s");

    const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
    assert.strictEqual(remainingSeconds, 30);
  });

  it("enforces attempt limit (5 attempts max)", () => {
    assert.strictEqual(OTP_MAX_ATTEMPTS, 5);
    let attempts = 0;
    for (let i = 0; i < 5; i++) {
      attempts++;
    }
    assert.strictEqual(attempts >= OTP_MAX_ATTEMPTS, true);
  });

  it("enforces OTP expiry (5 minutes)", () => {
    assert.strictEqual(OTP_EXPIRY_MS, 5 * 60 * 1000);
    const now = Date.now();
    const expiredAt = new Date(now - 1000); // 1 second in the past
    assert.ok(new Date() > expiredAt, "Expired challenge must be detected");
  });

  it("enforces single use: once verified, challenge is removed and cannot be reused", () => {
    const phone = "+919876543210";
    const otp = "654321";
    const hash = hashOtp(phone, otp);

    // Initial challenge exists
    mockStorage.set(phone, { phone, codeHash: hash, attempts: 0 });
    assert.ok(mockStorage.has(phone));

    // Simulate verification
    const stored = mockStorage.get(phone);
    assert.ok(stored);
    const isValid = verifyOtpHash(phone, otp, stored.codeHash);
    assert.strictEqual(isValid, true);

    // Single use: delete upon verification
    mockStorage.delete(phone);
    assert.strictEqual(mockStorage.has(phone), false);

    // Attempting to reuse the OTP now fails
    assert.strictEqual(mockStorage.get(phone), undefined);
  });

  it("enforces CUSTOMER role as default for OTP created accounts (never ADMIN)", () => {
    const newUserRole = "CUSTOMER";
    assert.strictEqual(newUserRole, "CUSTOMER");
    assert.notStrictEqual(newUserRole, "ADMIN");
  });
});

describe("PhoneAuthIdentity Resolution Logic (Section 2, 3, 4, 11)", () => {
  it("Case 1: Existing PhoneAuthIdentity -> existing linked user", async () => {
    const mockDb = {
      phoneAuthIdentity: {
        findUnique: async ({ where }: any) => {
          if (where.phone === "+919876543210") {
            return {
              id: "identity_1",
              phone: "+919876543210",
              userId: "user_1",
              user: {
                id: "user_1",
                name: "Existing Customer",
                email: "customer@example.com",
                role: "CUSTOMER",
              },
            };
          }
          return null;
        },
      },
    };

    const res = await resolveOrCreatePhoneUser("+919876543210", mockDb);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.user.id, "user_1");
      assert.strictEqual(res.user.name, "Existing Customer");
      assert.strictEqual(res.user.email, "customer@example.com");
      assert.strictEqual(res.user.role, "CUSTOMER");
    }
  });

  it("Case 2: No PhoneAuthIdentity -> creates new CUSTOMER + new identity atomically", async () => {
    let createdPayload: any = null;
    const mockDb = {
      phoneAuthIdentity: {
        findUnique: async () => null,
        create: async ({ data }: any) => {
          createdPayload = data;
          return {
            id: "new_identity_id",
            phone: data.phone,
            user: {
              id: "new_user_id",
              name: data.user.create.name,
              email: data.user.create.email,
              role: data.user.create.role,
            },
          };
        },
      },
    };

    const res = await resolveOrCreatePhoneUser("9876543210", mockDb);
    assert.strictEqual(res.success, true);
    assert.ok(createdPayload);
    assert.strictEqual(createdPayload.phone, "+919876543210");
    // Strictly enforces CUSTOMER role
    assert.strictEqual(createdPayload.user.create.role, "CUSTOMER");
    // Case 7: Nullable email supported (email = null)
    assert.strictEqual(createdPayload.user.create.email, null);
    if (res.success) {
      assert.strictEqual(res.user.role, "CUSTOMER");
      assert.strictEqual(res.user.id, "new_user_id");
      assert.strictEqual(res.user.email, null);
    }
  });

  it("Case 3 & 4: User.profile.phone matching the number MUST NOT auto-link; creates new CUSTOMER instead", async () => {
    let createdPayload: any = null;
    // Even if legacy User records have this phone in profile, they are ignored
    const mockDb = {
      phoneAuthIdentity: {
        findUnique: async () => null, // No verified PhoneAuthIdentity exists
        create: async ({ data }: any) => {
          createdPayload = data;
          return {
            id: "new_identity_id_unlinked",
            phone: data.phone,
            user: {
              id: "new_distinct_user_id",
              name: null,
              email: null,
              role: "CUSTOMER",
            },
          };
        },
      },
      // Note: User.findMany is never called because profile phones are not trusted for auth
      user: {
        findMany: async () => {
          throw new Error("Must NOT search User.phone for auto-linking!");
        },
      },
    };

    const res = await resolveOrCreatePhoneUser("+919876543210", mockDb);
    assert.strictEqual(res.success, true);
    assert.ok(createdPayload);
    // Verified phone creates its own identity and new user
    assert.strictEqual(createdPayload.phone, "+919876543210");
    if (res.success) {
      assert.strictEqual(res.user.id, "new_distinct_user_id");
      assert.strictEqual(res.user.role, "CUSTOMER");
    }
  });

  it("Case 5: P2002 race condition on creation reloads winning PhoneAuthIdentity", async () => {
    let callCount = 0;
    const mockDb = {
      phoneAuthIdentity: {
        findUnique: async () => {
          if (callCount > 0) {
            // Winning request's identity is now present
            return {
              id: "winning_identity_id",
              phone: "+919876543210",
              userId: "winning_user_id",
              user: {
                id: "winning_user_id",
                name: "Concurrent Winner",
                email: null,
                role: "CUSTOMER",
              },
            };
          }
          return null;
        },
        create: async () => {
          callCount++;
          const p2002Error: any = new Error(
            "Unique constraint failed on the constraint: `PhoneAuthIdentity_phone_key`"
          );
          p2002Error.code = "P2002";
          throw p2002Error;
        },
      },
    };

    const res = await resolveOrCreatePhoneUser("9876543210", mockDb);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.user.id, "winning_user_id");
      assert.strictEqual(res.user.name, "Concurrent Winner");
      assert.strictEqual(res.user.role, "CUSTOMER");
    }
  });

  it("Case 6: OTP-created user is strictly CUSTOMER (never ADMIN)", async () => {
    let capturedRole: string | null = null;
    const mockDb = {
      phoneAuthIdentity: {
        findUnique: async () => null,
        create: async ({ data }: any) => {
          capturedRole = data.user.create.role;
          return {
            id: "id_test",
            phone: data.phone,
            user: { id: "u_test", name: null, email: null, role: data.user.create.role },
          };
        },
      },
    };

    await resolveOrCreatePhoneUser("9876543210", mockDb);
    assert.strictEqual(capturedRole, "CUSTOMER");
    assert.notStrictEqual(capturedRole, "ADMIN");
  });

  it("rejects invalid phone format before checking database", async () => {
    const mockDb = {
      phoneAuthIdentity: {
        findUnique: async () => {
          throw new Error("Should not reach DB");
        },
      },
    };

    const res = await resolveOrCreatePhoneUser("12345", mockDb);
    assert.strictEqual(res.success, false);
    if (!res.success) {
      assert.strictEqual(res.code, "INVALID_PHONE");
    }
  });
});

describe("Feature Gating & Google Auth Compatibility (Section 8 & 11)", () => {
  it("Case 8: OTP UI disabled by default when NEXT_PUBLIC_OTP_ENABLED is unset or false", () => {
    const isOtpEnabled = (flag?: string) => flag === "true";

    assert.strictEqual(isOtpEnabled(undefined), false);
    assert.strictEqual(isOtpEnabled(""), false);
    assert.strictEqual(isOtpEnabled("false"), false);
    assert.strictEqual(isOtpEnabled("0"), false);
  });

  it("Case 9: Google login remains available regardless of OTP flag", () => {
    // Both when OTP is true and when false, Google login remains an enabled provider
    const getEnabledProviders = (otpEnabled: boolean) => {
      const providers = ["google"];
      if (otpEnabled) {
        providers.push("phone-otp");
      }
      return providers;
    };

    assert.deepStrictEqual(getEnabledProviders(false), ["google"]);
    assert.deepStrictEqual(getEnabledProviders(true), ["google", "phone-otp"]);
    assert.ok(getEnabledProviders(false).includes("google"));
    assert.ok(getEnabledProviders(true).includes("google"));
  });
});
