/**
 * SMS Provider Abstraction and Implementation.
 *
 * Current Status:
 * SMS provider credentials have not been configured by the project owner.
 * The system defaults to UnconfiguredSmsProvider which fails gracefully
 * with OTP_SERVICE_UNAVAILABLE without leaking OTPs or generating unhandled errors.
 */

import { SmsProvider, SmsSendResult } from "./types";

export class UnconfiguredSmsProvider implements SmsProvider {
  readonly name = "unconfigured";

  isConfigured(): boolean {
    return false;
  }

  async sendOtp(_phone: string, _otp: string): Promise<SmsSendResult> {
    return {
      success: false,
      error: "OTP_SERVICE_UNAVAILABLE",
    };
  }
}

/**
 * In-memory / mock SMS provider for automated testing environments only.
 */
export class TestSmsProvider implements SmsProvider {
  readonly name = "test";
  public lastSentPhone: string | null = null;
  public lastSentOtp: string | null = null;
  public shouldFail = false;

  isConfigured(): boolean {
    return true;
  }

  async sendOtp(phone: string, otp: string): Promise<SmsSendResult> {
    if (this.shouldFail) {
      return { success: false, error: "OTP_DELIVERY_FAILED" };
    }
    this.lastSentPhone = phone;
    this.lastSentOtp = otp;
    return { success: true, providerMessageId: "test-msg-id" };
  }
}

let activeProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (activeProvider) {
    return activeProvider;
  }

  activeProvider = new UnconfiguredSmsProvider();
  return activeProvider;
}

/**
 * Overrides active SMS provider (used for test isolation).
 */
export function setSmsProviderForTesting(provider: SmsProvider | null): void {
  activeProvider = provider;
}

export * from "./types";
