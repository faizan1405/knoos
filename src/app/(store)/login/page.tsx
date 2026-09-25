import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CustomerLoginForm } from "@/components/auth/CustomerLoginForm";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign In — KNOOS",
  description: "Sign in to your KNOOS account using mobile OTP or Google.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl || "/";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white border border-brand-sky-border/80 rounded-2xl shadow-xl p-8 sm:p-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <Image
              src="/knoos-logo.png"
              alt="KNOOS"
              width={140}
              height={90}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        <CustomerLoginForm redirectTo={callbackUrl} />
      </div>
    </main>
  );
}
