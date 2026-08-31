import Link from "next/link";
import { auth, signOut } from "@/app/api/auth/[...nextauth]/route";

/**
 * Server component header.
 * Renders navigation and auth state.
 */
export async function Header() {
  const session = await auth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-gray-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 flex items-center justify-between h-16">
        <Link href="/" className="font-serif text-xl tracking-wide">
          KNOOS
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/men" className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
            Men
          </Link>
          <Link href="/women" className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
            Women
          </Link>
          <Link href="/search" className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
            Search
          </Link>
        </nav>

        <div className="flex items-center gap-6">
          <Link href="/cart" className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
            Cart
          </Link>
          {session?.user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/account"
                className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors"
              >
                {session.user.name ?? "Account"}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button type="submit" className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <Link href="/" className="font-mono text-xs uppercase tracking-widest hover:text-brand-gray-600 transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
