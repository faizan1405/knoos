"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { normalizeIndianMobile, formatPhoneDisplay } from "@/lib/phone";
import { AlertCircle, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";

interface CustomerLoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
  className?: string;
}

export function CustomerLoginForm({
  redirectTo = "/",
  onSuccess,
  className = "",
}: CustomerLoginFormProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Focus OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  // Handle requesting OTP
  async function handleRequestOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);

    const validation = normalizeIndianMobile(phoneInput);
    if (!validation.isValid || !validation.normalized) {
      setError(validation.error || "Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: validation.normalized }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.code === "OTP_SERVICE_UNAVAILABLE") {
          setError(
            data.error ||
              "SMS service is currently unavailable. Please sign in with Google or try again later."
          );
        } else if (data.code === "COOLDOWN_ACTIVE") {
          setCooldown(data.cooldownRemaining || 60);
          setError(data.error || "Please wait before requesting a new OTP.");
        } else {
          setError(data.error || "Failed to send OTP. Please try again.");
        }
        return;
      }

      setNormalizedPhone(validation.normalized);
      setStep("otp");
      setCooldown(60);
      setOtpCode("");
    } catch {
      setError("Unable to connect to the server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  // Handle OTP verification & login
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedOtp = otpCode.trim();
    if (!/^\d{6}$/.test(trimmedOtp)) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("phone-otp", {
        phone: normalizedPhone,
        code: trimmedOtp,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid or expired verification code. Please check and try again.");
        setLoading(false);
        return;
      }

      if (result.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = redirectTo;
        }
      }
    } catch {
      setError("Authentication failed. Please try again.");
      setLoading(false);
    }
  }

  // Handle Google OAuth sign in
  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: redirectTo });
    } catch {
      setError("Failed to initialize Google Sign-In.");
      setGoogleLoading(false);
    }
  }

  const isOtpEnabled = process.env.NEXT_PUBLIC_OTP_ENABLED === "true";

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 p-3.5 bg-red-50/90 border border-red-200 text-red-700 text-sm rounded-xl"
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {!isOtpEnabled ? (
        /* OTP DISABLED: GOOGLE SIGN-IN IS PRIMARY & FULLY FUNCTIONAL */
        <div>
          <div className="mb-6">
            <h2 className="font-serif text-2xl text-brand-dark tracking-wide">
              Sign In
            </h2>
            <p className="text-brand-gray-500 text-sm mt-1">
              Sign in with your Google account to access your orders and profile.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-brand-navy text-white hover:bg-brand-blue rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin text-white" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span className="font-mono text-xs uppercase tracking-wider text-white">
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </span>
          </button>

          <div className="mt-6 pt-5 border-t border-brand-sky-border/60 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-brand-gray-400 bg-brand-sky/20 px-3 py-1.5 rounded-lg border border-brand-sky-border/40">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Mobile OTP Login: Temporarily unavailable</span>
            </div>
          </div>
        </div>
      ) : step === "phone" ? (
        /* STEP 1: ENTER MOBILE NUMBER */
        <div>
          <div className="mb-6">
            <h2 className="font-serif text-2xl text-brand-dark tracking-wide">
              Sign In or Register
            </h2>
            <p className="text-brand-gray-500 text-sm mt-1">
              Enter your mobile number to receive a verification OTP.
            </p>
          </div>

          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label
                htmlFor="mobile-input"
                className="block font-mono text-xs uppercase tracking-widest text-brand-blue font-medium mb-2"
              >
                Mobile Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-0 inset-y-0 flex items-center pl-3.5 pr-2.5 pointer-events-none border-r border-brand-sky-border/80">
                  <span className="font-mono text-sm font-semibold text-brand-navy">+91</span>
                </div>
                <input
                  id="mobile-input"
                  name="tel"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  required
                  maxLength={10}
                  value={phoneInput}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhoneInput(cleaned);
                    if (error) setError(null);
                  }}
                  placeholder="98765 43210"
                  className="w-full pl-16 pr-4 py-3 border border-brand-sky-border/80 rounded-xl text-brand-dark placeholder:text-brand-gray-300 font-mono text-base focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phoneInput.length < 10}
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-navy text-white py-3.5 px-6 font-mono text-xs uppercase tracking-widest rounded-xl hover:bg-brand-blue transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <span>Send OTP</span>
              )}
            </button>
          </form>

          {/* Secondary Option Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-sky-border/80" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-mono tracking-widest">
              <span className="bg-white px-3 text-brand-gray-400">or</span>
            </div>
          </div>

          {/* Secondary: Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-brand-sky-border/80 hover:bg-brand-sky/20 rounded-xl text-sm font-medium text-brand-dark transition-colors shadow-sm disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin text-brand-gray-500" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span className="font-mono text-xs uppercase tracking-wider">
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </span>
          </button>
        </div>
      ) : (
        /* STEP 2: ENTER OTP */
        <div>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-brand-gray-500 hover:text-brand-navy mb-4 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Change Number</span>
          </button>

          <div className="mb-6">
            <h2 className="font-serif text-2xl text-brand-dark tracking-wide">
              Verify OTP
            </h2>
            <p className="text-brand-gray-500 text-sm mt-1">
              Enter the 6-digit code sent to{" "}
              <span className="font-mono font-medium text-brand-navy">
                {formatPhoneDisplay(normalizedPhone)}
              </span>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="otp-input"
                  className="font-mono text-xs uppercase tracking-widest text-brand-blue font-medium"
                >
                  6-Digit OTP Code
                </label>
                <span className="text-[11px] text-brand-gray-400 font-mono">
                  Valid for 5 minutes
                </span>
              </div>
              <input
                ref={otpInputRef}
                id="otp-input"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtpCode(cleaned);
                  if (error) setError(null);
                }}
                placeholder="123456"
                className="w-full px-4 py-3 text-center tracking-[0.5em] font-mono text-xl sm:text-2xl border border-brand-sky-border/80 rounded-xl text-brand-dark placeholder:tracking-normal placeholder:text-brand-gray-300 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-navy text-white py-3.5 px-6 font-mono text-xs uppercase tracking-widest rounded-xl hover:bg-brand-blue transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify &amp; Login</span>
              )}
            </button>

            {/* Resend Cooldown */}
            <div className="text-center pt-2">
              {cooldown > 0 ? (
                <p className="text-xs font-mono text-brand-gray-400">
                  Resend OTP in <span className="font-medium text-brand-navy">{cooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={loading}
                  className="text-xs font-mono uppercase tracking-wider text-brand-blue hover:text-brand-navy underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
