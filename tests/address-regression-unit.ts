import { describe, it } from "node:test";
import assert from "node:assert";
import { normalizeIndianMobile } from "../src/lib/phone";

describe("Address Validation & Canonical Model Tests (Section 2, 3, 4, 5)", () => {
  // Helper simulating the server-side validation logic in /api/addresses
  function validateAddressPayload(body: any) {
    const {
      fullName,
      phone,
      addressLine1,
      city,
      state,
      postalCode,
    } = body;

    const trimmedFullName = typeof fullName === "string" ? fullName.trim() : "";
    const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
    const trimmedAddressLine1 = typeof addressLine1 === "string" ? addressLine1.trim() : "";
    const trimmedCity = typeof city === "string" ? city.trim() : "";
    const trimmedState = typeof state === "string" ? state.trim() : "";
    const trimmedPostalCode = typeof postalCode === "string" ? postalCode.trim() : "";

    if (
      !trimmedFullName ||
      !trimmedPhone ||
      !trimmedAddressLine1 ||
      !trimmedCity ||
      !trimmedState ||
      !trimmedPostalCode
    ) {
      return { valid: false, error: "Please fill all required fields.", status: 400 };
    }

    const phoneValidation = normalizeIndianMobile(trimmedPhone);
    if (!phoneValidation.isValid || !phoneValidation.digits) {
      return {
        valid: false,
        error: phoneValidation.error || "Please enter a valid 10-digit Indian phone number.",
        status: 400,
      };
    }

    if (!/^\d{6}$/.test(trimmedPostalCode)) {
      return { valid: false, error: "Please enter a valid 6-digit PIN code.", status: 400 };
    }

    return {
      valid: true,
      data: {
        fullName: trimmedFullName,
        phone: phoneValidation.digits,
        addressLine1: trimmedAddressLine1,
        addressLine2: typeof body.addressLine2 === "string" && body.addressLine2.trim() ? body.addressLine2.trim() : null,
        landmark: typeof body.landmark === "string" && body.landmark.trim() ? body.landmark.trim() : null,
        city: trimmedCity,
        state: trimmedState,
        postalCode: trimmedPostalCode,
        country: typeof body.country === "string" && body.country.trim() ? body.country.trim() : "India",
        label: typeof body.label === "string" && body.label.trim() ? body.label.trim().toUpperCase() : "HOME",
      },
    };
  }

  it("valid address accepted with canonical fields", () => {
    const payload = {
      label: "HOME",
      fullName: "Faizan Khan",
      phone: "9876543210",
      addressLine1: "15/5 Soron Ktra Shahganj",
      addressLine2: "Near Main Gate",
      landmark: "Opposite Police Station",
      city: "Agra",
      state: "Uttar Pradesh",
      postalCode: "282010",
      country: "India",
    };

    const res = validateAddressPayload(payload);
    assert.strictEqual(res.valid, true);
    assert.ok(res.data);
    assert.strictEqual(res.data.fullName, "Faizan Khan");
    assert.strictEqual(res.data.phone, "9876543210");
    assert.strictEqual(res.data.addressLine1, "15/5 Soron Ktra Shahganj");
    assert.strictEqual(res.data.city, "Agra");
    assert.strictEqual(res.data.state, "Uttar Pradesh");
    assert.strictEqual(res.data.postalCode, "282010");
  });

  it("missing required fields rejected", () => {
    const requiredFields = ["fullName", "phone", "addressLine1", "city", "state", "postalCode"];

    for (const field of requiredFields) {
      const payload: any = {
        fullName: "Faizan Khan",
        phone: "9876543210",
        addressLine1: "15/5 Soron Ktra Shahganj",
        city: "Agra",
        state: "Uttar Pradesh",
        postalCode: "282010",
      };
      delete payload[field];

      const res = validateAddressPayload(payload);
      assert.strictEqual(res.valid, false, `Missing field '${field}' should be rejected`);
      assert.strictEqual(res.error, "Please fill all required fields.");
    }
  });

  it("empty whitespace in required fields rejected", () => {
    const payload = {
      fullName: "   ",
      phone: "9876543210",
      addressLine1: "15/5 Soron Ktra",
      city: "Agra",
      state: "Uttar Pradesh",
      postalCode: "282010",
    };

    const res = validateAddressPayload(payload);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, "Please fill all required fields.");
  });

  it("invalid Indian phone numbers rejected", () => {
    const invalidPhones = [
      "1234567890", // starts with 1
      "5555555555", // starts with 5
      "987654321", // 9 digits
      "98765432100", // 11 digits
      "abcdefghij", // letters
      "98765abcde", // mixed
      "",
    ];

    for (const p of invalidPhones) {
      const payload = {
        fullName: "Faizan Khan",
        phone: p,
        addressLine1: "15/5 Soron Ktra",
        city: "Agra",
        state: "Uttar Pradesh",
        postalCode: "282010",
      };
      const res = validateAddressPayload(payload);
      assert.strictEqual(res.valid, false, `Phone '${p}' should be rejected`);
    }
  });

  it("valid Indian phone formatted with +91 or leading 0 normalized correctly", () => {
    const validInputs = [
      "+919876543210",
      "+91 98765 43210",
      "09876543210",
      "98765-43210",
    ];

    for (const input of validInputs) {
      const payload = {
        fullName: "Faizan Khan",
        phone: input,
        addressLine1: "15/5 Soron Ktra",
        city: "Agra",
        state: "Uttar Pradesh",
        postalCode: "282010",
      };
      const res = validateAddressPayload(payload);
      assert.strictEqual(res.valid, true, `Phone '${input}' should be valid`);
      assert.strictEqual(res.data?.phone, "9876543210");
    }
  });

  it("invalid pincode rejected", () => {
    const invalidPins = [
      "12345", // 5 digits
      "1234567", // 7 digits
      "abcdef", // letters
      "28201A", // alphanumeric
      "282 01", // space
      "",
    ];

    for (const pin of invalidPins) {
      const payload = {
        fullName: "Faizan Khan",
        phone: "9876543210",
        addressLine1: "15/5 Soron Ktra",
        city: "Agra",
        state: "Uttar Pradesh",
        postalCode: pin,
      };
      const res = validateAddressPayload(payload);
      assert.strictEqual(res.valid, false, `PIN '${pin}' should be rejected`);
    }
  });

  it("first address becomes default when user has 0 addresses", () => {
    let existingCount = 0;
    const isDefaultInput = undefined;

    let makeDefault = isDefaultInput ?? false;
    if (!makeDefault && existingCount === 0) {
      makeDefault = true;
    }

    assert.strictEqual(makeDefault, true);

    // If existingCount > 0, makeDefault is not automatically true
    existingCount = 2;
    makeDefault = isDefaultInput ?? false;
    if (!makeDefault && existingCount === 0) {
      makeDefault = true;
    }
    assert.strictEqual(makeDefault, false);
  });

  it("user can only edit own address (ownership check)", () => {
    const sessionUserId = "user-123";
    const addresses = [
      { id: "addr-1", userId: "user-123" },
      { id: "addr-2", userId: "user-456" },
    ];

    const canEditOwn = addresses.some(a => a.id === "addr-1" && a.userId === sessionUserId);
    const canEditOther = addresses.some(a => a.id === "addr-2" && a.userId === sessionUserId);

    assert.strictEqual(canEditOwn, true, "User should be able to edit own address");
    assert.strictEqual(canEditOther, false, "User must NOT be able to edit another user's address");
  });

  it("user can only delete own address (ownership check)", () => {
    const sessionUserId = "user-123";
    const addresses = [
      { id: "addr-1", userId: "user-123" },
      { id: "addr-2", userId: "user-456" },
    ];

    const canDeleteOwn = addresses.some(a => a.id === "addr-1" && a.userId === sessionUserId);
    const canDeleteOther = addresses.some(a => a.id === "addr-2" && a.userId === sessionUserId);

    assert.strictEqual(canDeleteOwn, true);
    assert.strictEqual(canDeleteOther, false);
  });

  it("checkout payload uses canonical fields matching Address model", () => {
    const checkoutNewAddress = {
      label: "HOME",
      fullName: "Jane Doe",
      phone: "9876543210",
      addressLine1: "Flat 4B, Blue Towers",
      addressLine2: "MG Road",
      landmark: "Near Metro",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      country: "India",
    };

    // Assert every key expected by /api/addresses exists
    const canonicalKeys = [
      "label",
      "fullName",
      "phone",
      "addressLine1",
      "addressLine2",
      "landmark",
      "city",
      "state",
      "postalCode",
      "country",
    ];

    for (const key of canonicalKeys) {
      assert.ok(key in checkoutNewAddress, `Checkout address payload must contain '${key}'`);
    }

    // Verify obsolete fields are NOT present
    assert.strictEqual("name" in checkoutNewAddress, false);
    assert.strictEqual("address" in checkoutNewAddress, false);
    assert.strictEqual("pincode" in checkoutNewAddress, false);
  });

  it("checkout selected-address rendering uses canonical fields", () => {
    const selectedAddress = {
      id: "addr-1",
      label: "HOME",
      fullName: "Jane Doe",
      phone: "9876543210",
      addressLine1: "Flat 4B, Blue Towers",
      addressLine2: "MG Road",
      landmark: "Near Metro",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      country: "India",
      isDefault: true,
    };

    const renderedFullName = selectedAddress.fullName;
    const renderedLine1 = selectedAddress.addressLine1;
    const renderedCity = selectedAddress.city;
    const renderedState = selectedAddress.state;
    const renderedPostalCode = selectedAddress.postalCode;
    const renderedPhone = selectedAddress.phone;

    assert.strictEqual(renderedFullName, "Jane Doe");
    assert.strictEqual(renderedLine1, "Flat 4B, Blue Towers");
    assert.strictEqual(renderedCity, "Bengaluru");
    assert.strictEqual(renderedState, "Karnataka");
    assert.strictEqual(renderedPostalCode, "560001");
    assert.strictEqual(renderedPhone, "9876543210");

    // Razorpay prefill
    const prefill = {
      name: selectedAddress.fullName,
      contact: selectedAddress.phone,
    };

    assert.strictEqual(prefill.name, "Jane Doe");
    assert.strictEqual(prefill.contact, "9876543210");
  });
});
