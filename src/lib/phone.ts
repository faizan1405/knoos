/**
 * Phone Number Utilities — Canonical Indian Mobile Normalization & Validation.
 *
 * Canonical internal format: E.164 (+91XXXXXXXXXX)
 * Validation: Exactly 10 digits starting with 6, 7, 8, or 9.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  /** Normalized E.164 format: +91XXXXXXXXXX */
  normalized?: string;
  /** Pure 10-digit national number */
  digits?: string;
  error?: string;
}

/**
 * Normalizes and validates an Indian mobile number.
 * Accepts inputs like:
 * - "9876543210"
 * - "+919876543210"
 * - "09876543210"
 * - "+91 98765 43210"
 * - "98765-43210"
 */
export function normalizeIndianMobile(rawInput: string | null | undefined): PhoneValidationResult {
  if (!rawInput || typeof rawInput !== "string") {
    return { isValid: false, error: "Phone number is required." };
  }

  // Remove whitespace, dashes, parens, dots
  let cleaned = rawInput.replace(/[\s\-\(\)\.]/g, "").trim();

  // Strip leading international prefix if present
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith("0091")) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // At this point, cleaned should be exactly 10 digits
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: "Phone number must contain only numeric digits." };
  }

  if (cleaned.length !== 10) {
    return { isValid: false, error: "Please enter a valid 10-digit mobile number." };
  }

  // First digit must be 6, 7, 8, or 9 for Indian mobile numbers
  if (!/^[6-9]/.test(cleaned)) {
    return {
      isValid: false,
      error: "Indian mobile numbers must begin with 6, 7, 8, or 9.",
    };
  }

  const normalized = `+91${cleaned}`;

  return {
    isValid: true,
    normalized,
    digits: cleaned,
  };
}

/**
 * Formats a normalized E.164 Indian mobile number for display.
 * E.g., "+91 98765 43210"
 */
export function formatPhoneDisplay(e164OrDigits: string | null | undefined): string {
  if (!e164OrDigits) return "";
  const result = normalizeIndianMobile(e164OrDigits);
  if (!result.isValid || !result.digits) return e164OrDigits;

  const d = result.digits;
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}
