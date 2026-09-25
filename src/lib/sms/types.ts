/**
 * SMS Provider Abstraction Interface.
 *
 * Defines contract for sending one-time verification passcodes (OTP).
 * When no production provider is configured, the system uses the unconfigured
 * provider which safely signals unavailable SMS service without leaking OTPs.
 */

export interface SmsSendResult {
  success: boolean;
  error?: string;
  providerMessageId?: string;
}

export interface SmsProvider {
  readonly name: string;
  /** Returns true if all required API keys/credentials are configured in the environment */
  isConfigured(): boolean;
  /** Sends an OTP code to a normalized E.164 phone number */
  sendOtp(phone: string, otp: string): Promise<SmsSendResult>;
}
