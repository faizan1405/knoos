"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function AdminLogin() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    console.log("[LOGIN DEBUG] handleSubmit fired");
    setIsPending(true);
    setError(null);
    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      console.log("[LOGIN DEBUG] calling signIn", {
        email,
        hasPassword: Boolean(password),
      });

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("[LOGIN DEBUG] signIn result", result);

      if (result?.error) {
        setError("Invalid email or password.");
        setIsPending(false);
      } else if (result?.ok) {
        window.location.href = "/admin";
      } else {
        setIsPending(false);
      }
    } catch (e) {
      console.error("[LOGIN DEBUG] signIn threw", e);
      setError("An unexpected error occurred.");
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-brand-gray-200">
        <div className="flex flex-col items-center">
          <Image
            src="/knoos-logo.png"
            alt="KNOOS Admin"
            width={120}
            height={80}
            priority
            className="h-10 w-auto object-contain"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-black">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-brand-gray-500">
            Sign in to manage your store
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          await handleSubmit(formData);
        }}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-brand-gray-300 placeholder-brand-gray-400 text-brand-black rounded-md focus:outline-none focus:ring-brand-black focus:border-brand-black focus:z-10 sm:text-sm mt-1"
                placeholder="admin@knoos.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-brand-gray-300 placeholder-brand-gray-400 text-brand-black rounded-md focus:outline-none focus:ring-brand-black focus:border-brand-black focus:z-10 sm:text-sm mt-1"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-black hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
