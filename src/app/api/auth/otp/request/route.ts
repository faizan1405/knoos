/**
 * POST /api/auth/otp/request
 *
 * Initiates an OTP request for phone login.
 * Validates the Indian mobile number, enforces cooldown, and dispatches the OTP.
 * When SMS delivery is unconfigured/unavailable, returns 503 with OTP_SERVICE_UNAVAILABLE.
 *
 * Never returns the OTP in response.
 * Never logs the OTP code.
 */

import { NextResponse } from "next/server";
import { requestOtpChallenge } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.phone !== "string") {
      return NextResponse.json(
        { error: "Valid phone number is required.", code: "INVALID_PHONE" },
        { status: 400 }
      );
    }

    const result = await requestOtpChallenge(body.phone);

    if (!result.success) {
      if (result.code === "OTP_SERVICE_UNAVAILABLE") {
        return NextResponse.json(
          {
            error: "SMS service is currently unavailable. Please sign in with Google or try again later.",
            code: "OTP_SERVICE_UNAVAILABLE",
          },
          { status: 503 }
        );
      }

      if (result.code === "COOLDOWN_ACTIVE") {
        return NextResponse.json(
          {
            error: result.error,
            code: "COOLDOWN_ACTIVE",
            cooldownRemaining: result.cooldownRemainingSeconds,
          },
          { status: 429 }
        );
      }

      if (result.code === "INVALID_PHONE") {
        return NextResponse.json(
          { error: result.error, code: "INVALID_PHONE" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: result.error || "Failed to request OTP.", code: result.code || "REQUEST_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("OTP request error occurred");
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}
