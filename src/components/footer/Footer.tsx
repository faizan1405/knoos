import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-brand-gray-100 bg-brand-gray-50 text-brand-black">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="font-serif text-2xl tracking-wide inline-block">
              KNOOS
            </Link>
            <p className="font-serif italic text-brand-gray-600 text-sm">
              Comfort In Every Step
            </p>
            <p className="text-brand-gray-500 text-xs leading-relaxed max-w-xs">
              Premium footwear designed for everyday comfort and refined elegance by KRIPA KIRAN SHOE COMPANY.
            </p>
            <div className="pt-2">
              <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block mb-2">
                Social
              </span>
              <a
                href="https://www.instagram.com/knoosshoes"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-brand-gray-600 hover:text-black transition-colors"
              >
                <span>Instagram:</span>
                <span className="font-mono font-medium text-black">@KNOOSSHOES</span>
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 mb-4">
              Shop
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm text-brand-gray-600 hover:text-black transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/men" className="text-sm text-brand-gray-600 hover:text-black transition-colors">
                  Men
                </Link>
              </li>
              <li>
                <Link href="/women" className="text-sm text-brand-gray-600 hover:text-black transition-colors">
                  Women
                </Link>
              </li>
            </ul>
          </div>

          {/* Information Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 mb-4">
              Information
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-brand-gray-600 hover:text-black transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-brand-gray-600 hover:text-black transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/returns-refunds" className="text-sm text-brand-gray-600 hover:text-black transition-colors">
                  Return &amp; Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-brand-gray-600 hover:text-black transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-brand-gray-600 hover:text-black transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 mb-4">
              Contact
            </h4>
            <div className="space-y-3 text-sm text-brand-gray-600">
              <div className="font-medium text-black">
                KRIPA KIRAN SHOE COMPANY
              </div>
              <p className="text-xs leading-relaxed text-brand-gray-500">
                15/5 SORON KTRA SHAHGANJ<br />
                AGRA - 282010
              </p>
              <div className="pt-1 space-y-1 text-xs">
                <p>
                  <span className="text-brand-gray-400">Phone / WhatsApp: </span>
                  <a href="tel:7088808882" className="text-black hover:underline font-mono">
                    7088808882
                  </a>
                </p>
                <p>
                  <span className="text-brand-gray-400">Email: </span>
                  <a href="mailto:KKSHOECOMPANY@GMAIL.COM" className="text-black hover:underline font-mono">
                    KKSHOECOMPANY@GMAIL.COM
                  </a>
                </p>
                <p>
                  <span className="text-brand-gray-400">Hours: </span>
                  <span className="text-black">10 AM – 7 PM</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-gray-200 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-brand-gray-400 text-center sm:text-left">
            &copy; {new Date().getFullYear()} KNOOS (KRIPA KIRAN SHOE COMPANY). All rights reserved.
          </p>
          <p className="font-mono text-xs text-brand-gray-400 text-center sm:text-right">
            Comfort In Every Step
          </p>
        </div>
      </div>
    </footer>
  );
}
