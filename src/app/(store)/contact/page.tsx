import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us | KNOOS",
  description: "Get in touch with KNOOS customer support. Reach KRIPA KIRAN SHOE COMPANY via phone, WhatsApp, or email for inquiries and support.",
};

export default function ContactPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16 md:py-24">
      {/* Header section */}
      <div className="max-w-3xl mb-16">
        <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block mb-3">
          Customer Support &amp; Inquiries
        </span>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6">
          Contact Us
        </h1>
        <p className="text-brand-gray-600 text-base md:text-lg leading-relaxed">
          We are here to assist you with order inquiries, sizing questions, product details, and return requests. Reach out to the KNOOS customer support team through any of our direct channels below.
        </p>
      </div>

      {/* Primary Direct Action CTAs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {/* Call CTA */}
        <div className="border border-brand-gray-200 bg-white p-8 flex flex-col justify-between hover:border-black transition-colors">
          <div>
            <div className="w-10 h-10 rounded-full bg-brand-gray-100 flex items-center justify-center mb-6">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block mb-1">
              Direct Phone
            </span>
            <h2 className="font-serif text-2xl mb-2">Call Us</h2>
            <p className="text-sm text-brand-gray-500 mb-6 leading-relaxed">
              Speak directly with our support team during business hours.
            </p>
            <p className="font-mono text-base font-medium text-black mb-6">
              7088808882
            </p>
          </div>
          <a
            href="tel:7088808882"
            className="inline-flex items-center justify-center w-full py-3 px-4 bg-brand-black text-white text-xs font-mono uppercase tracking-widest hover:bg-brand-gray-800 transition-colors"
          >
            Call 7088808882
          </a>
        </div>

        {/* WhatsApp CTA */}
        <div className="border border-brand-gray-200 bg-white p-8 flex flex-col justify-between hover:border-black transition-colors">
          <div>
            <div className="w-10 h-10 rounded-full bg-brand-gray-100 flex items-center justify-center mb-6">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block mb-1">
              Instant Messaging
            </span>
            <h2 className="font-serif text-2xl mb-2">WhatsApp</h2>
            <p className="text-sm text-brand-gray-500 mb-6 leading-relaxed">
              Send a quick message, photos, or unboxing videos for instant assistance.
            </p>
            <p className="font-mono text-base font-medium text-black mb-6">
              7088808882
            </p>
          </div>
          <a
            href="https://wa.me/917088808882"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full py-3 px-4 bg-brand-black text-white text-xs font-mono uppercase tracking-widest hover:bg-brand-gray-800 transition-colors"
          >
            Chat on WhatsApp
          </a>
        </div>

        {/* Email CTA */}
        <div className="border border-brand-gray-200 bg-white p-8 flex flex-col justify-between hover:border-black transition-colors">
          <div>
            <div className="w-10 h-10 rounded-full bg-brand-gray-100 flex items-center justify-center mb-6">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block mb-1">
              Email Support
            </span>
            <h2 className="font-serif text-2xl mb-2">Email Us</h2>
            <p className="text-sm text-brand-gray-500 mb-6 leading-relaxed">
              Send us detailed inquiries or official return/exchange documentation.
            </p>
            <p className="font-mono text-xs md:text-sm font-medium text-black mb-6 break-all">
              KKSHOECOMPANY@GMAIL.COM
            </p>
          </div>
          <a
            href="mailto:KKSHOECOMPANY@GMAIL.COM"
            className="inline-flex items-center justify-center w-full py-3 px-4 bg-brand-black text-white text-xs font-mono uppercase tracking-widest hover:bg-brand-gray-800 transition-colors"
          >
            Send Email
          </a>
        </div>
      </div>

      {/* Official Business Information Section */}
      <div className="border border-brand-gray-200 bg-white p-8 md:p-12">
        <h2 className="font-serif text-2xl md:text-3xl mb-8">
          Business &amp; Operations Details
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block mb-2">
              Brand &amp; Company
            </span>
            <div className="font-medium text-black text-base">KNOOS</div>
            <div className="text-sm text-brand-gray-600 mt-1">KRIPA KIRAN SHOE COMPANY</div>
          </div>

          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block mb-2">
              Registered Address
            </span>
            <address className="not-italic text-sm text-brand-gray-600 leading-relaxed">
              15/5 SORON KTRA SHAHGANJ<br />
              AGRA - 282010
            </address>
          </div>

          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block mb-2">
              Operating Hours
            </span>
            <div className="text-sm text-brand-gray-600">
              Monday – Sunday<br />
              <span className="font-medium text-black">10 AM – 7 PM</span>
            </div>
          </div>

          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-brand-gray-400 block mb-2">
              Instagram
            </span>
            <a
              href="https://www.instagram.com/knoosshoes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-black hover:underline"
            >
              @KNOOSSHOES
            </a>
          </div>
        </div>
      </div>

      {/* Helpful Links */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-brand-gray-200 pt-8">
        <span className="text-xs text-brand-gray-500 font-mono">
          Looking for policy details?
        </span>
        <div className="flex flex-wrap items-center gap-6 text-xs font-mono uppercase tracking-widest">
          <Link href="/returns-refunds" className="text-brand-gray-600 hover:text-black transition-colors">
            Return &amp; Refund Policy &rarr;
          </Link>
          <Link href="/terms" className="text-brand-gray-600 hover:text-black transition-colors">
            Terms &amp; Conditions &rarr;
          </Link>
          <Link href="/privacy" className="text-brand-gray-600 hover:text-black transition-colors">
            Privacy Policy &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
